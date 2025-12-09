import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithRole } from '@/lib/auth/rbac';
import { query, execute } from '@/lib/db/query';
import { UserRow, UserRowPublic } from '@/lib/db/types';
import { hashPassword } from '@/lib/auth/password';

/**
 * GET /api/admin/users
 * List all users with optional role filter
 */
export async function GET(request: NextRequest) {
  try {
    await requireAuthWithRole(request, ['ADMIN']);

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const search = searchParams.get('search');

    let sql = `
      SELECT user_id, username, email, first_name, last_name, role, created_at
      FROM users
      WHERE 1=1
    `;
    const params: string[] = [];

    if (role && ['ADMIN', 'ADVISOR', 'STUDENT'].includes(role)) {
      sql += ' AND role = ?';
      params.push(role);
    }

    if (search) {
      sql += ' AND (username LIKE ? OR email LIKE ? OR first_name LIKE ? OR last_name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY role, last_name, first_name';

    const [users] = await query<UserRowPublic>(sql, params);

    return NextResponse.json({ users });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/users
 * Create a new user
 */
export async function POST(request: NextRequest) {
  try {
    await requireAuthWithRole(request, ['ADMIN']);

    const body = await request.json();
    const { username, email, password, first_name, last_name, role } = body;

    // Validation
    if (!username || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: username, email, password, role' },
        { status: 400 }
      );
    }

    if (!['ADMIN', 'ADVISOR', 'STUDENT'].includes(role)) {
      return NextResponse.json(
        { error: 'role must be ADMIN, ADVISOR, or STUDENT' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Check for duplicate username or email
    const [existing] = await query<UserRow>(
      'SELECT user_id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Username or email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const password_hash = await hashPassword(password);

    const result = await execute(
      `INSERT INTO users (username, email, password_hash, first_name, last_name, role)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [username, email, password_hash, first_name || null, last_name || null, role]
    );

    return NextResponse.json({
      message: 'User created successfully',
      user_id: result.insertId,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
