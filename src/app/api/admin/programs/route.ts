import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithRole } from '@/lib/auth/rbac';
import { query, execute } from '@/lib/db/query';
import { ProgramRow } from '@/lib/db/types';

/**
 * GET /api/admin/programs
 * List all programs with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    await requireAuthWithRole(request, ['ADMIN']);

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const school = searchParams.get('school');
    const parentId = searchParams.get('parent_id');

    let sql = 'SELECT * FROM programs WHERE 1=1';
    const params: (string | number)[] = [];

    if (type && ['MAJOR', 'MINOR', 'CONCENTRATION'].includes(type)) {
      sql += ' AND type = ?';
      params.push(type);
    }

    if (school) {
      sql += ' AND school = ?';
      params.push(school);
    }

    if (parentId) {
      sql += ' AND parent_program_id = ?';
      params.push(parseInt(parentId, 10));
    }

    sql += ' ORDER BY type, name';

    const [programs] = await query<ProgramRow>(sql, params);

    return NextResponse.json({ programs });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error fetching programs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/programs
 * Create a new program (Major, Minor, or Concentration)
 */
export async function POST(request: NextRequest) {
  try {
    await requireAuthWithRole(request, ['ADMIN']);

    const body = await request.json();
    const {
      name,
      code,
      school,
      type,
      total_credits_required,
      catalog_year,
      parent_program_id,
      minor_required,
      concentrations_available,
      free_electives_credits,
      prerequisite_note,
    } = body;

    // Validate required fields
    if (!name || !type || total_credits_required === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: name, type, total_credits_required' },
        { status: 400 }
      );
    }

    if (!['MAJOR', 'MINOR', 'CONCENTRATION'].includes(type)) {
      return NextResponse.json(
        { error: 'type must be MAJOR, MINOR, or CONCENTRATION' },
        { status: 400 }
      );
    }

    if (total_credits_required < 0 || total_credits_required > 200) {
      return NextResponse.json(
        { error: 'total_credits_required must be between 0 and 200' },
        { status: 400 }
      );
    }

    // Validate concentration has parent
    if (type === 'CONCENTRATION' && !parent_program_id) {
      return NextResponse.json(
        { error: 'Concentrations must have a parent_program_id (the parent Major)' },
        { status: 400 }
      );
    }

    // Validate minor_required for majors
    if (minor_required && !['YES', 'NO', 'CONDITIONAL'].includes(minor_required)) {
      return NextResponse.json(
        { error: 'minor_required must be YES, NO, or CONDITIONAL' },
        { status: 400 }
      );
    }

    // Validate concentrations_available for majors
    if (concentrations_available && !['REQUIRED', 'OPTIONAL', 'NOT_AVAILABLE'].includes(concentrations_available)) {
      return NextResponse.json(
        { error: 'concentrations_available must be REQUIRED, OPTIONAL, or NOT_AVAILABLE' },
        { status: 400 }
      );
    }

    const result = await execute(
      `INSERT INTO programs (
        name, code, school, type, total_credits_required, catalog_year,
        parent_program_id, minor_required, concentrations_available,
        free_electives_credits, prerequisite_note
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        code || null,
        school || null,
        type,
        total_credits_required,
        catalog_year || null,
        parent_program_id || null,
        minor_required || null,
        concentrations_available || null,
        free_electives_credits || 0,
        prerequisite_note || null,
      ]
    );

    return NextResponse.json({
      message: 'Program created successfully',
      program_id: result.insertId,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error creating program:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
