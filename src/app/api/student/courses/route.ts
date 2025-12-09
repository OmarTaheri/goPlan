import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithRole } from '@/lib/auth/rbac';
import { query } from '@/lib/db/query';
import { CourseRow } from '@/lib/db/types';

interface CourseWithPrereqs extends CourseRow {
  prerequisites?: Array<{
    course_id: number;
    course_code: string;
    title: string;
  }>;
}

interface PrereqRow {
  course_id: number;
  prereq_course_id: number;
  prereq_code: string;
  prereq_title: string;
}

/**
 * GET /api/student/courses
 * List all active courses for students to use in planning
 * Accessible by STUDENT, ADVISOR, and ADMIN roles
 */
export async function GET(request: NextRequest) {
  try {
    await requireAuthWithRole(request, ['STUDENT', 'ADVISOR', 'ADMIN']);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const includePrereqs = searchParams.get('includePrereqs') === 'true';

    let sql = `
      SELECT * FROM courses
      WHERE is_active = TRUE
    `;
    const params: string[] = [];

    if (search) {
      sql += ` AND (course_code LIKE ? OR title LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY course_code`;

    const [courses] = await query<CourseRow>(sql, params);

    // Optionally include prerequisites
    if (includePrereqs && courses.length > 0) {
      const courseIds = courses.map(c => c.course_id);
      const [prereqs] = await query<PrereqRow>(
        `SELECT 
           cd.course_id,
           cd.dependency_course_id as prereq_course_id,
           c.course_code as prereq_code,
           c.title as prereq_title
         FROM course_dependencies cd
         JOIN courses c ON cd.dependency_course_id = c.course_id
         WHERE cd.course_id IN (${courseIds.map(() => '?').join(',')})
           AND cd.dependency_type = 'PREREQUISITE'`,
        courseIds
      );

      // Map prerequisites to courses
      const prereqMap = new Map<number, PrereqRow[]>();
      for (const prereq of prereqs) {
        if (!prereqMap.has(prereq.course_id)) {
          prereqMap.set(prereq.course_id, []);
        }
        prereqMap.get(prereq.course_id)!.push(prereq);
      }

      const coursesWithPrereqs: CourseWithPrereqs[] = courses.map(course => ({
        ...course,
        prerequisites: prereqMap.get(course.course_id)?.map(p => ({
          course_id: p.prereq_course_id,
          course_code: p.prereq_code,
          title: p.prereq_title,
        })) || [],
      }));

      return NextResponse.json({ courses: coursesWithPrereqs });
    }

    return NextResponse.json({ courses });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error fetching courses:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
