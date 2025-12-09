import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithRole } from '@/lib/auth/rbac';
import { query } from '@/lib/db/query';
import { StudentTranscriptRow } from '@/lib/db/types';

interface TranscriptWithDetails extends StudentTranscriptRow {
  course_code: string;
  title: string;
  credits: number;
  semester_name: string | null;
  semester_start: Date | null;
}

interface SemesterGroup {
  semester_id: number | null;
  semester_name: string;
  courses: Array<{
    transcript_id: number;
    course_id: number;
    course_code: string;
    title: string;
    credits: number;
    grade: string | null;
    status: string;
    credits_earned: number | null;
  }>;
  total_credits: number;
  gpa: number | null;
}

/**
 * GET /api/student/transcript
 * Get the current student's transcript
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuthWithRole(request, ['STUDENT']);

    const [records] = await query<TranscriptWithDetails>(
      `SELECT t.*,
              c.course_code, c.title, c.credits,
              s.name as semester_name, s.start_date as semester_start
       FROM student_transcript t
       JOIN courses c ON t.course_id = c.course_id
       LEFT JOIN semesters s ON t.semester_id = s.semester_id
       WHERE t.student_id = ?
       ORDER BY s.start_date DESC, c.course_code`,
      [user.user_id]
    );

    // Group by semester
    const semesterMap = new Map<string, TranscriptWithDetails[]>();

    for (const record of records) {
      const key = record.semester_id?.toString() || 'transfer';
      if (!semesterMap.has(key)) {
        semesterMap.set(key, []);
      }
      semesterMap.get(key)!.push(record);
    }

    // Calculate GPA per semester and overall
    const gradePoints: Record<string, number> = {
      'A': 4.0, 'A-': 3.7,
      'B+': 3.3, 'B': 3.0, 'B-': 2.7,
      'C+': 2.3, 'C': 2.0, 'C-': 1.7,
      'D+': 1.3, 'D': 1.0, 'D-': 0.7,
      'F': 0.0,
    };

    const semesters: SemesterGroup[] = [];
    let totalGradePoints = 0;
    let totalCreditsForGPA = 0;

    for (const [key, courses] of semesterMap) {
      const firstCourse = courses[0];
      let semesterGradePoints = 0;
      let semesterCredits = 0;

      const semesterCourses = courses.map(c => {
        // Calculate GPA contribution
        if (c.status === 'COMPLETED' && c.grade && gradePoints[c.grade] !== undefined) {
          const credits = c.credits_earned || c.credits;
          semesterGradePoints += gradePoints[c.grade] * credits;
          semesterCredits += credits;
          totalGradePoints += gradePoints[c.grade] * credits;
          totalCreditsForGPA += credits;
        }

        return {
          transcript_id: c.transcript_id,
          course_id: c.course_id,
          course_code: c.course_code,
          title: c.title,
          credits: c.credits,
          grade: c.grade,
          status: c.status,
          credits_earned: c.credits_earned,
        };
      });

      semesters.push({
        semester_id: firstCourse.semester_id,
        semester_name: firstCourse.semester_name || 'Transfer Credits',
        courses: semesterCourses,
        total_credits: courses.reduce((sum, c) => sum + (c.credits_earned || 0), 0),
        gpa: semesterCredits > 0
          ? Math.round((semesterGradePoints / semesterCredits) * 100) / 100
          : null,
      });
    }

    const overallGPA = totalCreditsForGPA > 0
      ? Math.round((totalGradePoints / totalCreditsForGPA) * 100) / 100
      : null;

    // Calculate totals
    const completedCredits = records
      .filter(r => r.status === 'COMPLETED' || r.status === 'TRANSFER')
      .reduce((sum, r) => sum + (r.credits_earned || 0), 0);

    const inProgressCredits = records
      .filter(r => r.status === 'IN_PROGRESS')
      .reduce((sum, r) => sum + r.credits, 0);

    return NextResponse.json({
      semesters,
      summary: {
        overall_gpa: overallGPA,
        completed_credits: completedCredits,
        in_progress_credits: inProgressCredits,
        total_courses: records.length,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error fetching transcript:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
