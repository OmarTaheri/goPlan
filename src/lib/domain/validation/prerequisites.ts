/**
 * Prerequisite Validation Module
 *
 * This module validates whether a student can enroll in a course by checking:
 * 1. Course exists in catalog
 * 2. Prerequisites are satisfied (by transcript or waiver)
 * 3. No duplicate courses in same semester
 * 4. Credit limit not exceeded
 * 5. Course not already completed
 */

import { query } from '@/lib/db/query';
import {
  CourseRow,
  CourseDependencyRow,
  StudentTranscriptRow,
  StudentPlanRow,
} from '@/lib/db/types';
import {
  ValidationResult,
  ValidationError,
  CourseToValidate,
  DEFAULT_MAX_CREDITS_PER_SEMESTER,
} from './types';
import { isPassingGrade } from '../audit/types';

interface CourseWithCredits extends CourseRow {}

interface TranscriptEntry extends StudentTranscriptRow {
  course_code: string;
}

interface PlannedCourse extends StudentPlanRow {
  course_code: string;
  credits: number;
}

/**
 * Fetches course by ID
 */
async function getCourseById(courseId: number): Promise<CourseRow | null> {
  const sql = `SELECT * FROM courses WHERE course_id = ? AND is_active = TRUE`;
  const [rows] = await query<CourseRow>(sql, [courseId]);
  return rows[0] || null;
}

/**
 * Fetches prerequisites for a course
 */
async function getCoursePrerequisites(courseId: number): Promise<(CourseDependencyRow & { prereq_code: string })[]> {
  const sql = `
    SELECT cd.*, c.course_code as prereq_code
    FROM course_dependencies cd
    JOIN courses c ON cd.dependency_course_id = c.course_id
    WHERE cd.course_id = ? AND cd.dependency_type = 'PREREQUISITE'
  `;
  const [rows] = await query<CourseDependencyRow & { prereq_code: string }>(sql, [courseId]);
  return rows;
}

/**
 * Fetches student transcript
 */
async function getStudentTranscript(studentId: number): Promise<TranscriptEntry[]> {
  const sql = `
    SELECT t.*, c.course_code
    FROM student_transcript t
    JOIN courses c ON t.course_id = c.course_id
    WHERE t.student_id = ?
  `;
  const [rows] = await query<TranscriptEntry>(sql, [studentId]);
  return rows;
}

/**
 * Fetches student's planned courses for a semester
 */
async function getPlannedCoursesForSemester(
  studentId: number,
  semesterId: number
): Promise<PlannedCourse[]> {
  const sql = `
    SELECT sp.*, c.course_code, c.credits
    FROM student_plan sp
    JOIN courses c ON sp.course_id = c.course_id
    WHERE sp.student_id = ? AND sp.semester_id = ?
  `;
  const [rows] = await query<PlannedCourse>(sql, [studentId, semesterId]);
  return rows;
}

/**
 * Checks if any prerequisite is waived for the student
 * TODO: Implement when override table is added
 */
async function isPrereqWaived(studentId: number, prereqCourseId: number): Promise<boolean> {
  // Will check override table when implemented
  return false;
}

/**
 * Checks if a prerequisite is satisfied by transcript
 */
function isPrereqSatisfiedByTranscript(
  prereqCourseId: number,
  transcript: TranscriptEntry[]
): boolean {
  const record = transcript.find(t =>
    t.course_id === prereqCourseId &&
    (t.status === 'COMPLETED' || t.status === 'TRANSFER') &&
    isPassingGrade(t.grade)
  );
  return !!record;
}

/**
 * Validates a single course for a student
 */
export async function validateCourse(
  studentId: number,
  courseId: number,
  semesterId: number,
  excludePlanId?: number // Exclude this plan_id when checking duplicates (for updates)
): Promise<ValidationResult> {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];

  // 1. Check course exists
  const course = await getCourseById(courseId);
  if (!course) {
    return {
      valid: false,
      errors: [{
        type: 'COURSE_NOT_FOUND',
        courseCode: `ID:${courseId}`,
        message: 'Course not found in catalog or is inactive',
      }],
      warnings: [],
    };
  }

  // 2. Check if already completed
  const transcript = await getStudentTranscript(studentId);
  const completed = transcript.find(t =>
    t.course_id === courseId &&
    (t.status === 'COMPLETED' || t.status === 'TRANSFER') &&
    isPassingGrade(t.grade)
  );

  if (completed) {
    errors.push({
      type: 'ALREADY_COMPLETED',
      courseCode: course.course_code,
      message: `${course.course_code} has already been completed with grade ${completed.grade}`,
    });
  }

  // 3. Check prerequisites
  const prerequisites = await getCoursePrerequisites(courseId);
  const missingPrereqs: string[] = [];

  for (const prereq of prerequisites) {
    if (!prereq.dependency_course_id) continue; // Skip text-only prerequisites

    const satisfied = isPrereqSatisfiedByTranscript(prereq.dependency_course_id, transcript);
    const waived = await isPrereqWaived(studentId, prereq.dependency_course_id);

    if (!satisfied && !waived) {
      missingPrereqs.push(prereq.prereq_code);
    }
  }

  if (missingPrereqs.length > 0) {
    errors.push({
      type: 'MISSING_PREREQ',
      courseCode: course.course_code,
      message: `Missing prerequisites: ${missingPrereqs.join(', ')}`,
      missingPrereqs,
    });
  }

  // 4. Check for duplicates in same semester
  const plannedCourses = await getPlannedCoursesForSemester(studentId, semesterId);
  const duplicate = plannedCourses.find(p =>
    p.course_id === courseId &&
    p.plan_id !== excludePlanId
  );

  if (duplicate) {
    errors.push({
      type: 'DUPLICATE_COURSE',
      courseCode: course.course_code,
      message: `${course.course_code} is already planned for this semester`,
    });
  }

  // 5. Check credit limit
  const currentCredits = plannedCourses
    .filter(p => p.plan_id !== excludePlanId)
    .reduce((sum, p) => sum + p.credits, 0);

  const newTotal = currentCredits + course.credits;

  if (newTotal > DEFAULT_MAX_CREDITS_PER_SEMESTER) {
    if (newTotal <= 21) {
      warnings.push(
        `Adding ${course.course_code} brings total to ${newTotal} credits (above normal limit of ${DEFAULT_MAX_CREDITS_PER_SEMESTER})`
      );
    } else {
      errors.push({
        type: 'CREDIT_OVERLOAD',
        courseCode: course.course_code,
        message: `Adding ${course.course_code} would exceed maximum credit limit (${newTotal} > 21)`,
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates multiple courses at once
 */
export async function validateCourses(
  studentId: number,
  courses: CourseToValidate[]
): Promise<ValidationResult> {
  const allErrors: ValidationError[] = [];
  const allWarnings: string[] = [];

  for (const course of courses) {
    const result = await validateCourse(
      studentId,
      course.courseId,
      course.semesterId
    );
    allErrors.push(...result.errors);
    allWarnings.push(...result.warnings);
  }

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
  };
}

/**
 * Validates an entire semester plan before submission
 */
export async function validateSemesterPlan(
  studentId: number,
  semesterId: number
): Promise<ValidationResult> {
  const plannedCourses = await getPlannedCoursesForSemester(studentId, semesterId);

  if (plannedCourses.length === 0) {
    return {
      valid: false,
      errors: [{
        type: 'COURSE_NOT_FOUND',
        courseCode: 'NONE',
        message: 'No courses planned for this semester',
      }],
      warnings: [],
    };
  }

  // Check if plan is locked (already approved)
  const hasApproved = plannedCourses.some(p => p.status === 'APPROVED');
  if (hasApproved) {
    return {
      valid: false,
      errors: [{
        type: 'PLAN_LOCKED',
        courseCode: 'ALL',
        message: 'This semester plan has already been approved and cannot be modified',
      }],
      warnings: [],
    };
  }

  // Validate each course
  const allErrors: ValidationError[] = [];
  const allWarnings: string[] = [];

  for (const planned of plannedCourses) {
    const result = await validateCourse(
      studentId,
      planned.course_id,
      semesterId,
      planned.plan_id // Exclude self when checking duplicates
    );

    // Filter out duplicate errors since we're checking the same semester
    const relevantErrors = result.errors.filter(e =>
      e.type !== 'DUPLICATE_COURSE' && e.type !== 'CREDIT_OVERLOAD'
    );

    allErrors.push(...relevantErrors);
    allWarnings.push(...result.warnings);
  }

  // Check total credits for semester
  const totalCredits = plannedCourses.reduce((sum, p) => sum + p.credits, 0);
  if (totalCredits > 21) {
    allErrors.push({
      type: 'CREDIT_OVERLOAD',
      courseCode: 'ALL',
      message: `Total semester credits (${totalCredits}) exceeds maximum allowed (21)`,
    });
  } else if (totalCredits > DEFAULT_MAX_CREDITS_PER_SEMESTER) {
    allWarnings.push(
      `Total credits (${totalCredits}) is above the normal limit of ${DEFAULT_MAX_CREDITS_PER_SEMESTER}`
    );
  }

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
  };
}

// Export types
export * from './types';
