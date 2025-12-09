import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithRole } from '@/lib/auth/rbac';
import { query, execute } from '@/lib/db/query';
import { SemesterRow } from '@/lib/db/types';

/**
 * GET /api/admin/semesters
 * List all semesters
 */
export async function GET(request: NextRequest) {
  try {
    await requireAuthWithRole(request, ['ADMIN']);

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';

    let sql = 'SELECT * FROM semesters';
    const params: boolean[] = [];

    if (activeOnly) {
      sql += ' WHERE is_active = TRUE';
    }

    sql += ' ORDER BY start_date DESC';

    const [semesters] = await query<SemesterRow>(sql, params);

    return NextResponse.json({ semesters });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error fetching semesters:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/semesters
 * Create a new semester
 */
export async function POST(request: NextRequest) {
  try {
    await requireAuthWithRole(request, ['ADMIN']);

    const body = await request.json();
    const { name, start_date, end_date, is_active } = body;

    if (!name || !start_date || !end_date) {
      return NextResponse.json(
        { error: 'Missing required fields: name, start_date, end_date' },
        { status: 400 }
      );
    }

    // Validate dates
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }

    if (startDate >= endDate) {
      return NextResponse.json(
        { error: 'Start date must be before end date' },
        { status: 400 }
      );
    }

    // If setting as active, deactivate other semesters first
    if (is_active) {
      await execute('UPDATE semesters SET is_active = FALSE');
    }

    const result = await execute(
      `INSERT INTO semesters (name, start_date, end_date, is_active)
       VALUES (?, ?, ?, ?)`,
      [name, start_date, end_date, is_active ?? false]
    );

    return NextResponse.json({
      message: 'Semester created successfully',
      semester_id: result.insertId,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error creating semester:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/admin/semesters
 * Update a semester (use query param ?id=)
 */
export async function PUT(request: NextRequest) {
  try {
    await requireAuthWithRole(request, ['ADMIN']);

    const { searchParams } = new URL(request.url);
    const semesterId = parseInt(searchParams.get('id') || '', 10);

    if (isNaN(semesterId)) {
      return NextResponse.json({ error: 'Invalid semester ID' }, { status: 400 });
    }

    const body = await request.json();
    const { name, start_date, end_date, is_active } = body;

    // Check semester exists
    const [existing] = await query<SemesterRow>(
      'SELECT * FROM semesters WHERE semester_id = ?',
      [semesterId]
    );

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Semester not found' }, { status: 404 });
    }

    const updates: string[] = [];
    const values: (string | boolean)[] = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (start_date !== undefined) {
      updates.push('start_date = ?');
      values.push(start_date);
    }
    if (end_date !== undefined) {
      updates.push('end_date = ?');
      values.push(end_date);
    }
    if (is_active !== undefined) {
      // If setting as active, deactivate others first
      if (is_active) {
        await execute('UPDATE semesters SET is_active = FALSE');
      }
      updates.push('is_active = ?');
      values.push(is_active);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(semesterId as unknown as string);

    await execute(
      `UPDATE semesters SET ${updates.join(', ')} WHERE semester_id = ?`,
      values
    );

    return NextResponse.json({ message: 'Semester updated successfully' });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error updating semester:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
