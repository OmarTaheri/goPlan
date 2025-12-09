import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/query';
import { verifyPassword } from '@/lib/auth/password';
import { generateAccessToken, generateRefreshToken, getTokenExpiry } from '@/lib/auth/jwt';
import { storeRefreshToken } from '@/lib/auth/tokens';
import { setCookie } from '@/lib/auth/cookies';
import {
  handleAuthError,
  InvalidCredentialsError,
  ValidationError,
} from '@/lib/middleware/errors';
import type { UserRow } from '@/lib/db/types';
import type { LoginResponse } from '@/lib/types/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    // Validate input
    if (!username || !password) {
      throw new ValidationError('Username and password are required');
    }

    // Fetch user by username or email
    const [users] = await query<UserRow>(
      `SELECT user_id, username, email, password_hash, first_name, last_name, role
       FROM users
       WHERE username = ? OR email = ?`,
      [username, username]
    );

    if (users.length === 0) {
      // Timing attack mitigation: Still hash a dummy password
      await verifyPassword(password, '$2a$10$dummy.hash.to.waste.time.and.prevent.timing.attacks');
      throw new InvalidCredentialsError();
    }

    const user = users[0];

    // Verify password
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      throw new InvalidCredentialsError();
    }

    // Generate access token (JWT, 15 minutes)
    const accessToken = generateAccessToken({
      user_id: user.user_id,
      username: user.username,
      email: user.email,
      role: user.role,
      first_name: user.first_name || undefined,
      last_name: user.last_name || undefined,
    });

    // Generate refresh token (UUID, 7 days)
    const refreshToken = generateRefreshToken();

    // Store refresh token in database
    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    await storeRefreshToken(refreshToken, user.user_id, ipAddress, userAgent);

    // Build response
    const responseData: LoginResponse = {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: getTokenExpiry('access'), // 900 seconds (15 minutes)
      user: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        role: user.role,
        first_name: user.first_name || undefined,
        last_name: user.last_name || undefined,
      },
    };

    const response = NextResponse.json(responseData);

    // Set access token as HTTP-only cookie (for SSR and API calls)
    setCookie(response, 'access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: getTokenExpiry('access'), // 15 minutes in seconds
    });

    // Set refresh token as HTTP-only cookie
    setCookie(response, 'refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: getTokenExpiry('refresh'), // 7 days in seconds
    });

    return response;
  } catch (error) {
    return handleAuthError(error);
  }
}
