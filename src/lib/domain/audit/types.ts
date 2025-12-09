/**
 * Degree Audit Types
 *
 * These types define the structure of degree audit results.
 */

export type CourseStatus = 'DONE' | 'IN_PROGRESS' | 'MISSING' | 'WAIVED';

export interface CourseAuditStatus {
  courseId: number;
  courseCode: string;
  title: string;
  credits: number;
  status: CourseStatus;
  grade?: string;
  semesterName?: string;
  isMandatory: boolean;
}

export interface BucketProgress {
  creditsDone: number;
  creditsRequired: number;
  coursesDone: number;
  coursesRequired: number;
  percent: number;
}

export interface BucketAudit {
  groupId: number;
  name: string;
  parentGroupId: number | null;
  courses: CourseAuditStatus[];
  progress: BucketProgress;
  children: BucketAudit[];
}

export interface OverallProgress {
  percentComplete: number;
  creditsDone: number;
  creditsRequired: number;
  coursesDone: number;
  totalCourses: number;
}

export interface AuditWarning {
  type: 'LOW_GPA' | 'MISSING_PREREQS' | 'CREDIT_OVERLOAD' | 'SEQUENCE_GAP' | 'INFO';
  message: string;
  courseCode?: string;
}

export interface AuditResult {
  studentId: number;
  programId: number;
  programName: string;
  programType: 'MAJOR' | 'MINOR' | 'CONCENTRATION';
  overall: OverallProgress;
  buckets: BucketAudit[];
  warnings: AuditWarning[];
  generatedAt: Date;
}

export interface FullAuditResult {
  major?: AuditResult;
  minor?: AuditResult;
  concentration?: AuditResult;
  combinedProgress: OverallProgress;
  warnings: AuditWarning[];
  unassignedCourses?: CourseAuditStatus[];
}

// Passing grades configuration
export const PASSING_GRADES = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'P', 'CR'];
export const MINIMUM_PASSING_GRADE = 'D-';

export function isPassingGrade(grade: string | null | undefined): boolean {
  if (!grade) return false;
  return PASSING_GRADES.includes(grade.toUpperCase());
}
