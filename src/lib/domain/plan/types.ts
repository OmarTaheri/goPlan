/**
 * Plan Lifecycle Types
 */

export type PlanStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'NEEDS_REVISION';

export interface PlanSubmitResult {
  success: boolean;
  message: string;
  errors?: string[];
  warnings?: string[];
}

export interface PlanApprovalResult {
  success: boolean;
  message: string;
  approvalId?: number;
}

export interface OverrideResult {
  success: boolean;
  message: string;
  overrideId?: number;
}

export interface PlannedCourseInfo {
  planId: number;
  courseId: number;
  courseCode: string;
  title: string;
  credits: number;
  status: PlanStatus;
  prereqsMet: boolean;
}

export interface SemesterPlanInfo {
  semesterId: number;
  semesterName: string;
  courses: PlannedCourseInfo[];
  totalCredits: number;
  status: PlanStatus;
  approvalStatus?: ApprovalStatus;
  advisorComments?: string;
}
