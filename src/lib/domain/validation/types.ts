/**
 * Prerequisite Validation Types
 */

export type ValidationErrorType =
  | 'MISSING_PREREQ'
  | 'COURSE_NOT_FOUND'
  | 'DUPLICATE_COURSE'
  | 'CREDIT_OVERLOAD'
  | 'ALREADY_COMPLETED'
  | 'ALREADY_PLANNED'
  | 'PLAN_LOCKED';

export interface ValidationError {
  type: ValidationErrorType;
  courseCode: string;
  message: string;
  missingPrereqs?: string[];
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: string[];
}

export interface CourseToValidate {
  courseId: number;
  courseCode?: string;
  semesterId: number;
}

// Credit limit per semester (standard is 18, but can be overridden)
export const DEFAULT_MAX_CREDITS_PER_SEMESTER = 18;
export const ABSOLUTE_MAX_CREDITS = 21;
