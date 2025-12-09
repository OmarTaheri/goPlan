import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithRole, requireAdvisorAssigned } from '@/lib/auth/rbac';
import { query, execute } from '@/lib/db/query';

/**
 * Note: This requires adding an overrides table to the schema.
 * For now, we'll implement a basic structure that can be expanded.
 *
 * The override system allows advisors to waive prerequisites or substitute courses.
 */

interface Override {
  override_id: number;
  student_id: number;
  student_name: string;
  course_id: number;
  course_code: string;
  override_type: 'WAIVER' | 'SUBSTITUTION';
  substitute_course_id: number | null;
  substitute_course_code: string | null;
  rationale: string;
  created_by: number;
  created_at: Date;
}

/**
 * GET /api/advisor/overrides
 * List all overrides created by the advisor
 */
export async function GET(request: NextRequest) {
  try {
    const advisor = await requireAuthWithRole(request, ['ADVISOR']);

    // Check if overrides table exists
    // For now, return empty array since table doesn't exist yet
    // TODO: Create overrides table in schema.sql

    return NextResponse.json({
      overrides: [],
      message: 'Override system not yet implemented. Table needs to be added to schema.',
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error fetching overrides:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/advisor/overrides
 * Create a new override (waiver or substitution)
 */
export async function POST(request: NextRequest) {
  try {
    const advisor = await requireAuthWithRole(request, ['ADVISOR']);

    const body = await request.json();
    const {
      student_id,
      course_id,
      override_type,
      substitute_course_id,
      rationale,
    } = body;

    // Validation
    if (!student_id || !course_id || !override_type || !rationale) {
      return NextResponse.json(
        { error: 'Missing required fields: student_id, course_id, override_type, rationale' },
        { status: 400 }
      );
    }

    if (!['WAIVER', 'SUBSTITUTION'].includes(override_type)) {
      return NextResponse.json(
        { error: 'override_type must be WAIVER or SUBSTITUTION' },
        { status: 400 }
      );
    }

    if (override_type === 'SUBSTITUTION' && !substitute_course_id) {
      return NextResponse.json(
        { error: 'substitute_course_id is required for SUBSTITUTION overrides' },
        { status: 400 }
      );
    }

    // Verify advisor is assigned to student
    await requireAdvisorAssigned(advisor.user_id, student_id);

    // TODO: Insert into overrides table when created
    // For now, return a message indicating the feature is pending

    return NextResponse.json({
      message: 'Override system not yet implemented. Table needs to be added to schema.',
      pending_override: {
        student_id,
        course_id,
        override_type,
        substitute_course_id,
        rationale,
        advisor_id: advisor.user_id,
      },
    }, { status: 501 });
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
    console.error('Error creating override:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
