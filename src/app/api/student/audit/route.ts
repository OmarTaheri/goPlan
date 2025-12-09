import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithRole } from '@/lib/auth/rbac';
import { runDegreeAudit } from '@/lib/domain/audit/degreeAudit';

/**
 * GET /api/student/audit
 * Run degree audit for the current student
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuthWithRole(request, ['STUDENT']);

    const auditResult = await runDegreeAudit(user.user_id);

    return NextResponse.json(auditResult);
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error running audit:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
