import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithRole } from '@/lib/auth/rbac';
import { query } from '@/lib/db/query';
import { StudentProfileRow, RecommendedSequenceRow, NameResult } from '@/lib/db/types';

interface SequenceWithCourse extends RecommendedSequenceRow {
  course_code: string;
  title: string;
  credits: number;
}

/**
 * GET /api/student/roadmap
 * Get the recommended course sequence for the student's major
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuthWithRole(request, ['STUDENT']);

    // Get student's major
    const [profiles] = await query<StudentProfileRow & { major_program_id: number | null }>(
      `SELECT sp.*, prog.major_program_id
       FROM student_profiles sp
       LEFT JOIN (
         SELECT
           student_id,
           MAX(CASE WHEN type = 'MAJOR' AND is_primary = 1 THEN program_id END) AS major_program_id
         FROM student_programs
         GROUP BY student_id
       ) prog ON prog.student_id = sp.user_id
       WHERE sp.user_id = ?`,
      [user.user_id]
    );

    if (profiles.length === 0 || !profiles[0].major_program_id) {
      return NextResponse.json({
        error: 'No major assigned. Please contact your advisor.',
      }, { status: 400 });
    }

    const programId = profiles[0].major_program_id;

    // Get roadmap
    const [sequences] = await query<SequenceWithCourse>(
      `SELECT rs.*, c.course_code, c.title, c.credits
       FROM recommended_sequence rs
       JOIN courses c ON rs.course_id = c.course_id
       WHERE rs.program_id = ?
       ORDER BY rs.semester_number, rs.recommended_order, c.course_code`,
      [programId]
    );

    // Get program name
    const [programs] = await query<NameResult>(
      'SELECT name FROM programs WHERE program_id = ?',
      [programId]
    );

    // Group by semester
    const semesters: Record<number, Array<{
      sequence_id: number;
      course_id: number;
      course_code: string;
      title: string;
      credits: number;
    }>> = {};

    for (let i = 1; i <= 8; i++) {
      semesters[i] = [];
    }

    for (const seq of sequences) {
      if (semesters[seq.semester_number]) {
        semesters[seq.semester_number].push({
          sequence_id: seq.sequence_id,
          course_id: seq.course_id,
          course_code: seq.course_code,
          title: seq.title,
          credits: seq.credits,
        });
      }
    }

    return NextResponse.json({
      program_name: programs[0]?.name || 'Unknown',
      roadmap: semesters,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error fetching roadmap:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
