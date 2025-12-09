import { verifyAccessToken } from './jwt';
import { query } from '@/lib/db/query';
import { AuthError, AuthorizationError } from '@/lib/middleware/errors';
import type { User, Role } from '@/lib/types/auth';
import type { RowDataPacket } from 'mysql2/promise';

interface AssignmentRow extends RowDataPacket {
  count: number;
}

/**
 * Extract and verify JWT from request
 * Checks both Authorization header (Bearer token) and cookies
 *
 * @param request Request object
 * @returns User object if authenticated, null otherwise
 */
export async function requireAuth(request: Request): Promise<User | null> {
  let token: string | null = null;

  // Try Authorization header first (Bearer token)
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  // Fallback to cookie (for SSR pages)
  if (!token) {
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      const cookies = Object.fromEntries(
        cookieHeader.split('; ').map((c) => {
          const [key, ...v] = c.split('=');
          return [key, v.join('=')];
        })
      );
      token = cookies['access_token'] || null;
    }
  }

  if (!token) {
    return null;
  }

  try {
    const payload = verifyAccessToken(token);

    // Return user object (sanitized, no password)
    return {
      user_id: payload.user_id,
      username: payload.username,
      email: payload.email,
      role: payload.role,
      first_name: payload.first_name,
      last_name: payload.last_name,
    };
  } catch (error) {
    // Token is invalid or expired
    return null;
  }
}

/**
 * Verify user has one of the required roles
 * Throws AuthorizationError if role check fails
 *
 * @param user User object
 * @param allowedRoles Array of allowed roles
 * @throws AuthorizationError if user doesn't have required role
 */
export function requireRole(user: User, allowedRoles: Role[]): void {
  if (!allowedRoles.includes(user.role)) {
    throw new AuthorizationError(
      `Access denied. Required role: ${allowedRoles.join(' or ')}`
    );
  }
}

/**
 * Verify student can only access their own data
 * Critical security check: students must not access other students' data
 *
 * @param user User object
 * @param studentId Student ID being accessed
 * @throws AuthorizationError if studentId doesn't match user
 */
export function requireStudentSelf(user: User, studentId: number): void {
  if (user.user_id !== studentId) {
    throw new AuthorizationError('Students can only access their own data');
  }
}

/**
 * Verify advisor is assigned to the student
 * Performs DB query against student_profiles.advisor_id
 * Uses idx_advisor_assignment index for O(log n) performance
 *
 * @param advisorId Advisor user ID
 * @param studentId Student user ID
 * @throws AuthorizationError if advisor is not assigned to student
 */
export async function requireAdvisorAssigned(
  advisorId: number,
  studentId: number
): Promise<void> {
  const [rows] = await query<AssignmentRow>(
    `SELECT COUNT(*) as count
     FROM student_profiles
     WHERE user_id = ? AND advisor_id = ?`,
    [studentId, advisorId]
  );

  if (rows[0].count === 0) {
    throw new AuthorizationError('Advisor is not assigned to this student');
  }
}

/**
 * Convenience wrapper: Require authentication + role check
 * Returns user if authorized, throws otherwise
 *
 * @param request Request object
 * @param allowedRoles Array of allowed roles
 * @returns User object
 * @throws AuthError if not authenticated
 * @throws AuthorizationError if role not allowed
 */
export async function requireAuthWithRole(
  request: Request,
  allowedRoles: Role[]
): Promise<User> {
  const user = await requireAuth(request);

  if (!user) {
    throw new AuthError('Authentication required', 401, 'UNAUTHORIZED');
  }

  requireRole(user, allowedRoles);

  return user;
}

/**
 * Check if user has permission to access student data
 * Applies appropriate checks based on user role:
 * - STUDENT: Can only access own data
 * - ADVISOR: Must be assigned to student
 * - ADMIN: Full access
 *
 * @param user User object
 * @param studentId Student ID being accessed
 * @throws AuthorizationError if access denied
 */
export async function requireStudentAccess(
  user: User,
  studentId: number
): Promise<void> {
  if (user.role === 'STUDENT') {
    requireStudentSelf(user, studentId);
  } else if (user.role === 'ADVISOR') {
    await requireAdvisorAssigned(user.user_id, studentId);
  }
  // ADMIN has full access, no check needed
}
