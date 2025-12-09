import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithRole } from '@/lib/auth/rbac';
import { getSemesterPlan, submitPlan, revisePlan } from '@/lib/domain/plan/planService';
import { query } from '@/lib/db/query';

interface Params {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/student/plan/semester/[id]
 * Get the plan for a specific semester
 * Query param: draft_id (required/optional - if optional, assume default)
 */
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const user = await requireAuthWithRole(request, ['STUDENT']);
    const { id } = await params;
    const semesterNumber = parseInt(id, 10);
    const { searchParams } = new URL(request.url);
    const draftIdParam = searchParams.get('draft_id');

    if (isNaN(semesterNumber)) {
      return NextResponse.json({ error: 'Invalid semester number' }, { status: 400 });
    }

    let activeDraftId = draftIdParam ? parseInt(draftIdParam) : 0;
    
    // If no draft_id, find default
    if (!activeDraftId) {
        const [rows] = await query<{draft_id: number}>(
            `SELECT draft_id FROM student_plan_drafts WHERE student_id = ? AND is_default = TRUE`,
            [user.user_id]
        );
        if (rows.length > 0) activeDraftId = rows[0].draft_id;
        else return NextResponse.json({ error: 'No default draft found' }, { status: 404 });
    }

    const plan = await getSemesterPlan(user.user_id, activeDraftId, semesterNumber);

    if (!plan) {
      return NextResponse.json({ error: 'Semester not found' }, { status: 404 });
    }

    return NextResponse.json(plan);
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error fetching semester plan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/student/plan/semester/[id]
 * Submit or revise a semester plan
 */
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const user = await requireAuthWithRole(request, ['STUDENT']);
    const { id } = await params;
    const semesterNumber = parseInt(id, 10);

    if (isNaN(semesterNumber)) {
      return NextResponse.json({ error: 'Invalid semester number' }, { status: 400 });
    }

    const body = await request.json();
    const { action, draft_id } = body;
    
    let activeDraftId = draft_id ? parseInt(draft_id) : 0;
    if (!activeDraftId) {
         // Should ideally be required for POST, but fallback to default
        const [rows] = await query<{draft_id: number}>(
            `SELECT draft_id FROM student_plan_drafts WHERE student_id = ? AND is_default = TRUE`,
            [user.user_id]
        );
        if (rows.length > 0) activeDraftId = rows[0].draft_id;
        else return NextResponse.json({ error: 'Draft ID required' }, { status: 400 });
    }

    if (action === 'submit') {
      const result = await submitPlan(user.user_id, activeDraftId, semesterNumber);

      if (!result.success) {
        return NextResponse.json({
          error: result.message,
          errors: result.errors,
          warnings: result.warnings,
        }, { status: 400 });
      }

      return NextResponse.json({
        message: result.message,
        warnings: result.warnings,
      });
    } else if (action === 'revise') {
      const result = await revisePlan(user.user_id, activeDraftId, semesterNumber);

      if (!result.success) {
        return NextResponse.json({ error: result.message }, { status: 400 });
      }

      return NextResponse.json({ message: result.message });
    } else {
      return NextResponse.json(
        { error: 'action must be "submit" or "revise"' },
        { status: 400 }
      );
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error processing plan action:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
