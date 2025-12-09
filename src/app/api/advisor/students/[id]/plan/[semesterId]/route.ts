import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithRole, requireAdvisorAssigned } from '@/lib/auth/rbac';
import { getSemesterPlan, approvePlan, rejectPlan } from '@/lib/domain/plan/planService';
import { query } from '@/lib/db/query';

interface Params {
  params: Promise<{ id: string; semesterId: string }>;
}

/**
 * Helper to get the relevant draft ID for a semester
 * Prioritizes SUBMITTED or APPROVED drafts for this semester number.
 * Fallbacks to default draft.
 */
async function getRelevantDraftId(studentId: number, semesterNumber: number): Promise<number | null> {
    // 1. Try to find a customized plan (Submitted/Approved/Rejected) for this semester
    const [plans] = await query<{draft_id: number}>(
        `SELECT DISTINCT draft_id FROM student_plan 
         WHERE student_id = ? AND semester_number = ? AND status IN ('SUBMITTED', 'APPROVED', 'REJECTED')
         LIMIT 1`,
        [studentId, semesterNumber]
    );
    
    if (plans.length > 0) return plans[0].draft_id;

    // 2. Fallback to default draft
    const [defaults] = await query<{draft_id: number}>(
        `SELECT draft_id FROM student_plan_drafts 
         WHERE student_id = ? AND is_default = TRUE`,
        [studentId]
    );
    
    if (defaults.length > 0) return defaults[0].draft_id;
    
    // 3. Fallback to ANY draft
    const [any] = await query<{draft_id: number}>(
        `SELECT draft_id FROM student_plan_drafts WHERE student_id = ? LIMIT 1`,
        [studentId]
    );
    
    return any.length > 0 ? any[0].draft_id : null;
}

/**
 * GET /api/advisor/students/[id]/plan/[semesterId]
 * Get a specific semester plan for review
 */
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const advisor = await requireAuthWithRole(request, ['ADVISOR']);
    const { id, semesterId } = await params;
    const studentId = parseInt(id, 10);
    const semesterIdNum = parseInt(semesterId, 10);

    if (isNaN(studentId) || isNaN(semesterIdNum)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    // Verify advisor is assigned to this student
    await requireAdvisorAssigned(advisor.user_id, studentId);

    const draftId = await getRelevantDraftId(studentId, semesterIdNum);
    if (!draftId) {
         return NextResponse.json({ error: 'No plan draft found for student' }, { status: 404 });
    }

    const plan = await getSemesterPlan(studentId, draftId, semesterIdNum);

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    return NextResponse.json(plan);
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (error instanceof Error && error.message.includes('not assigned')) {
      return NextResponse.json({ error: 'Student not in your caseload' }, { status: 403 });
    }
    console.error('Error fetching plan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/advisor/students/[id]/plan/[semesterId]
 * Approve or reject a semester plan
 */
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const advisor = await requireAuthWithRole(request, ['ADVISOR']);
    const { id, semesterId } = await params;
    const studentId = parseInt(id, 10);
    const semesterIdNum = parseInt(semesterId, 10);

    if (isNaN(studentId) || isNaN(semesterIdNum)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    // Verify advisor is assigned to this student
    await requireAdvisorAssigned(advisor.user_id, studentId);

    const body = await request.json();
    const { action, comments } = body;

    const draftId = await getRelevantDraftId(studentId, semesterIdNum);
    if (!draftId) {
         return NextResponse.json({ error: 'No plan draft found for student' }, { status: 404 });
    }

    if (action === 'approve') {
      const result = await approvePlan(advisor.user_id, studentId, draftId, semesterIdNum, comments);

      if (!result.success) {
        return NextResponse.json({ error: result.message }, { status: 400 });
      }

      return NextResponse.json({
        message: result.message,
        approval_id: result.approvalId,
      });
    } else if (action === 'reject') {
      if (!comments || comments.trim().length === 0) {
        return NextResponse.json(
          { error: 'Comments are required when rejecting a plan' },
          { status: 400 }
        );
      }

      const result = await rejectPlan(advisor.user_id, studentId, draftId, semesterIdNum, comments);

      if (!result.success) {
        return NextResponse.json({ error: result.message }, { status: 400 });
      }

      return NextResponse.json({
        message: result.message,
        approval_id: result.approvalId,
      });
    } else {
      return NextResponse.json(
        { error: 'action must be "approve" or "reject"' },
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
    if (error instanceof Error && error.message.includes('not assigned')) {
      return NextResponse.json({ error: 'Student not in your caseload' }, { status: 403 });
    }
    console.error('Error processing plan action:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
