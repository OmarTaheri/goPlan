import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithRole, requireAdvisorAssigned } from '@/lib/auth/rbac';
import { query } from '@/lib/db/query';
import { UserRowPublic, StudentProfileRow, CreditStatsResult, PlannedCreditsResult, GpaResult } from '@/lib/db/types';

interface Params {
  params: Promise<{ id: string }>;
}

interface StudentOverview {
  user: UserRowPublic;
  profile: {
    major_name: string | null;
    minor_name: string | null;
    concentration_name: string | null;
    enrollment_year: number | null;
  } | null;
  stats: {
    completed_credits: number;
    in_progress_credits: number;
    planned_credits: number;
    gpa: number | null;
  };
  recent_plans: Array<{
    semester_id: number;
    semester_name: string;
    status: string;
    course_count: number;
  }>;
}

/**
 * GET /api/advisor/students/[id]
 * Get overview of a student assigned to the advisor
 */
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const advisor = await requireAuthWithRole(request, ['ADVISOR']);
    const { id } = await params;
    const studentId = parseInt(id, 10);

    if (isNaN(studentId)) {
      return NextResponse.json({ error: 'Invalid student ID' }, { status: 400 });
    }

    // Verify advisor is assigned to this student
    await requireAdvisorAssigned(advisor.user_id, studentId);

    // Get user info
    const [users] = await query<UserRowPublic>(
      `SELECT user_id, username, email, first_name, last_name, role, created_at
       FROM users WHERE user_id = ? AND role = 'STUDENT'`,
      [studentId]
    );

    if (users.length === 0) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Get profile
    const [profiles] = await query<StudentProfileRow & {
      major_program_id: number | null;
      major_name: string | null;
      minor_program_id: number | null;
      minor_name: string | null;
      concentration_program_id: number | null;
      concentration_name: string | null;
    }>(
      `SELECT sp.*,
              prog.major_program_id,
              prog.major_name,
              prog.minor_program_id,
              prog.minor_name,
              prog.concentration_program_id,
              prog.concentration_name
       FROM student_profiles sp
       LEFT JOIN (
         SELECT
           sp.student_id,
           MAX(CASE WHEN sp.type = 'MAJOR' AND sp.is_primary = 1 THEN sp.program_id END) AS major_program_id,
           MAX(CASE WHEN sp.type = 'MAJOR' AND sp.is_primary = 1 THEN p.name END) AS major_name,
           MAX(CASE WHEN sp.type = 'MINOR' THEN sp.program_id END) AS minor_program_id,
           MAX(CASE WHEN sp.type = 'MINOR' THEN p.name END) AS minor_name,
           MAX(CASE WHEN sp.type = 'CONCENTRATION' THEN sp.program_id END) AS concentration_program_id,
           MAX(CASE WHEN sp.type = 'CONCENTRATION' THEN p.name END) AS concentration_name
         FROM student_programs sp
         JOIN programs p ON sp.program_id = p.program_id
         GROUP BY sp.student_id
       ) prog ON prog.student_id = sp.user_id
       WHERE sp.user_id = ?`,
      [studentId]
    );

    // Get transcript stats
    const [transcriptStats] = await query<CreditStatsResult>(
      `SELECT
        SUM(CASE WHEN status IN ('COMPLETED', 'TRANSFER') THEN credits_earned ELSE 0 END) as completed_credits,
        SUM(CASE WHEN status = 'IN_PROGRESS' THEN c.credits ELSE 0 END) as in_progress_credits
       FROM student_transcript t
       JOIN courses c ON t.course_id = c.course_id
       WHERE t.student_id = ?`,
      [studentId]
    );

    // Get planned credits
    const [planStats] = await query<PlannedCreditsResult>(
      `SELECT SUM(c.credits) as planned_credits
       FROM student_plan sp
       JOIN courses c ON sp.course_id = c.course_id
       WHERE sp.student_id = ? AND sp.status IN ('DRAFT', 'SUBMITTED')`,
      [studentId]
    );

    // Calculate GPA
    const [gpaResult] = await query<GpaResult>(
      `SELECT
        SUM(
          CASE t.grade
            WHEN 'A' THEN 4.0 * t.credits_earned
            WHEN 'A-' THEN 3.7 * t.credits_earned
            WHEN 'B+' THEN 3.3 * t.credits_earned
            WHEN 'B' THEN 3.0 * t.credits_earned
            WHEN 'B-' THEN 2.7 * t.credits_earned
            WHEN 'C+' THEN 2.3 * t.credits_earned
            WHEN 'C' THEN 2.0 * t.credits_earned
            WHEN 'C-' THEN 1.7 * t.credits_earned
            WHEN 'D+' THEN 1.3 * t.credits_earned
            WHEN 'D' THEN 1.0 * t.credits_earned
            WHEN 'D-' THEN 0.7 * t.credits_earned
            WHEN 'F' THEN 0.0
            ELSE NULL
          END
        ) / NULLIF(SUM(CASE WHEN t.grade IN ('A','A-','B+','B','B-','C+','C','C-','D+','D','D-','F') THEN t.credits_earned ELSE 0 END), 0) as gpa
       FROM student_transcript t
       WHERE t.student_id = ? AND t.status = 'COMPLETED'`,
      [studentId]
    );

    // Get recent plans (using draft_id and semester_number, joining with student_plan_semesters for proper name)
    const [recentPlans] = await query<{
        semester_id: number;
        semester_name: string;
        status: string;
        course_count: number;
    }>(
      `SELECT
        sp.semester_number as semester_id,
        CONCAT(UPPER(LEFT(sps.term, 1)), LOWER(SUBSTRING(sps.term, 2)), ' ', sps.year) as semester_name,
        sp.status,
        COUNT(*) as course_count
       FROM student_plan sp
       JOIN student_plan_semesters sps ON sp.draft_id = sps.draft_id AND sp.semester_number = sps.semester_number
       WHERE sp.student_id = ?
       GROUP BY sp.draft_id, sp.semester_number, sp.status, sps.term, sps.year
       ORDER BY sp.draft_id DESC, sp.semester_number DESC
       LIMIT 5`,
      [studentId]
    );

    const overview: StudentOverview = {
      user: users[0],
      profile: profiles[0] ? {
        major_name: profiles[0].major_name,
        minor_name: profiles[0].minor_name,
        concentration_name: profiles[0].concentration_name,
        enrollment_year: profiles[0].enrollment_year,
      } : null,
      stats: {
        completed_credits: transcriptStats[0]?.completed_credits || 0,
        in_progress_credits: transcriptStats[0]?.in_progress_credits || 0,
        planned_credits: planStats[0]?.planned_credits || 0,
        gpa: gpaResult[0]?.gpa ? Math.round(gpaResult[0].gpa * 100) / 100 : null,
      },
      recent_plans: recentPlans || [],
    };

    return NextResponse.json(overview);
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (error instanceof Error && error.message.includes('not assigned')) {
      return NextResponse.json({ error: 'Student not in your caseload' }, { status: 403 });
    }
    console.error('Error fetching student:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
