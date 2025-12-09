import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithRole } from '@/lib/auth/rbac';
import { query, execute } from '@/lib/db/query';
import { CourseRow, ProgramRow } from '@/lib/db/types';
import { RowDataPacket } from 'mysql2/promise';

interface PrereqRow extends RowDataPacket {
  dependency_id: number;
  course_id: number;
  dependency_course_id: number | null;
  dependency_type: 'PREREQUISITE' | 'COREQUISITE' | 'STATUS';
  required_status: string | null;
  note: string | null;
  prereq_code: string | null;
  prereq_title: string | null;
  prereq_credits: number | null;
  prereq_description: string | null;
}

interface CourseProgramRow extends RowDataPacket {
  course_id: number;
  program_id: number;
  program_name: string;
  program_type: 'MAJOR' | 'MINOR' | 'CONCENTRATION';
}

interface CourseWithPrereqs extends CourseRow {
  prerequisites?: PrereqRow[];
  programs?: { program_id: number; name: string; type: string }[];
}

/**
 * GET /api/admin/courses
 * List all courses with optional search/filter, includes prerequisites and programs
 */
export async function GET(request: NextRequest) {
  try {
    await requireAuthWithRole(request, ['ADMIN']);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const activeOnly = searchParams.get('active') !== 'false';
    const programId = searchParams.get('programId');
    const programType = searchParams.get('programType'); // MAJOR, MINOR, CONCENTRATION

    let sql = `
      SELECT DISTINCT c.* FROM courses c
    `;
    const params: (string | number)[] = [];

    // Join with programs if filtering by program
    if (programId || programType) {
      sql += `
        JOIN requirement_group_courses rgc ON c.course_id = rgc.course_id
        JOIN program_requirement_groups prg ON rgc.group_id = prg.group_id
        JOIN programs p ON prg.program_id = p.program_id
      `;
    }

    sql += ` WHERE 1=1`;

    if (search) {
      sql += ` AND (c.course_code LIKE ? OR c.title LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    if (activeOnly) {
      sql += ` AND c.is_active = TRUE`;
    }

    if (programId) {
      sql += ` AND p.program_id = ?`;
      params.push(parseInt(programId));
    }

    if (programType) {
      sql += ` AND p.type = ?`;
      params.push(programType);
    }

    sql += ` ORDER BY c.course_code`;

    const [courses] = await query<CourseRow>(sql, params);

    // Fetch prerequisites for all courses (including nested prereqs)
    const [allPrereqs] = await query<PrereqRow>(
      `SELECT cd.*, 
              c.course_code as prereq_code, 
              c.title as prereq_title,
              c.credits as prereq_credits,
              c.description as prereq_description
       FROM course_dependencies cd
       LEFT JOIN courses c ON cd.dependency_course_id = c.course_id
       ORDER BY cd.course_id, cd.dependency_type, c.course_code`
    );

    // Fetch program associations for all courses
    const [coursePrograms] = await query<CourseProgramRow>(
      `SELECT DISTINCT rgc.course_id, p.program_id, p.name as program_name, p.type as program_type
       FROM requirement_group_courses rgc
       JOIN program_requirement_groups prg ON rgc.group_id = prg.group_id
       JOIN programs p ON prg.program_id = p.program_id
       ORDER BY rgc.course_id, p.type, p.name`
    );

    // Map prerequisites to courses
    const prereqsByCourse = new Map<number, PrereqRow[]>();
    for (const prereq of allPrereqs) {
      if (!prereqsByCourse.has(prereq.course_id)) {
        prereqsByCourse.set(prereq.course_id, []);
      }
      prereqsByCourse.get(prereq.course_id)!.push(prereq);
    }

    // Map programs to courses
    const programsByCourse = new Map<number, { program_id: number; name: string; type: string }[]>();
    for (const cp of coursePrograms) {
      if (!programsByCourse.has(cp.course_id)) {
        programsByCourse.set(cp.course_id, []);
      }
      programsByCourse.get(cp.course_id)!.push({
        program_id: cp.program_id,
        name: cp.program_name,
        type: cp.program_type,
      });
    }

    const coursesWithPrereqs: CourseWithPrereqs[] = courses.map(course => ({
      ...course,
      prerequisites: prereqsByCourse.get(course.course_id) || [],
      programs: programsByCourse.get(course.course_id) || [],
    }));

    // Also fetch all programs for filter dropdown
    const [programs] = await query<ProgramRow>(
      'SELECT * FROM programs ORDER BY type, name'
    );

    return NextResponse.json({ 
      courses: coursesWithPrereqs,
      programs: programs,
      // Provide the full prereqs map so frontend can lookup nested prereqs
      allPrerequisites: Object.fromEntries(prereqsByCourse),
    });
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

/**
 * POST /api/admin/courses
 * Create a new course
 */
export async function POST(request: NextRequest) {
  try {
    await requireAuthWithRole(request, ['ADMIN']);

    const body = await request.json();
    const { course_code, title, credits, description } = body;

    // Validation
    if (!course_code || !title || credits === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: course_code, title, credits' },
        { status: 400 }
      );
    }

    if (credits < 0 || credits > 12) {
      return NextResponse.json(
        { error: 'Credits must be between 0 and 12' },
        { status: 400 }
      );
    }

    // Check for duplicate course code
    const [existing] = await query<CourseRow>(
      'SELECT course_id FROM courses WHERE course_code = ?',
      [course_code]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'A course with this code already exists' },
        { status: 409 }
      );
    }

    const result = await execute(
      `INSERT INTO courses (course_code, title, credits, description, is_active)
       VALUES (?, ?, ?, ?, TRUE)`,
      [course_code, title, credits, description || null]
    );

    return NextResponse.json({
      message: 'Course created successfully',
      course_id: result.insertId,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error creating course:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
