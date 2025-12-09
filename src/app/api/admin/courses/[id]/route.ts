import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithRole } from '@/lib/auth/rbac';
import { query, execute } from '@/lib/db/query';
import { CourseRow } from '@/lib/db/types';
import { RowDataPacket } from 'mysql2/promise';

interface Params {
  params: Promise<{ id: string }>;
}

interface DependentCourseRow extends RowDataPacket {
  course_id: number;
  course_code: string;
  title: string;
}

/**
 * GET /api/admin/courses/[id]
 * Get a single course by ID
 */
export async function GET(request: NextRequest, { params }: Params) {
  try {
    await requireAuthWithRole(request, ['ADMIN']);
    const { id } = await params;
    const courseId = parseInt(id, 10);

    if (isNaN(courseId)) {
      return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 });
    }

    const [courses] = await query<CourseRow>(
      'SELECT * FROM courses WHERE course_id = ?',
      [courseId]
    );

    if (courses.length === 0) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    return NextResponse.json({ course: courses[0] });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error fetching course:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/admin/courses/[id]
 * Update a course
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
    const { course_code, title, credits, description, is_active } = body;

    // Check course exists
    const [existing] = await query<CourseRow>(
      'SELECT * FROM courses WHERE course_id = ?',
      [courseId]
    );

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Check for duplicate course code (excluding current course)
    if (course_code && course_code !== existing[0].course_code) {
      const [duplicate] = await query<CourseRow>(
        'SELECT course_id FROM courses WHERE course_code = ? AND course_id != ?',
        [course_code, courseId]
      );

      if (duplicate.length > 0) {
        return NextResponse.json(
          { error: 'A course with this code already exists' },
          { status: 409 }
        );
      }
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: (string | number | boolean | null)[] = [];

    if (course_code !== undefined) {
      updates.push('course_code = ?');
      values.push(course_code);
    }
    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title);
    }
    if (credits !== undefined) {
      if (credits < 0 || credits > 12) {
        return NextResponse.json(
          { error: 'Credits must be between 0 and 12' },
          { status: 400 }
        );
      }
      updates.push('credits = ?');
      values.push(credits);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(is_active);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(courseId);

    await execute(
      `UPDATE courses SET ${updates.join(', ')} WHERE course_id = ?`,
      values
    );

    return NextResponse.json({ message: 'Course updated successfully' });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error updating course:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/courses/[id]
 * Soft delete a course (set is_active = false)
 * Returns error if course is a prerequisite for other active courses
 */
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    await requireAuthWithRole(request, ['ADMIN']);
    const { id } = await params;
    const courseId = parseInt(id, 10);

    if (isNaN(courseId)) {
      return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 });
    }

    // Check course exists
    const [existing] = await query<CourseRow>(
      'SELECT * FROM courses WHERE course_id = ?',
      [courseId]
    );

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Check if this course is a prerequisite for other active courses
    const [dependentCourses] = await query<DependentCourseRow>(
      `SELECT DISTINCT c.course_id, c.course_code, c.title
       FROM course_dependencies cd
       JOIN courses c ON cd.course_id = c.course_id
       WHERE cd.dependency_course_id = ? 
         AND c.is_active = TRUE
         AND cd.dependency_type IN ('PREREQUISITE', 'COREQUISITE')`,
      [courseId]
    );

    if (dependentCourses.length > 0) {
      return NextResponse.json({
        error: 'Cannot deactivate this course because it is a prerequisite for other active courses',
        dependentCourses: dependentCourses.map(c => ({
          course_id: c.course_id,
          course_code: c.course_code,
          title: c.title,
        })),
      }, { status: 409 });
    }

    // Soft delete - set is_active to false
    await execute(
      'UPDATE courses SET is_active = FALSE WHERE course_id = ?',
      [courseId]
    );

    return NextResponse.json({ message: 'Course deactivated successfully' });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error deleting course:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/courses/[id]
 * Activate an inactive course
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    await requireAuthWithRole(request, ['ADMIN']);
    const { id } = await params;
    const courseId = parseInt(id, 10);

    if (isNaN(courseId)) {
      return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 });
    }

    const body = await request.json();
    const { action } = body;

    // Check course exists
    const [existing] = await query<CourseRow>(
      'SELECT * FROM courses WHERE course_id = ?',
      [courseId]
    );

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    if (action === 'activate') {
      await execute(
        'UPDATE courses SET is_active = TRUE WHERE course_id = ?',
        [courseId]
      );
      return NextResponse.json({ message: 'Course activated successfully' });
    } else if (action === 'delete') {
      // Hard delete - only if course has no dependencies referencing it
      const [dependentCourses] = await query<DependentCourseRow>(
        `SELECT DISTINCT c.course_id, c.course_code, c.title
         FROM course_dependencies cd
         JOIN courses c ON cd.course_id = c.course_id
         WHERE cd.dependency_course_id = ?`,
        [courseId]
      );

      if (dependentCourses.length > 0) {
        return NextResponse.json({
          error: 'Cannot delete this course because it is referenced as a prerequisite by other courses',
          dependentCourses: dependentCourses.map(c => ({
            course_id: c.course_id,
            course_code: c.course_code,
            title: c.title,
          })),
        }, { status: 409 });
      }

      // Delete course dependencies where this course is the dependent
      await execute(
        'DELETE FROM course_dependencies WHERE course_id = ?',
        [courseId]
      );

      // Delete from requirement_group_courses
      await execute(
        'DELETE FROM requirement_group_courses WHERE course_id = ?',
        [courseId]
      );

      // Delete from recommended_sequence
      await execute(
        'DELETE FROM recommended_sequence WHERE course_id = ?',
        [courseId]
      );

      // Finally delete the course
      await execute(
        'DELETE FROM courses WHERE course_id = ?',
        [courseId]
      );

      return NextResponse.json({ message: 'Course permanently deleted' });
    }

    return NextResponse.json({ error: 'Invalid action. Use "activate" or "delete"' }, { status: 400 });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error patching course:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
