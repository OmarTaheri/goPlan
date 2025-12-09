import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithRole } from '@/lib/auth/rbac';
import { query } from '@/lib/db/query';

interface ApprovalRow {
  approval_id: number;
  student_id: number;
  semester_id: number;
  advisor_id: number;
  approval_status: string;
  advisor_comments: string | null;
  approved_at: string | null;
  semester_name: string;
  advisor_first_name: string | null;
  advisor_last_name: string | null;
  course_count: number;
  total_credits: number;
}

/**
 * GET /api/student/history
 * Get plan submission and approval history for the current student
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuthWithRole(request, ['STUDENT']);

    // Get all semester approvals with advisor and semester info
    const [approvals] = await query<ApprovalRow>(
      `SELECT 
        sa.approval_id,
        sa.student_id,
        sa.semester_id,
        sa.advisor_id,
        sa.approval_status,
        sa.advisor_comments,
        sa.approved_at,
        s.name as semester_name,
        u.first_name as advisor_first_name,
        u.last_name as advisor_last_name,
        COALESCE(tc.course_count, 0) as course_count,
        COALESCE(tc.total_credits, 0) as total_credits
       FROM semester_approvals sa
       JOIN semesters s ON sa.semester_id = s.semester_id
       LEFT JOIN users u ON sa.advisor_id = u.user_id
       LEFT JOIN (
         SELECT semester_id, COUNT(*) as course_count, SUM(credits_earned) as total_credits
         FROM student_transcript
         WHERE student_id = ?
         GROUP BY semester_id
       ) tc ON sa.semester_id = tc.semester_id
       WHERE sa.student_id = ?
       ORDER BY s.start_date DESC`,
      [user.user_id, user.user_id]
    );

    // Transform to history entries
    const history = approvals.map((row) => {
      // Map approval_status to history type
      let type: string;
      switch (row.approval_status) {
        case 'APPROVED':
          type = 'APPROVED';
          break;
        case 'NEEDS_REVISION':
          type = 'REJECTED';
          break;
        case 'PENDING':
          type = 'SUBMITTED';
          break;
        default:
          type = 'DRAFT';
      }

      return {
        id: row.approval_id,
        type,
        semester_name: row.semester_name,
        semester_number: row.semester_id,
        timestamp: row.approved_at || new Date().toISOString(),
        advisor_name: row.advisor_first_name && row.advisor_last_name
          ? `${row.advisor_first_name} ${row.advisor_last_name}`
          : undefined,
        comments: row.advisor_comments || undefined,
        course_count: row.course_count,
        total_credits: row.total_credits,
      };
    });

    return NextResponse.json({ history });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error fetching history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
