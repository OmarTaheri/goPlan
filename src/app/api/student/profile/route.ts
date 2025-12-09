import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithRole } from '@/lib/auth/rbac';
import { query } from '@/lib/db/query';
import { StudentProfileRow, UserRow, UserRowPublic } from '@/lib/db/types';

interface ProfileWithDetails extends StudentProfileRow {
  major_program_id: number | null;
  major_name: string | null;
  minor_program_id: number | null;
  minor_name: string | null;
  concentration_program_id: number | null;
  concentration_name: string | null;
  advisor_first_name: string | null;
  advisor_last_name: string | null;
  advisor_email: string | null;
}

/**
 * GET /api/student/profile
 * Get the current student's profile with program details
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuthWithRole(request, ['STUDENT']);

    // Get user info
    const [users] = await query<UserRowPublic>(
      `SELECT user_id, username, email, first_name, last_name, role, created_at
       FROM users WHERE user_id = ?`,
      [user.user_id]
    );

    if (users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get profile with program details
    const [profiles] = await query<ProfileWithDetails>(
      `SELECT sp.*,
              prog.major_program_id,
              prog.major_name,
              prog.minor_program_id,
              prog.minor_name,
              prog.concentration_program_id,
              prog.concentration_name,
              adv.first_name as advisor_first_name,
              adv.last_name as advisor_last_name,
              adv.email as advisor_email
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
       LEFT JOIN users adv ON sp.advisor_id = adv.user_id
       WHERE sp.user_id = ?`,
      [user.user_id]
    );

    const profile = profiles[0] || null;

    return NextResponse.json({
      user: users[0],
      profile: profile ? {
        profile_id: profile.profile_id,
        major: profile.major_program_id ? {
          program_id: profile.major_program_id,
          name: profile.major_name,
        } : null,
        minor: profile.minor_program_id ? {
          program_id: profile.minor_program_id,
          name: profile.minor_name,
        } : null,
        concentration: profile.concentration_program_id ? {
          program_id: profile.concentration_program_id,
          name: profile.concentration_name,
        } : null,
        advisor: profile.advisor_id ? {
          user_id: profile.advisor_id,
          name: `${profile.advisor_first_name} ${profile.advisor_last_name}`,
          email: profile.advisor_email,
        } : null,
        enrollment_year: profile.enrollment_year,
      } : null,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
