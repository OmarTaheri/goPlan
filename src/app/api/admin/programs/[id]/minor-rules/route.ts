import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithRole } from '@/lib/auth/rbac';
import { query, execute } from '@/lib/db/query';
import { ProgramRow } from '@/lib/db/types';

interface Params {
  params: Promise<{ id: string }>;
}

interface MinorRuleRow {
  rule_id: number;
  program_id: number;
  minor_program_id: number;
  rule_type: 'ALLOWED' | 'FORBIDDEN';
  minor_name?: string;
  minor_code?: string;
}

/**
 * GET /api/admin/programs/[id]/minor-rules
 * Get all minor rules for a program
 */
export async function GET(request: NextRequest, { params }: Params) {
  try {
    await requireAuthWithRole(request, ['ADMIN']);
    const { id } = await params;
    const programId = parseInt(id, 10);

    if (isNaN(programId)) {
      return NextResponse.json({ error: 'Invalid program ID' }, { status: 400 });
    }

    const [rules] = await query<MinorRuleRow>(
      `SELECT pmr.*, p.name as minor_name, p.code as minor_code
       FROM program_minor_rules pmr
       JOIN programs p ON pmr.minor_program_id = p.program_id
       WHERE pmr.program_id = ?
       ORDER BY p.name`,
      [programId]
    );

    return NextResponse.json({ rules });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error fetching minor rules:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/programs/[id]/minor-rules
 * Add a minor rule (allowed/forbidden)
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
    const { minor_program_id, rule_type } = body;

    if (!minor_program_id || !rule_type) {
      return NextResponse.json(
        { error: 'minor_program_id and rule_type are required' },
        { status: 400 }
      );
    }

    if (!['ALLOWED', 'FORBIDDEN'].includes(rule_type)) {
      return NextResponse.json(
        { error: 'rule_type must be ALLOWED or FORBIDDEN' },
        { status: 400 }
      );
    }

    // Verify the program exists
    const [programs] = await query<ProgramRow>(
      'SELECT * FROM programs WHERE program_id = ?',
      [programId]
    );

    if (programs.length === 0) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 });
    }

    // Verify the minor exists
    const [minors] = await query<ProgramRow>(
      'SELECT * FROM programs WHERE program_id = ? AND type = ?',
      [minor_program_id, 'MINOR']
    );

    if (minors.length === 0) {
      return NextResponse.json({ error: 'Minor not found' }, { status: 404 });
    }

    // Insert or update the rule
    await execute(
      `INSERT INTO program_minor_rules (program_id, minor_program_id, rule_type)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE rule_type = ?`,
      [programId, minor_program_id, rule_type, rule_type]
    );

    return NextResponse.json({ message: 'Minor rule saved successfully' }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error saving minor rule:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/programs/[id]/minor-rules
 * Delete a minor rule
 */
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    await requireAuthWithRole(request, ['ADMIN']);
    const { id } = await params;
    const programId = parseInt(id, 10);

    if (isNaN(programId)) {
      return NextResponse.json({ error: 'Invalid program ID' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const minorId = searchParams.get('minor_id');

    if (!minorId) {
      return NextResponse.json({ error: 'minor_id query parameter is required' }, { status: 400 });
    }

    await execute(
      'DELETE FROM program_minor_rules WHERE program_id = ? AND minor_program_id = ?',
      [programId, parseInt(minorId, 10)]
    );

    return NextResponse.json({ message: 'Minor rule deleted successfully' });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error deleting minor rule:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
