import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithRole } from '@/lib/auth/rbac';
import { removeCourseFromPlan } from '@/lib/domain/plan/planService';

interface Params {
  params: Promise<{ courseId: string }>;
}

/**
 * DELETE /api/student/plan/[courseId]
 * Remove a course from the student's plan
 * Note: courseId here is actually plan_id
 */
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const user = await requireAuthWithRole(request, ['STUDENT']);
    const { courseId } = await params;
    const planId = parseInt(courseId, 10);

    if (isNaN(planId)) {
      return NextResponse.json({ error: 'Invalid plan ID' }, { status: 400 });
    }

    const result = await removeCourseFromPlan(user.user_id, planId);

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({ message: result.message });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error removing from plan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
