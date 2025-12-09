import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithRole } from '@/lib/auth/rbac';
import { query, execute } from '@/lib/db/query';
import { ProgramRequirementGroupRow } from '@/lib/db/types';

interface Params {
  params: Promise<{ id: string; groupId: string }>;
}

/**
 * PUT /api/admin/programs/[id]/requirements/[groupId]
 * Update a requirement group
 */
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    await requireAuthWithRole(request, ['ADMIN']);
    const { id, groupId } = await params;
    const programId = parseInt(id, 10);
    const groupIdNum = parseInt(groupId, 10);

    if (isNaN(programId) || isNaN(groupIdNum)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const body = await request.json();
    const { name, credits_required, min_courses_required, parent_group_id } = body;

    // Verify group exists
    const [groups] = await query<ProgramRequirementGroupRow>(
      'SELECT * FROM program_requirement_groups WHERE group_id = ? AND program_id = ?',
      [groupIdNum, programId]
    );

    if (groups.length === 0) {
      return NextResponse.json({ error: 'Requirement group not found' }, { status: 404 });
    }

    // Build update query
    const updates: string[] = [];
    const values: (string | number | null)[] = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (credits_required !== undefined) {
      updates.push('credits_required = ?');
      values.push(credits_required);
    }
    if (min_courses_required !== undefined) {
      updates.push('min_courses_required = ?');
      values.push(min_courses_required);
    }
    if (parent_group_id !== undefined) {
      // Prevent circular reference
      if (parent_group_id === groupIdNum) {
        return NextResponse.json(
          { error: 'A group cannot be its own parent' },
          { status: 400 }
        );
      }

      if (parent_group_id !== null) {
        // Verify parent exists and belongs to same program
        const [parent] = await query<ProgramRequirementGroupRow>(
          'SELECT * FROM program_requirement_groups WHERE group_id = ? AND program_id = ?',
          [parent_group_id, programId]
        );

        if (parent.length === 0) {
          return NextResponse.json(
            { error: 'Parent group not found' },
            { status: 400 }
          );
        }
      }

      updates.push('parent_group_id = ?');
      values.push(parent_group_id);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(groupIdNum);

    await execute(
      `UPDATE program_requirement_groups SET ${updates.join(', ')} WHERE group_id = ?`,
      values
    );

    return NextResponse.json({ message: 'Requirement group updated successfully' });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error updating requirement group:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/programs/[id]/requirements/[groupId]
 * Delete a requirement group
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

    // Verify group exists
    const [groups] = await query<ProgramRequirementGroupRow>(
      'SELECT * FROM program_requirement_groups WHERE group_id = ? AND program_id = ?',
      [groupIdNum, programId]
    );

    if (groups.length === 0) {
      return NextResponse.json({ error: 'Requirement group not found' }, { status: 404 });
    }

    // Check if group has children
    const [children] = await query<ProgramRequirementGroupRow>(
      'SELECT * FROM program_requirement_groups WHERE parent_group_id = ?',
      [groupIdNum]
    );

    if (children.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete group with child groups. Delete children first.' },
        { status: 400 }
      );
    }

    // Delete linked courses first (foreign key constraint)
    await execute(
      'DELETE FROM requirement_group_courses WHERE group_id = ?',
      [groupIdNum]
    );

    // Delete the group
    await execute(
      'DELETE FROM program_requirement_groups WHERE group_id = ?',
      [groupIdNum]
    );

    return NextResponse.json({ message: 'Requirement group deleted successfully' });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error deleting requirement group:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
