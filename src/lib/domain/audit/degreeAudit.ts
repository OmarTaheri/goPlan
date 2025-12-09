/**
 * Degree Audit Engine
 *
 * This module computes degree progress for a student by:
 * 1. Fetching student's programs (major/minor/concentration)
 * 2. Loading all requirement groups for those programs
 * 3. Matching transcript records against requirements
 * 4. Computing progress percentages and identifying missing courses
 *
 * The output is deterministic: same DB state = same result.
 */

import { query } from '@/lib/db/query';
import {
  StudentProfileRow,
  StudentTranscriptRow,
  ProgramRow,
  ProgramRequirementGroupRow,
  RequirementGroupCourseRow,
  StudentProgramRow,
} from '@/lib/db/types';
import {
  AuditResult,
  BucketAudit,
  CourseAuditStatus,
  CourseStatus,
  FullAuditResult,
  OverallProgress,
  AuditWarning,
  isPassingGrade,
  BucketProgress,
} from './types';

interface TranscriptWithCourse extends StudentTranscriptRow {
  course_code: string;
  title: string;
  credits: number;
  semester_name?: string;
}

interface RequirementCourseWithDetails extends RequirementGroupCourseRow {
  course_code: string;
  title: string;
  credits: number;
}

/**
 * Fetches student profile with program information
 */
async function getStudentProfile(studentId: number): Promise<StudentProfileRow | null> {
  const sql = `
    SELECT * FROM student_profiles
    WHERE user_id = ?
  `;
  const [rows] = await query<StudentProfileRow>(sql, [studentId]);
  return rows[0] || null;
}

/**
 * Fetches student's assigned programs (major/minor/concentration)
 */
async function getStudentPrograms(studentId: number) {
  const sql = `
    SELECT program_id, type, is_primary
    FROM student_programs
    WHERE student_id = ?
  `;
  const [rows] = await query<StudentProgramRow>(sql, [studentId]);
  const normalized = rows.map(p => ({
    ...p,
    is_primary: Boolean(p.is_primary),
  }));

  const majorProgram = normalized.find(p => p.type === 'MAJOR' && p.is_primary) ||
    normalized.find(p => p.type === 'MAJOR');
  const minorProgram = normalized.find(p => p.type === 'MINOR');
  const concentrationProgram = normalized.find(p => p.type === 'CONCENTRATION');

  return {
    assignments: normalized,
    majorProgramId: majorProgram?.program_id,
    minorProgramId: minorProgram?.program_id,
    concentrationProgramId: concentrationProgram?.program_id,
  };
}

/**
 * Fetches program details by ID
 */
async function getProgram(programId: number): Promise<ProgramRow | null> {
  const sql = `SELECT * FROM programs WHERE program_id = ?`;
  const [rows] = await query<ProgramRow>(sql, [programId]);
  return rows[0] || null;
}

/**
 * Fetches all requirement groups for a program (including nested groups)
 */
async function getRequirementGroups(programId: number): Promise<ProgramRequirementGroupRow[]> {
  const sql = `
    SELECT * FROM program_requirement_groups
    WHERE program_id = ?
    ORDER BY ISNULL(parent_group_id) DESC, parent_group_id, name
  `;
  const [rows] = await query<ProgramRequirementGroupRow>(sql, [programId]);
  return rows;
}

/**
 * Fetches all courses linked to a requirement group
 */
async function getGroupCourses(groupId: number): Promise<RequirementCourseWithDetails[]> {
  const sql = `
    SELECT rgc.*, c.course_code, c.title, c.credits
    FROM requirement_group_courses rgc
    JOIN courses c ON rgc.course_id = c.course_id
    WHERE rgc.group_id = ?
    ORDER BY c.course_code
  `;
  const [rows] = await query<RequirementCourseWithDetails>(sql, [groupId]);
  return rows;
}

/**
 * Fetches student transcript with course details
 */
async function getStudentTranscript(studentId: number): Promise<TranscriptWithCourse[]> {
  const sql = `
    SELECT
      t.*,
      c.course_code,
      c.title,
      c.credits,
      s.name as semester_name
    FROM student_transcript t
    JOIN courses c ON t.course_id = c.course_id
    LEFT JOIN semesters s ON t.semester_id = s.semester_id
    WHERE t.student_id = ?
    ORDER BY s.start_date DESC, c.course_code
  `;
  const [rows] = await query<TranscriptWithCourse>(sql, [studentId]);
  return rows;
}

/**
 * Fetches any waivers/overrides for the student
 * For now, returns empty array - will be implemented when override table is added
 */
async function getStudentWaivers(studentId: number): Promise<number[]> {
  // TODO: Implement when override table is added to schema
  // This will return an array of course_ids that have been waived
  return [];
}

/**
 * Determines course status based on transcript records
 */
function determineCourseStatus(
  courseId: number,
  transcript: TranscriptWithCourse[],
  waivedCourseIds: number[]
): { status: CourseStatus; grade?: string; semesterName?: string } {
  // Check if waived
  if (waivedCourseIds.includes(courseId)) {
    return { status: 'WAIVED' };
  }

  // Find matching transcript records
  const records = transcript.filter(t => t.course_id === courseId);

  if (records.length === 0) {
    return { status: 'MISSING' };
  }

  // Check for in-progress
  const inProgress = records.find(r => r.status === 'IN_PROGRESS');
  if (inProgress) {
    return {
      status: 'IN_PROGRESS',
      semesterName: inProgress.semester_name
    };
  }

  // Check for completed with passing grade
  const completed = records.find(r =>
    (r.status === 'COMPLETED' || r.status === 'TRANSFER') &&
    isPassingGrade(r.grade)
  );

  if (completed) {
    return {
      status: 'DONE',
      grade: completed.grade || undefined,
      semesterName: completed.semester_name
    };
  }

  // Failed - count as missing (needs to retake)
  return { status: 'MISSING' };
}

/**
 * Computes progress for a bucket
 */
function computeBucketProgress(courses: CourseAuditStatus[], group: ProgramRequirementGroupRow): BucketProgress {
  const doneCourses = courses.filter(c => c.status === 'DONE' || c.status === 'WAIVED');
  const inProgressCourses = courses.filter(c => c.status === 'IN_PROGRESS');

  const creditsDone = doneCourses.reduce((sum, c) => sum + c.credits, 0);
  const creditsInProgress = inProgressCourses.reduce((sum, c) => sum + c.credits, 0);
  const creditsRequired = group.credits_required || courses.reduce((sum, c) => sum + c.credits, 0);

  const coursesDone = doneCourses.length;
  const coursesRequired = group.min_courses_required || courses.length;

  // Calculate percentage (count in-progress as partial credit)
  const totalProgress = creditsDone + (creditsInProgress * 0.5);
  const percent = creditsRequired > 0
    ? Math.min(Math.round((totalProgress / creditsRequired) * 100), 100)
    : 100;

  return {
    creditsDone,
    creditsRequired,
    coursesDone,
    coursesRequired,
    percent,
  };
}

/**
 * Builds hierarchical bucket structure
 */
function buildBucketHierarchy(
  groups: ProgramRequirementGroupRow[],
  groupCourses: Map<number, RequirementCourseWithDetails[]>,
  transcript: TranscriptWithCourse[],
  waivedCourseIds: number[]
): BucketAudit[] {
  const bucketMap = new Map<number, BucketAudit>();
  const groupMap = new Map(groups.map(group => [group.group_id, group]));

  // First pass: create all buckets
  for (const group of groups) {
    const courses = groupCourses.get(group.group_id) || [];

    const courseStatuses: CourseAuditStatus[] = courses.map(course => {
      const statusInfo = determineCourseStatus(course.course_id, transcript, waivedCourseIds);
      return {
        courseId: course.course_id,
        courseCode: course.course_code,
        title: course.title,
        credits: course.credits,
        status: statusInfo.status,
        grade: statusInfo.grade,
        semesterName: statusInfo.semesterName,
        isMandatory: course.is_mandatory,
      };
    });

    const bucket: BucketAudit = {
      groupId: group.group_id,
      name: group.name,
      parentGroupId: group.parent_group_id,
      courses: courseStatuses,
      progress: {
        creditsDone: 0,
        creditsRequired: group.credits_required || courseStatuses.reduce((sum, c) => sum + c.credits, 0),
        coursesDone: 0,
        coursesRequired: group.min_courses_required || courseStatuses.length,
        percent: 0,
      },
      children: [],
    };

    bucketMap.set(group.group_id, bucket);
  }

  // Second pass: build hierarchy
  const rootBuckets: BucketAudit[] = [];

  for (const [groupId, bucket] of bucketMap) {
    if (bucket.parentGroupId && bucketMap.has(bucket.parentGroupId)) {
      bucketMap.get(bucket.parentGroupId)!.children.push(bucket);
    } else {
      rootBuckets.push(bucket);
    }
  }

  // Recompute progress so parents include their children's courses
  function computeWithChildren(bucket: BucketAudit): CourseAuditStatus[] {
    const childCourses = bucket.children.flatMap(child => computeWithChildren(child));
    const allCourses = [...bucket.courses, ...childCourses];
    const group = groupMap.get(bucket.groupId);
    if (group) {
      bucket.progress = computeBucketProgress(allCourses, group);
    }
    return allCourses;
  }

  rootBuckets.forEach(computeWithChildren);

  return rootBuckets;
}

/**
 * Computes overall progress from all buckets
 */
function computeOverallProgress(buckets: BucketAudit[], totalCreditsRequired: number): OverallProgress {
  let creditsDone = 0;
  let coursesDone = 0;
  let totalCourses = 0;

  function processBucket(bucket: BucketAudit) {
    for (const course of bucket.courses) {
      totalCourses++;
      if (course.status === 'DONE' || course.status === 'WAIVED') {
        creditsDone += course.credits;
        coursesDone++;
      }
    }
    for (const child of bucket.children) {
      processBucket(child);
    }
  }

  for (const bucket of buckets) {
    processBucket(bucket);
  }

  const percentComplete = totalCreditsRequired > 0
    ? Math.min(Math.round((creditsDone / totalCreditsRequired) * 100), 100)
    : 100;

  return {
    percentComplete,
    creditsDone,
    creditsRequired: totalCreditsRequired,
    coursesDone,
    totalCourses,
  };
}

/**
 * Maps transcript status to audit course status
 */
function mapTranscriptStatusToAudit(status: string): CourseStatus {
  switch (status) {
    case 'COMPLETED':
    case 'TRANSFER':
      return 'DONE';
    case 'IN_PROGRESS':
      return 'IN_PROGRESS';
    default:
      return 'MISSING';
  }
}

/**
 * Generates warnings based on audit analysis
 */
function generateWarnings(
  buckets: BucketAudit[],
  transcript: TranscriptWithCourse[]
): AuditWarning[] {
  const warnings: AuditWarning[] = [];

  // Check for failed courses
  const failedCourses = transcript.filter(t =>
    t.status === 'FAILED' ||
    (t.status === 'COMPLETED' && !isPassingGrade(t.grade))
  );

  for (const failed of failedCourses) {
    warnings.push({
      type: 'INFO',
      message: `${failed.course_code} needs to be retaken (Grade: ${failed.grade || 'F'})`,
      courseCode: failed.course_code,
    });
  }

  // Check for mandatory courses that are missing
  function checkMandatory(bucket: BucketAudit) {
    const missingMandatory = bucket.courses.filter(
      c => c.isMandatory && c.status === 'MISSING'
    );
    for (const course of missingMandatory) {
      warnings.push({
        type: 'MISSING_PREREQS',
        message: `${course.courseCode} is required for ${bucket.name}`,
        courseCode: course.courseCode,
      });
    }
    for (const child of bucket.children) {
      checkMandatory(child);
    }
  }

  for (const bucket of buckets) {
    checkMandatory(bucket);
  }

  return warnings;
}

/**
 * Runs degree audit for a single program
 */
async function auditProgram(
  studentId: number,
  programId: number,
  transcript: TranscriptWithCourse[],
  waivedCourseIds: number[]
): Promise<AuditResult | null> {
  const program = await getProgram(programId);
  if (!program) return null;

  const groups = await getRequirementGroups(programId);

  // Load courses for each group
  const groupCourses = new Map<number, RequirementCourseWithDetails[]>();
  for (const group of groups) {
    const courses = await getGroupCourses(group.group_id);
    groupCourses.set(group.group_id, courses);
  }

  const buckets = buildBucketHierarchy(groups, groupCourses, transcript, waivedCourseIds);
  const overall = computeOverallProgress(buckets, program.total_credits_required);
  const warnings = generateWarnings(buckets, transcript);

  return {
    studentId,
    programId: program.program_id,
    programName: program.name,
    programType: program.type,
    overall,
    buckets,
    warnings,
    generatedAt: new Date(),
  };
}

/**
 * Main entry point: runs full degree audit for a student
 *
 * @param studentId - The user_id of the student
 * @returns Full audit result including major, minor, and concentration progress
 */
export async function runDegreeAudit(studentId: number): Promise<FullAuditResult> {
  const profile = await getStudentProfile(studentId);

  const programs = await getStudentPrograms(studentId);

  if (!profile) {
    return {
      combinedProgress: {
        percentComplete: 0,
        creditsDone: 0,
        creditsRequired: 0,
        coursesDone: 0,
        totalCourses: 0,
      },
      warnings: [{
        type: 'INFO',
        message: 'Student profile not found. Please contact your advisor.',
      }],
    };
  }

  if (!programs.assignments.length) {
    return {
      combinedProgress: {
        percentComplete: 0,
        creditsDone: 0,
        creditsRequired: 0,
        coursesDone: 0,
        totalCourses: 0,
      },
      warnings: [{
        type: 'INFO',
        message: 'No academic programs found for this student. Please assign a major/minor.',
      }],
    };
  }

  const transcript = await getStudentTranscript(studentId);
  const waivedCourseIds = await getStudentWaivers(studentId);

  let majorAudit: AuditResult | undefined;
  let minorAudit: AuditResult | undefined;
  let concentrationAudit: AuditResult | undefined;

  if (programs.majorProgramId) {
    const result = await auditProgram(studentId, programs.majorProgramId, transcript, waivedCourseIds);
    if (result) majorAudit = result;
  }

  if (programs.minorProgramId) {
    const result = await auditProgram(studentId, programs.minorProgramId, transcript, waivedCourseIds);
    if (result) minorAudit = result;
  }

  if (programs.concentrationProgramId) {
    const result = await auditProgram(studentId, programs.concentrationProgramId, transcript, waivedCourseIds);
    if (result) concentrationAudit = result;
  }

  // Combine progress across all programs
  const allAudits = [majorAudit, minorAudit, concentrationAudit].filter(Boolean) as AuditResult[];

  const statusPriority: Record<CourseStatus, number> = {
    DONE: 3,
    WAIVED: 3,
    IN_PROGRESS: 2,
    MISSING: 1,
  };

  // Collect best status per course across all buckets to avoid double counting
  const courseStatusMap = new Map<number, CourseAuditStatus>();
  function collectCourses(bucket: BucketAudit) {
    for (const course of bucket.courses) {
      const existing = courseStatusMap.get(course.courseId);
      if (!existing || statusPriority[course.status] > statusPriority[existing.status]) {
        courseStatusMap.set(course.courseId, course);
      }
    }
    for (const child of bucket.children) {
      collectCourses(child);
    }
  }

  for (const audit of allAudits) {
    audit.buckets.forEach(collectCourses);
  }

  const usedCourseIds = new Set(courseStatusMap.keys());

  // Unassigned transcript courses (do not map to any requirement group)
  const unassignedCourses: CourseAuditStatus[] = transcript
    .filter(t => !usedCourseIds.has(t.course_id))
    .map((t) => ({
      courseId: t.course_id,
      courseCode: t.course_code,
      title: t.title,
      credits: t.credits,
      status: mapTranscriptStatusToAudit(t.status),
      grade: t.grade || undefined,
      semesterName: t.semester_name,
      isMandatory: false,
    }));

  const allWarnings: AuditWarning[] = [];

  for (const audit of allAudits) {
    allWarnings.push(...audit.warnings);
  }

  // If student has a major, use its total requirement as the baseline; otherwise sum requirements
  const baselineCreditsRequired = majorAudit?.overall.creditsRequired ||
    allAudits.reduce((sum, audit) => sum + audit.overall.creditsRequired, 0);

  let creditsDone = 0;
  let creditsInProgress = 0;
  let countedCourses = 0;
  let coursesDone = 0;

  for (const course of courseStatusMap.values()) {
    countedCourses += 1;
    if (course.status === 'DONE' || course.status === 'WAIVED') {
      creditsDone += course.credits;
      coursesDone += 1;
    } else if (course.status === 'IN_PROGRESS') {
      creditsInProgress += course.credits;
    }
  }

  const combinedPercent = baselineCreditsRequired > 0
    ? Math.min(Math.round(((creditsDone + creditsInProgress * 0.5) / baselineCreditsRequired) * 100), 100)
    : 0;

  // Dedupe warnings by message
  const uniqueWarnings = Array.from(
    new Map(allWarnings.map(w => [w.message, w])).values()
  );

  const combinedProgress: OverallProgress = {
    percentComplete: combinedPercent,
    creditsDone,
    creditsRequired: baselineCreditsRequired,
    coursesDone,
    totalCourses: countedCourses,
  };

  return {
    major: majorAudit,
    minor: minorAudit,
    concentration: concentrationAudit,
    combinedProgress,
    warnings: uniqueWarnings,
    unassignedCourses,
  };
}

// Export types for use in API routes
export * from './types';
