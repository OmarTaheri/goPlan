import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithRole } from '@/lib/auth/rbac';
import { query, execute, transaction } from '@/lib/db/query';
import { CourseDependencyRow, CourseRow } from '@/lib/db/types';

interface Params {
  params: Promise<{ id: string }>;
}

interface PrereqWithCourse extends CourseDependencyRow {
  prereq_code: string;
  prereq_title: string;
}

/**
 * GET /api/admin/courses/[id]/prerequisites
 * Get prerequisites for a course
 */
export async function GET(request: NextRequest, { params }: Params) {
  try {
    await requireAuthWithRole(request, ['ADMIN']);
    const { id } = await params;
    const courseId = parseInt(id, 10);

    if (isNaN(courseId)) {
      return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 });
    }

    // Verify course exists
    const [courses] = await query<CourseRow>(
      'SELECT * FROM courses WHERE course_id = ?',
      [courseId]
    );

    if (courses.length === 0) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Get prerequisites
    const [prerequisites] = await query<PrereqWithCourse>(
      `SELECT cd.*, c.course_code as prereq_code, c.title as prereq_title
       FROM course_dependencies cd
       LEFT JOIN courses c ON cd.dependency_course_id = c.course_id
       WHERE cd.course_id = ?
       ORDER BY cd.dependency_type, c.course_code`,
      [courseId]
    );

    return NextResponse.json({
      course: courses[0],
      prerequisites,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error fetching prerequisites:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/admin/courses/[id]/prerequisites
 * Update prerequisites for a course (replace all)
 */
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    await requireAuthWithRole(request, ['ADMIN']);
    const { id } = await params;
    const courseId = parseInt(id, 10);

    if (isNaN(courseId)) {
      return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 });
    }

    const body = await request.json();
    const { prerequisites } = body as {
      prerequisites: Array<{
        dependency_course_id?: number;
        dependency_type: 'PREREQUISITE' | 'COREQUISITE' | 'STATUS';
        required_status?: 'FRESHMAN' | 'SOPHOMORE' | 'JUNIOR' | 'SENIOR';
        note?: string;
      }>;
    };

    if (!Array.isArray(prerequisites)) {
      return NextResponse.json(
        { error: 'prerequisites must be an array' },
        { status: 400 }
      );
    }

    // Verify course exists
    const [courses] = await query<CourseRow>(
      'SELECT * FROM courses WHERE course_id = ?',
      [courseId]
    );

    if (courses.length === 0) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Validate all dependency course IDs exist and validate STATUS prerequisites
    for (const prereq of prerequisites) {
      // Validate STATUS prerequisites
      if (prereq.dependency_type === 'STATUS') {
        if (!prereq.required_status) {
          return NextResponse.json(
            { error: 'STATUS prerequisites must specify required_status' },
            { status: 400 }
          );
        }
        const validStatuses = ['FRESHMAN', 'SOPHOMORE', 'JUNIOR', 'SENIOR'];
        if (!validStatuses.includes(prereq.required_status)) {
          return NextResponse.json(
            { error: `Invalid required_status. Must be one of: ${validStatuses.join(', ')}` },
            { status: 400 }
          );
        }
        continue; // STATUS prerequisites don't have dependency_course_id
      }

      if (prereq.dependency_course_id) {
        const [depCourse] = await query<CourseRow>(
          'SELECT course_id FROM courses WHERE course_id = ?',
          [prereq.dependency_course_id]
        );
        if (depCourse.length === 0) {
          return NextResponse.json(
            { error: `Prerequisite course ID ${prereq.dependency_course_id} not found` },
            { status: 400 }
          );
        }

        // Prevent self-reference
        if (prereq.dependency_course_id === courseId) {
          return NextResponse.json(
            { error: 'A course cannot be a prerequisite of itself' },
            { status: 400 }
          );
        }
      }
    }

    // Replace all prerequisites in a transaction
    await transaction(async (conn) => {
      // Delete existing prerequisites
      await conn.query(
        'DELETE FROM course_dependencies WHERE course_id = ?',
        [courseId]
      );

      // Insert new prerequisites
      for (const prereq of prerequisites) {
        await conn.query(
          `INSERT INTO course_dependencies (course_id, dependency_course_id, dependency_type, required_status, note)
           VALUES (?, ?, ?, ?, ?)`,
          [
            courseId,
            prereq.dependency_type === 'STATUS' ? null : (prereq.dependency_course_id || null),
            prereq.dependency_type,
            prereq.dependency_type === 'STATUS' ? prereq.required_status : null,
            prereq.note || null,
          ]
        );
      }
    });

    return NextResponse.json({ message: 'Prerequisites updated successfully' });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error updating prerequisites:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/courses/[id]/prerequisites
 * Add a single prerequisite
 */
export async function POST(request: NextRequest, { params }: Params) {
  try {
    await requireAuthWithRole(request, ['ADMIN']);
    const { id } = await params;
    const courseId = parseInt(id, 10);

    if (isNaN(courseId)) {
      return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 });
    }

    const body = await request.json();
    const { dependency_course_id, dependency_type, required_status, note } = body;

    if (!dependency_type || !['PREREQUISITE', 'COREQUISITE', 'STATUS'].includes(dependency_type)) {
      return NextResponse.json(
        { error: 'dependency_type must be PREREQUISITE, COREQUISITE, or STATUS' },
        { status: 400 }
      );
    }

    // Validate STATUS prerequisites
    if (dependency_type === 'STATUS') {
      if (!required_status) {
        return NextResponse.json(
          { error: 'STATUS prerequisites must specify required_status' },
          { status: 400 }
        );
      }
      const validStatuses = ['FRESHMAN', 'SOPHOMORE', 'JUNIOR', 'SENIOR'];
      if (!validStatuses.includes(required_status)) {
        return NextResponse.json(
          { error: `Invalid required_status. Must be one of: ${validStatuses.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // Verify course exists
    const [courses] = await query<CourseRow>(
      'SELECT * FROM courses WHERE course_id = ?',
      [courseId]
    );

    if (courses.length === 0) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Validate dependency course exists if provided (not needed for STATUS)
    if (dependency_type !== 'STATUS' && dependency_course_id) {
      if (dependency_course_id === courseId) {
        return NextResponse.json(
          { error: 'A course cannot be a prerequisite of itself' },
          { status: 400 }
        );
      }

      const [depCourse] = await query<CourseRow>(
        'SELECT course_id FROM courses WHERE course_id = ?',
        [dependency_course_id]
      );
      if (depCourse.length === 0) {
        return NextResponse.json(
          { error: 'Prerequisite course not found' },
          { status: 400 }
        );
      }
    }

    const result = await execute(
      `INSERT INTO course_dependencies (course_id, dependency_course_id, dependency_type, required_status, note)
       VALUES (?, ?, ?, ?, ?)`,
      [
        courseId, 
        dependency_type === 'STATUS' ? null : (dependency_course_id || null), 
        dependency_type, 
        dependency_type === 'STATUS' ? required_status : null,
        note || null
      ]
    );

    return NextResponse.json({
      message: 'Prerequisite added successfully',
      dependency_id: result.insertId,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error adding prerequisite:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

