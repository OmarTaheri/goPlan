import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithRole } from '@/lib/auth/rbac';
import { query, execute } from '@/lib/db/query';
import { ProgramRow, ProgramRequirementGroupRow, CountResult } from '@/lib/db/types';

interface Params {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/programs/[id]
 * Get a single program with its requirement groups
 */
export async function GET(request: NextRequest, { params }: Params) {
  try {
    await requireAuthWithRole(request, ['ADMIN']);
    const { id } = await params;
    const programId = parseInt(id, 10);

    if (isNaN(programId)) {
      return NextResponse.json({ error: 'Invalid program ID' }, { status: 400 });
    }

    const [programs] = await query<ProgramRow>(
      'SELECT * FROM programs WHERE program_id = ?',
      [programId]
    );

    if (programs.length === 0) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 });
    }

    // Get requirement groups
    const [groups] = await query<ProgramRequirementGroupRow>(
      `SELECT * FROM program_requirement_groups
       WHERE program_id = ?
       ORDER BY ISNULL(parent_group_id) DESC, parent_group_id, name`,
      [programId]
    );

    return NextResponse.json({
      program: programs[0],
      requirement_groups: groups,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error fetching program:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/admin/programs/[id]
 * Update a program
 */
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    await requireAuthWithRole(request, ['ADMIN']);
    const { id } = await params;
    const programId = parseInt(id, 10);

    if (isNaN(programId)) {
      return NextResponse.json({ error: 'Invalid program ID' }, { status: 400 });
    }

    const body = await request.json();
    const {
      name,
      code,
      school,
      type,
      total_credits_required,
      catalog_year,
      free_electives_credits,
      minor_required,
      concentrations_available,
      prerequisite_note,
    } = body;

    // Check program exists
    const [existing] = await query<ProgramRow>(
      'SELECT * FROM programs WHERE program_id = ?',
      [programId]
    );

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 });
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: (string | number | null)[] = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (code !== undefined) {
      updates.push('code = ?');
      values.push(code || null);
    }
    if (school !== undefined) {
      updates.push('school = ?');
      values.push(school || null);
    }
    if (type !== undefined) {
      if (!['MAJOR', 'MINOR', 'CONCENTRATION'].includes(type)) {
        return NextResponse.json(
          { error: 'type must be MAJOR, MINOR, or CONCENTRATION' },
          { status: 400 }
        );
      }
      updates.push('type = ?');
      values.push(type);
    }
    if (total_credits_required !== undefined) {
      if (total_credits_required < 0 || total_credits_required > 200) {
        return NextResponse.json(
          { error: 'total_credits_required must be between 0 and 200' },
          { status: 400 }
        );
      }
      updates.push('total_credits_required = ?');
      values.push(total_credits_required);
    }
    if (catalog_year !== undefined) {
      updates.push('catalog_year = ?');
      values.push(catalog_year || null);
    }
    if (free_electives_credits !== undefined) {
      updates.push('free_electives_credits = ?');
      values.push(free_electives_credits || 0);
    }
    if (minor_required !== undefined) {
      if (minor_required && !['YES', 'NO', 'CONDITIONAL'].includes(minor_required)) {
        return NextResponse.json(
          { error: 'minor_required must be YES, NO, or CONDITIONAL' },
          { status: 400 }
        );
      }
      updates.push('minor_required = ?');
      values.push(minor_required || null);
    }
    if (concentrations_available !== undefined) {
      if (concentrations_available && !['REQUIRED', 'OPTIONAL', 'NOT_AVAILABLE'].includes(concentrations_available)) {
        return NextResponse.json(
          { error: 'concentrations_available must be REQUIRED, OPTIONAL, or NOT_AVAILABLE' },
          { status: 400 }
        );
      }
      updates.push('concentrations_available = ?');
      values.push(concentrations_available || null);
    }
    if (prerequisite_note !== undefined) {
      updates.push('prerequisite_note = ?');
      values.push(prerequisite_note || null);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(programId);

    await execute(
      `UPDATE programs SET ${updates.join(', ')} WHERE program_id = ?`,
      values
    );

    return NextResponse.json({ message: 'Program updated successfully' });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error updating program:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/programs/[id]
 * Delete a program
 */
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    await requireAuthWithRole(request, ['ADMIN']);
    const { id } = await params;
    const programId = parseInt(id, 10);

    if (isNaN(programId)) {
      return NextResponse.json({ error: 'Invalid program ID' }, { status: 400 });
    }

    // Check program exists
    const [existing] = await query<ProgramRow>(
      'SELECT * FROM programs WHERE program_id = ?',
      [programId]
    );

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 });
    }

    // Check if program is in use by students
    const [students] = await query<CountResult>(
      `SELECT COUNT(*) as count FROM student_programs WHERE program_id = ?`,
      [programId]
    );

    if (students[0].count > 0) {
      return NextResponse.json(
        { error: 'Cannot delete program: it is assigned to students' },
        { status: 400 }
      );
    }

    await execute('DELETE FROM programs WHERE program_id = ?', [programId]);

    return NextResponse.json({ message: 'Program deleted successfully' });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error deleting program:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
