import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithRole } from '@/lib/auth/rbac';
import { query, execute, transaction } from '@/lib/db/query';
import { ProgramRow, RecommendedSequenceRow, CourseRow } from '@/lib/db/types';

interface Params {
  params: Promise<{ id: string }>;
}

interface SequenceWithCourse extends RecommendedSequenceRow {
  course_code: string;
  title: string;
  credits: number;
}

/**
 * GET /api/admin/programs/[id]/roadmap
 * Get the recommended course sequence for a program
 */
export async function GET(request: NextRequest, { params }: Params) {
  try {
    await requireAuthWithRole(request, ['ADMIN']);
    const { id } = await params;
    const programId = parseInt(id, 10);

    if (isNaN(programId)) {
      return NextResponse.json({ error: 'Invalid program ID' }, { status: 400 });
    }

    // Verify program exists
    const [programs] = await query<ProgramRow>(
      'SELECT * FROM programs WHERE program_id = ?',
      [programId]
    );

    if (programs.length === 0) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 });
    }

    // Get roadmap
    const [sequences] = await query<SequenceWithCourse>(
      `SELECT rs.*, c.course_code, c.title, c.credits
       FROM recommended_sequence rs
       JOIN courses c ON rs.course_id = c.course_id
       WHERE rs.program_id = ?
       ORDER BY rs.semester_number, rs.recommended_order, c.course_code`,
      [programId]
    );

    // Group by semester
    const semesters: Record<number, SequenceWithCourse[]> = {};
    for (let i = 1; i <= 8; i++) {
      semesters[i] = [];
    }

    for (const seq of sequences) {
      if (semesters[seq.semester_number]) {
        semesters[seq.semester_number].push(seq);
      }
    }

    return NextResponse.json({
      program: programs[0],
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

/**
 * PUT /api/admin/programs/[id]/roadmap
 * Update the entire roadmap (replace all sequences)
 */
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    await requireAuthWithRole(request, ['ADMIN']);
    const { id } = await params;
    const programId = parseInt(id, 10);

    if (isNaN(programId)) {
      return NextResponse.json({ error: 'Invalid program ID' }, { status: 400 });
    }

    const body = await request.json();
    const { roadmap } = body as {
      roadmap: Record<number, Array<{ course_id: number; order?: number }>>;
    };

    if (!roadmap) {
      return NextResponse.json(
        { error: 'roadmap object is required' },
        { status: 400 }
      );
    }

    // Verify program exists
    const [programs] = await query<ProgramRow>(
      'SELECT * FROM programs WHERE program_id = ?',
      [programId]
    );

    if (programs.length === 0) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 });
    }

    // Validate all course IDs exist
    const allCourseIds: number[] = [];
    for (const semesterNum of Object.keys(roadmap)) {
      const semester = parseInt(semesterNum, 10);
      if (isNaN(semester) || semester < 1 || semester > 8) {
        return NextResponse.json(
          { error: `Invalid semester number: ${semesterNum}` },
          { status: 400 }
        );
      }

      for (const item of roadmap[semester]) {
        if (!allCourseIds.includes(item.course_id)) {
          allCourseIds.push(item.course_id);
        }
      }
    }

    if (allCourseIds.length > 0) {
      const [courses] = await query<CourseRow>(
        `SELECT course_id FROM courses WHERE course_id IN (${allCourseIds.map(() => '?').join(',')})`,
        allCourseIds
      );

      const foundIds = courses.map(c => c.course_id);
      const missingIds = allCourseIds.filter(id => !foundIds.includes(id));

      if (missingIds.length > 0) {
        return NextResponse.json(
          { error: `Course IDs not found: ${missingIds.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // Replace roadmap in transaction
    await transaction(async (conn) => {
      // Delete existing roadmap
      await conn.query(
        'DELETE FROM recommended_sequence WHERE program_id = ?',
        [programId]
      );

      // Insert new roadmap
      for (const semesterNum of Object.keys(roadmap)) {
        const semester = parseInt(semesterNum, 10);
        const courses = roadmap[semester];

        for (let i = 0; i < courses.length; i++) {
          const item = courses[i];
          await conn.query(
            `INSERT INTO recommended_sequence (program_id, course_id, semester_number, recommended_order)
             VALUES (?, ?, ?, ?)`,
            [programId, item.course_id, semester, item.order ?? i + 1]
          );
        }
      }
    });

    return NextResponse.json({ message: 'Roadmap updated successfully' });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error updating roadmap:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/programs/[id]/roadmap
 * Add a course to the roadmap
 */
export async function POST(request: NextRequest, { params }: Params) {
  try {
    await requireAuthWithRole(request, ['ADMIN']);
    const { id } = await params;
    const programId = parseInt(id, 10);

    if (isNaN(programId)) {
      return NextResponse.json({ error: 'Invalid program ID' }, { status: 400 });
    }

    const body = await request.json();
    const { course_id, semester_number, recommended_order } = body;

    if (!course_id || !semester_number) {
      return NextResponse.json(
        { error: 'course_id and semester_number are required' },
        { status: 400 }
      );
    }

    if (semester_number < 1 || semester_number > 8) {
      return NextResponse.json(
        { error: 'semester_number must be between 1 and 8' },
        { status: 400 }
      );
    }

    // Verify program exists
    const [programs] = await query<ProgramRow>(
      'SELECT * FROM programs WHERE program_id = ?',
      [programId]
    );

    if (programs.length === 0) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 });
    }

    // Verify course exists
    const [courses] = await query<CourseRow>(
      'SELECT * FROM courses WHERE course_id = ?',
      [course_id]
    );

    if (courses.length === 0) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Check if already in roadmap for this semester
    const [existing] = await query<RecommendedSequenceRow>(
      'SELECT * FROM recommended_sequence WHERE program_id = ? AND course_id = ? AND semester_number = ?',
      [programId, course_id, semester_number]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Course is already in this semester of the roadmap' },
        { status: 409 }
      );
    }

    const result = await execute(
      `INSERT INTO recommended_sequence (program_id, course_id, semester_number, recommended_order)
       VALUES (?, ?, ?, ?)`,
      [programId, course_id, semester_number, recommended_order || 1]
    );

    return NextResponse.json({
      message: 'Course added to roadmap',
      sequence_id: result.insertId,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error adding to roadmap:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
