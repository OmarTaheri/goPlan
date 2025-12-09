import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithRole } from '@/lib/auth/rbac';
import { query } from '@/lib/db/query';
import { RowDataPacket } from 'mysql2/promise';

interface StudentWithDetails extends RowDataPacket {
  user_id: number;
  username: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  major_name: string | null;
  minor_name: string | null;
  enrollment_year: number | null;
  pending_plans: number;
  approved_plans: number;
}

/**
 * GET /api/advisor/students
 * Get all students assigned to the current advisor
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuthWithRole(request, ['ADVISOR']);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const hasPending = searchParams.get('pending') === 'true';

    let sql = `
      SELECT
        u.user_id,
        u.username,
        u.email,
        u.first_name,
        u.last_name,
        majors.major_name,
        minors.minor_name,
        sp.enrollment_year,
        (SELECT COUNT(DISTINCT plan_id) FROM student_plan
         WHERE student_id = u.user_id AND status = 'SUBMITTED') as pending_plans,
        (SELECT COUNT(DISTINCT plan_id) FROM student_plan
         WHERE student_id = u.user_id AND status = 'APPROVED') as approved_plans
      FROM student_profiles sp
      JOIN users u ON sp.user_id = u.user_id
      LEFT JOIN (
        SELECT student_id, MAX(CASE WHEN is_primary THEN p.name END) AS major_name
        FROM student_programs sp
        JOIN programs p ON sp.program_id = p.program_id
        WHERE sp.type = 'MAJOR'
        GROUP BY student_id
      ) majors ON majors.student_id = u.user_id
      LEFT JOIN (
        SELECT student_id, MAX(p.name) AS minor_name
        FROM student_programs sp
        JOIN programs p ON sp.program_id = p.program_id
        WHERE sp.type = 'MINOR'
        GROUP BY student_id
      ) minors ON minors.student_id = u.user_id
      WHERE sp.advisor_id = ?
    `;
    const params: (number | string)[] = [user.user_id];

    if (search) {
      sql += ` AND (u.username LIKE ? OR u.email LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY u.last_name, u.first_name`;

    const [students] = await query<StudentWithDetails>(sql, params);

    // Filter for pending if requested
    let filteredStudents = students;
    if (hasPending) {
      filteredStudents = students.filter(s => s.pending_plans > 0);
    }

    // Summary stats
    const totalStudents = students.length;
    const studentsWithPending = students.filter(s => s.pending_plans > 0).length;
    const totalPendingPlans = students.reduce((sum, s) => sum + s.pending_plans, 0);

    return NextResponse.json({
      students: filteredStudents,
      summary: {
        total_students: totalStudents,
        students_with_pending: studentsWithPending,
        total_pending_plans: totalPendingPlans,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error fetching students:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
