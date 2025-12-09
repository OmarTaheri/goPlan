import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithRole, requireAdvisorAssigned } from '@/lib/auth/rbac';
import { runDegreeAudit } from '@/lib/domain/audit/degreeAudit';

interface Params {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/advisor/students/[id]/audit
 * Run degree audit for a student in the advisor's caseload
 */
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const advisor = await requireAuthWithRole(request, ['ADVISOR']);
    const { id } = await params;
    const studentId = parseInt(id, 10);

    if (isNaN(studentId)) {
      return NextResponse.json({ error: 'Invalid student ID' }, { status: 400 });
    }

    // Verify advisor is assigned to this student
    await requireAdvisorAssigned(advisor.user_id, studentId);

    const auditResult = await runDegreeAudit(studentId);

    return NextResponse.json(auditResult);
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
    console.error('Error running audit:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
