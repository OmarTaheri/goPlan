import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithRole } from '@/lib/auth/rbac';
import { query, execute } from '@/lib/db/query';
import { ProgramRequirementGroupRow, CourseRow, RequirementGroupCourseRow } from '@/lib/db/types';

interface Params {
  params: Promise<{ id: string; groupId: string }>;
}

/**
 * POST /api/admin/programs/[id]/requirements/[groupId]/courses
 * Add a course to a requirement group
 */
export async function POST(request: NextRequest, { params }: Params) {
  try {
    await requireAuthWithRole(request, ['ADMIN']);
    const { id, groupId } = await params;
    const programId = parseInt(id, 10);
    const groupIdNum = parseInt(groupId, 10);

    if (isNaN(programId) || isNaN(groupIdNum)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const body = await request.json();
    const { course_id, is_mandatory } = body;

    if (!course_id) {
      return NextResponse.json(
        { error: 'course_id is required' },
        { status: 400 }
      );
    }

    // Verify group exists and belongs to program
    const [groups] = await query<ProgramRequirementGroupRow>(
      'SELECT * FROM program_requirement_groups WHERE group_id = ? AND program_id = ?',
      [groupIdNum, programId]
    );

    if (groups.length === 0) {
      return NextResponse.json({ error: 'Requirement group not found' }, { status: 404 });
    }

    // Verify course exists
    const [courses] = await query<CourseRow>(
      'SELECT * FROM courses WHERE course_id = ?',
      [course_id]
    );

    if (courses.length === 0) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Check if course is already in this group
    const [existing] = await query<RequirementGroupCourseRow>(
      'SELECT * FROM requirement_group_courses WHERE group_id = ? AND course_id = ?',
      [groupIdNum, course_id]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Course is already in this requirement group' },
        { status: 409 }
      );
    }

    const result = await execute(
      `INSERT INTO requirement_group_courses (group_id, course_id, is_mandatory)
       VALUES (?, ?, ?)`,
      [groupIdNum, course_id, is_mandatory ?? false]
    );

    return NextResponse.json({
      message: 'Course added to requirement group',
      link_id: result.insertId,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error adding course to group:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/programs/[id]/requirements/[groupId]/courses
 * Remove a course from a requirement group
 */
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    await requireAuthWithRole(request, ['ADMIN']);
    const { id, groupId } = await params;
    const programId = parseInt(id, 10);
    const groupIdNum = parseInt(groupId, 10);

    if (isNaN(programId) || isNaN(groupIdNum)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('course_id');

    if (!courseId) {
      return NextResponse.json(
        { error: 'course_id query parameter is required' },
        { status: 400 }
      );
    }

    const courseIdNum = parseInt(courseId, 10);
    if (isNaN(courseIdNum)) {
      return NextResponse.json({ error: 'Invalid course_id' }, { status: 400 });
    }

    // Verify group exists
    const [groups] = await query<ProgramRequirementGroupRow>(
      'SELECT * FROM program_requirement_groups WHERE group_id = ? AND program_id = ?',
      [groupIdNum, programId]
    );

    if (groups.length === 0) {
      return NextResponse.json({ error: 'Requirement group not found' }, { status: 404 });
    }

    // Delete the link
    await execute(
      'DELETE FROM requirement_group_courses WHERE group_id = ? AND course_id = ?',
      [groupIdNum, courseIdNum]
    );

    return NextResponse.json({ message: 'Course removed from requirement group' });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error removing course from group:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
