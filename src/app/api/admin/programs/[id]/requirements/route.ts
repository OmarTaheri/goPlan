import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithRole } from '@/lib/auth/rbac';
import { query, execute } from '@/lib/db/query';
import { ProgramRow, ProgramRequirementGroupRow, RequirementGroupCourseRow, CourseRow } from '@/lib/db/types';

interface Params {
  params: Promise<{ id: string }>;
}

interface GroupWithCourses extends ProgramRequirementGroupRow {
  courses: Array<{
    link_id: number;
    course_id: number;
    course_code: string;
    title: string;
    credits: number;
    is_mandatory: boolean;
  }>;
}

/**
 * GET /api/admin/programs/[id]/requirements
 * Get all requirement groups with their courses
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

    // Get all groups
    const [groups] = await query<ProgramRequirementGroupRow>(
      `SELECT * FROM program_requirement_groups
       WHERE program_id = ?
       ORDER BY ISNULL(parent_group_id) DESC, parent_group_id, name`,
      [programId]
    );

    // Get courses for each group
    const groupsWithCourses: GroupWithCourses[] = [];

    for (const group of groups) {
      const [courses] = await query<RequirementGroupCourseRow & CourseRow>(
        `SELECT rgc.link_id, rgc.course_id, rgc.is_mandatory, c.course_code, c.title, c.credits
         FROM requirement_group_courses rgc
         JOIN courses c ON rgc.course_id = c.course_id
         WHERE rgc.group_id = ?
         ORDER BY c.course_code`,
        [group.group_id]
      );

      groupsWithCourses.push({
        ...group,
        courses: courses.map(c => ({
          link_id: c.link_id,
          course_id: c.course_id,
          course_code: c.course_code,
          title: c.title,
          credits: c.credits,
          is_mandatory: c.is_mandatory,
        })),
      });
    }

    return NextResponse.json({
      program: programs[0],
      requirement_groups: groupsWithCourses,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error fetching requirements:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/programs/[id]/requirements
 * Create a new requirement group
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
    const { name, credits_required, min_courses_required, parent_group_id } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'name is required' },
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

    // Verify parent group exists if provided
    if (parent_group_id) {
      const [parentGroup] = await query<ProgramRequirementGroupRow>(
        'SELECT * FROM program_requirement_groups WHERE group_id = ? AND program_id = ?',
        [parent_group_id, programId]
      );

      if (parentGroup.length === 0) {
        return NextResponse.json(
          { error: 'Parent group not found or belongs to different program' },
          { status: 400 }
        );
      }
    }

    const result = await execute(
      `INSERT INTO program_requirement_groups (program_id, name, credits_required, min_courses_required, parent_group_id)
       VALUES (?, ?, ?, ?, ?)`,
      [
        programId,
        name,
        credits_required || 0,
        min_courses_required || 0,
        parent_group_id || null,
      ]
    );

    return NextResponse.json({
      message: 'Requirement group created successfully',
      group_id: result.insertId,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error creating requirement group:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
