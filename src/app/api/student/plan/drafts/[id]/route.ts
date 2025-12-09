import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithRole } from '@/lib/auth/rbac';
import { query, execute } from '@/lib/db/query';

interface DraftRow {
  draft_id: number;
  student_id: number;
  name: string;
  is_default: boolean;
}

/**
 * PUT /api/student/plan/drafts/[id]
 * Rename a draft
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuthWithRole(request, ['STUDENT']);
    const { id } = await params;
    const draftId = parseInt(id);

    if (isNaN(draftId)) {
      return NextResponse.json({ error: 'Invalid draft ID' }, { status: 400 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Draft name is required' },
        { status: 400 }
      );
    }

    if (name.length > 100) {
      return NextResponse.json(
        { error: 'Draft name must be 100 characters or less' },
        { status: 400 }
      );
    }

    // Verify ownership
    const [drafts] = await query<DraftRow>(
      `SELECT * FROM student_plan_drafts 
       WHERE draft_id = ? AND student_id = ?`,
      [draftId, user.user_id]
    );

    if (drafts.length === 0) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    // Check for duplicate names
    const [existing] = await query<DraftRow>(
      `SELECT * FROM student_plan_drafts 
       WHERE student_id = ? AND name = ? AND draft_id != ?`,
      [user.user_id, name.trim(), draftId]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'A draft with this name already exists' },
        { status: 400 }
      );
    }

    await execute(
      `UPDATE student_plan_drafts SET name = ? WHERE draft_id = ?`,
      [name.trim(), draftId]
    );

    return NextResponse.json({
      message: 'Draft renamed successfully',
      draft: {
        draft_id: draftId,
        name: name.trim(),
        is_default: drafts[0].is_default,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error renaming draft:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/student/plan/drafts/[id]
 * Delete a non-default draft
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuthWithRole(request, ['STUDENT']);
    const { id } = await params;
    const draftId = parseInt(id);

    if (isNaN(draftId)) {
      return NextResponse.json({ error: 'Invalid draft ID' }, { status: 400 });
    }

    // Verify ownership and check if default
    const [drafts] = await query<DraftRow>(
      `SELECT * FROM student_plan_drafts 
       WHERE draft_id = ? AND student_id = ?`,
      [draftId, user.user_id]
    );

    if (drafts.length === 0) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    if (drafts[0].is_default) {
      return NextResponse.json(
        { error: 'Cannot delete the default plan' },
        { status: 400 }
      );
    }

    // Delete draft (cascades to student_plan entries)
    await execute(
      `DELETE FROM student_plan_drafts WHERE draft_id = ?`,
      [draftId]
    );

    return NextResponse.json({
      message: 'Draft deleted successfully',
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error deleting draft:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
