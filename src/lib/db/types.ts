import { RowDataPacket } from 'mysql2/promise';

// ==========================================
// USER MANAGEMENT
// ==========================================

export interface UserRow extends RowDataPacket {
  user_id: number;
  username: string;
  email: string;
  password_hash: string;
  first_name: string | null;
  last_name: string | null;
  role: 'ADMIN' | 'ADVISOR' | 'STUDENT';
  created_at: Date;
}

export interface UserRowPublic extends RowDataPacket {
  user_id: number;
  username: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: 'ADMIN' | 'ADVISOR' | 'STUDENT';
  created_at: Date;
}

export interface SemesterRow extends RowDataPacket {
  semester_id: number;
  name: string;
  term: 'FALL' | 'SPRING' | 'SUMMER' | null;
  year: number | null;
  start_date: Date;
  end_date: Date;
  is_active: boolean;
}

// ==========================================
// CATALOG & RULES
// ==========================================

export interface CourseRow extends RowDataPacket {
  course_id: number;
  course_code: string;
  title: string;
  credits: number;
  description: string | null;
  is_active: boolean;
}

export interface CourseDependencyRow extends RowDataPacket {
  dependency_id: number;
  course_id: number;
  dependency_course_id: number | null;
  dependency_type: 'PREREQUISITE' | 'COREQUISITE' | 'STATUS';
  logic_set_id: number;
  required_status: 'FRESHMAN' | 'SOPHOMORE' | 'JUNIOR' | 'SENIOR' | null;
  note: string | null;
}

export interface ProgramRow extends RowDataPacket {
  program_id: number;
  name: string;
  code: string | null;
  school: string | null;
  type: 'MAJOR' | 'MINOR' | 'CONCENTRATION';
  total_credits_required: number;
  catalog_year: string | null;
  parent_program_id: number | null;
  minor_required: 'YES' | 'NO' | 'CONDITIONAL' | null;
  concentrations_available: 'REQUIRED' | 'OPTIONAL' | 'NOT_AVAILABLE' | null;
  free_electives_credits: number;
  prerequisite_note: string | null;
}

export interface ProgramRequirementGroupRow extends RowDataPacket {
  group_id: number;
  program_id: number;
  name: string;
  credits_required: number;
  min_courses_required: number;
  parent_group_id: number | null;
}

export interface RequirementGroupCourseRow extends RowDataPacket {
  link_id: number;
  group_id: number;
  course_id: number;
  is_mandatory: boolean;
}

// ==========================================
// RECOMMENDED PATH
// ==========================================

export interface RecommendedSequenceRow extends RowDataPacket {
  sequence_id: number;
  program_id: number;
  course_id: number;
  semester_number: number;
  recommended_order: number | null;
}

// ==========================================
// STUDENT DATA
// ==========================================

export interface StudentProfileRow extends RowDataPacket {
  profile_id: number;
  user_id: number;
  advisor_id: number | null;
  enrollment_year: number | null;
}

export interface StudentProgramRow extends RowDataPacket {
  student_program_id: number;
  student_id: number;
  program_id: number;
  type: 'MAJOR' | 'MINOR' | 'CONCENTRATION';
  is_primary: boolean;
}

export interface StudentTranscriptRow extends RowDataPacket {
  transcript_id: number;
  student_id: number;
  course_id: number;
  semester_id: number | null;
  grade: string | null;
  status: 'COMPLETED' | 'FAILED' | 'IN_PROGRESS' | 'TRANSFER';
  credits_earned: number | null;
}

export interface StudentPlanRow extends RowDataPacket {
  plan_id: number;
  student_id: number;
  course_id: number;
  semester_id: number | null;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  prereqs_met: boolean;
}

// ==========================================
// ADVISOR APPROVAL
// ==========================================

export interface SemesterApprovalRow extends RowDataPacket {
  approval_id: number;
  student_id: number;
  semester_id: number;
  advisor_id: number;
  approval_status: 'PENDING' | 'APPROVED' | 'NEEDS_REVISION';
  advisor_comments: string | null;
  approved_at: Date;
}

// ==========================================
// GENERIC QUERY RESULTS
// ==========================================

export interface CountResult extends RowDataPacket {
  count: number;
}

export interface CreditStatsResult extends RowDataPacket {
  completed_credits: number;
  in_progress_credits: number;
}

export interface PlannedCreditsResult extends RowDataPacket {
  planned_credits: number;
}

export interface GpaResult extends RowDataPacket {
  gpa: number;
}

export interface SemesterPlanResult extends RowDataPacket {
  semester_id: number;
  semester_name: string;
  status: string;
  course_count: number;
}

export interface NameResult extends RowDataPacket {
  name: string;
}

export interface AdvisorIdResult extends RowDataPacket {
  advisor_id: number;
}

// ==========================================
// AUTHENTICATION & REFRESH TOKENS
// ==========================================

export interface RefreshTokenRow extends RowDataPacket {
  token_id: number;
  user_id: number;
  token_hash: string;
  expires_at: Date;
  created_at: Date;
  revoked: boolean;
  revoked_at: Date | null;
  ip_address: string | null;
  user_agent: string | null;
}
