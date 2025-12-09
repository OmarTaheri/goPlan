import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithRole } from '@/lib/auth/rbac';
import { query, execute } from '@/lib/db/query';
import { UserRow, UserRowPublic, StudentProfileRow, CountResult } from '@/lib/db/types';
import { hashPassword } from '@/lib/auth/password';

interface Params {
  params: Promise<{ id: string }>;
}

interface UserWithProfile extends UserRowPublic {
  profile?: {
    profile_id: number;
    major_program_id: number | null;
    major_name: string | null;
    minor_program_id: number | null;
    minor_name: string | null;
    concentration_program_id: number | null;
    concentration_name: string | null;
    advisor_id: number | null;
    advisor_name: string | null;
    enrollment_year: number | null;
  };
  caseload_count?: number;
}

/**
 * GET /api/admin/users/[id]
 * Get a single user with profile info
 */
export async function GET(request: NextRequest, { params }: Params) {
  try {
    await requireAuthWithRole(request, ['ADMIN']);
    const { id } = await params;
    const userId = parseInt(id, 10);

    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    // Get user without password
    const [users] = await query<UserRowPublic>(
      `SELECT user_id, username, email, first_name, last_name, role, created_at
       FROM users WHERE user_id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user: UserWithProfile = users[0];

    // If student, get profile
    if (user.role === 'STUDENT') {
    const [profiles] = await query<StudentProfileRow & {
      major_program_id: number | null;
      major_name: string | null;
      minor_program_id: number | null;
      minor_name: string | null;
      concentration_program_id: number | null;
      concentration_name: string | null;
      advisor_first_name: string | null;
      advisor_last_name: string | null;
    }>(
      `SELECT sp.*,
              prog.major_program_id,
              prog.major_name,
              prog.minor_program_id,
              prog.minor_name,
              prog.concentration_program_id,
              prog.concentration_name,
              u.first_name as advisor_first_name,
              u.last_name as advisor_last_name
       FROM student_profiles sp
       LEFT JOIN (
         SELECT
           sp.student_id,
           MAX(CASE WHEN sp.type = 'MAJOR' AND sp.is_primary = 1 THEN sp.program_id END) AS major_program_id,
           MAX(CASE WHEN sp.type = 'MAJOR' AND sp.is_primary = 1 THEN p.name END) AS major_name,
           MAX(CASE WHEN sp.type = 'MINOR' THEN sp.program_id END) AS minor_program_id,
           MAX(CASE WHEN sp.type = 'MINOR' THEN p.name END) AS minor_name,
           MAX(CASE WHEN sp.type = 'CONCENTRATION' THEN sp.program_id END) AS concentration_program_id,
           MAX(CASE WHEN sp.type = 'CONCENTRATION' THEN p.name END) AS concentration_name
         FROM student_programs sp
         JOIN programs p ON sp.program_id = p.program_id
         GROUP BY sp.student_id
       ) prog ON prog.student_id = sp.user_id
       LEFT JOIN users u ON sp.advisor_id = u.user_id
       WHERE sp.user_id = ?`,
      [userId]
    );

      if (profiles.length > 0) {
        const p = profiles[0];
        user.profile = {
          profile_id: p.profile_id,
          major_program_id: p.major_program_id,
          major_name: p.major_name,
          minor_program_id: p.minor_program_id,
          minor_name: p.minor_name,
          concentration_program_id: p.concentration_program_id,
          concentration_name: p.concentration_name,
          advisor_id: p.advisor_id,
          advisor_name: p.advisor_first_name && p.advisor_last_name
            ? `${p.advisor_first_name} ${p.advisor_last_name}`
            : null,
          enrollment_year: p.enrollment_year,
        };
      }
    }

    // If advisor, get caseload count
    if (user.role === 'ADVISOR') {
      const [counts] = await query<CountResult>(
        'SELECT COUNT(*) as count FROM student_profiles WHERE advisor_id = ?',
        [userId]
      );
      user.caseload_count = counts[0].count;
    }

    return NextResponse.json({ user });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/admin/users/[id]
 * Update a user (including profile for students)
 */
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    await requireAuthWithRole(request, ['ADMIN']);
    const { id } = await params;
    const userId = parseInt(id, 10);

    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const body = await request.json();
    const {
      username,
      email,
      password,
      first_name,
      last_name,
      role,
      // Student profile fields
      major_program_id,
      minor_program_id,
      concentration_program_id,
      advisor_id,
      enrollment_year,
    } = body;

    // Check user exists
    const [users] = await query<UserRow>(
      'SELECT * FROM users WHERE user_id = ?',
      [userId]
    );

    if (users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Build user update query
    const updates: string[] = [];
    const values: (string | number | null)[] = [];

    if (username !== undefined) {
      // Check for duplicate
      const [dup] = await query<UserRow>(
        'SELECT user_id FROM users WHERE username = ? AND user_id != ?',
        [username, userId]
      );
      if (dup.length > 0) {
        return NextResponse.json({ error: 'Username already exists' }, { status: 409 });
      }
      updates.push('username = ?');
      values.push(username);
    }

    if (email !== undefined) {
      // Check for duplicate
      const [dup] = await query<UserRow>(
        'SELECT user_id FROM users WHERE email = ? AND user_id != ?',
        [email, userId]
      );
      if (dup.length > 0) {
        return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
      }
      updates.push('email = ?');
      values.push(email);
    }

    if (password !== undefined) {
      if (password.length < 8) {
        return NextResponse.json(
          { error: 'Password must be at least 8 characters' },
          { status: 400 }
        );
      }
      const hash = await hashPassword(password);
      updates.push('password_hash = ?');
      values.push(hash);
    }

    if (first_name !== undefined) {
      updates.push('first_name = ?');
      values.push(first_name);
    }

    if (last_name !== undefined) {
      updates.push('last_name = ?');
      values.push(last_name);
    }

    if (role !== undefined) {
      if (!['ADMIN', 'ADVISOR', 'STUDENT'].includes(role)) {
        return NextResponse.json(
          { error: 'role must be ADMIN, ADVISOR, or STUDENT' },
          { status: 400 }
        );
      }
      updates.push('role = ?');
      values.push(role);
    }

    // Update user if there are changes
    if (updates.length > 0) {
      values.push(userId);
      await execute(
        `UPDATE users SET ${updates.join(', ')} WHERE user_id = ?`,
        values
      );
    }

    // Handle student profile updates
    const currentRole = role ?? users[0].role;
    if (currentRole === 'STUDENT') {
      // Check if profile exists
      const [profiles] = await query<StudentProfileRow>(
        'SELECT * FROM student_profiles WHERE user_id = ?',
        [userId]
      );

      const profileUpdates: string[] = [];
      const profileValues: (number | null)[] = [];

      if (advisor_id !== undefined) {
        // Verify advisor exists and is an advisor
        if (advisor_id !== null) {
          const [advisors] = await query<UserRow>(
            'SELECT * FROM users WHERE user_id = ? AND role = ?',
            [advisor_id, 'ADVISOR']
          );
          if (advisors.length === 0) {
            return NextResponse.json(
              { error: 'Advisor not found or user is not an advisor' },
              { status: 400 }
            );
          }
        }
        profileUpdates.push('advisor_id = ?');
        profileValues.push(advisor_id);
      }
      if (enrollment_year !== undefined) {
        profileUpdates.push('enrollment_year = ?');
        profileValues.push(enrollment_year);
      }

      if (profileUpdates.length > 0 || profiles.length === 0) {
        if (profiles.length === 0) {
          // Create profile
          await execute(
            `INSERT INTO student_profiles (user_id, advisor_id, enrollment_year)
             VALUES (?, ?, ?)`,
            [
              userId,
              advisor_id ?? null,
              enrollment_year ?? null,
            ]
          );
        } else if (profileUpdates.length > 0) {
          // Update profile
          profileValues.push(userId);
          await execute(
            `UPDATE student_profiles SET ${profileUpdates.join(', ')} WHERE user_id = ?`,
            profileValues
          );
        }
      }

      // Update program assignments via student_programs
      if (major_program_id !== undefined) {
        await execute(
          'DELETE FROM student_programs WHERE student_id = ? AND type = ?',
          [userId, 'MAJOR']
        );
        if (major_program_id !== null) {
          await execute(
            `INSERT INTO student_programs (student_id, program_id, type, is_primary)
             VALUES (?, ?, 'MAJOR', 1)`,
            [userId, major_program_id]
          );
        }
      }

      if (minor_program_id !== undefined) {
        await execute(
          'DELETE FROM student_programs WHERE student_id = ? AND type = ?',
          [userId, 'MINOR']
        );
        if (minor_program_id !== null) {
          await execute(
            `INSERT INTO student_programs (student_id, program_id, type, is_primary)
             VALUES (?, ?, 'MINOR', 1)`,
            [userId, minor_program_id]
          );
        }
      }

      if (concentration_program_id !== undefined) {
        await execute(
          'DELETE FROM student_programs WHERE student_id = ? AND type = ?',
          [userId, 'CONCENTRATION']
        );
        if (concentration_program_id !== null) {
          await execute(
            `INSERT INTO student_programs (student_id, program_id, type, is_primary)
             VALUES (?, ?, 'CONCENTRATION', 1)`,
            [userId, concentration_program_id]
          );
        }
      }
    }

    return NextResponse.json({ message: 'User updated successfully' });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/users/[id]
 * Delete a user
 */
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const admin = await requireAuthWithRole(request, ['ADMIN']);
    const { id } = await params;
    const userId = parseInt(id, 10);

    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    // Prevent self-deletion
    if (admin.user_id === userId) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Check user exists
    const [users] = await query<UserRow>(
      'SELECT * FROM users WHERE user_id = ?',
      [userId]
    );

    if (users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete user (cascade will handle related records)
    await execute('DELETE FROM users WHERE user_id = ?', [userId]);

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
