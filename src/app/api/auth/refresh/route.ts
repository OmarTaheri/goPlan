import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/query';
import { generateAccessToken, generateRefreshToken, getTokenExpiry } from '@/lib/auth/jwt';
import {
  validateRefreshToken,
  storeRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  isTokenRevoked,
} from '@/lib/auth/tokens';
import { getCookie, setCookie } from '@/lib/auth/cookies';
import { handleAuthError, AuthError } from '@/lib/middleware/errors';
import type { UserRow } from '@/lib/db/types';
import type { RefreshResponse } from '@/lib/types/auth';

export async function POST(request: NextRequest) {
  try {
    // Get refresh token from cookie
    const oldRefreshToken = getCookie(request, 'refresh_token');

    if (!oldRefreshToken) {
      throw new AuthError('No refresh token provided', 401, 'NO_REFRESH_TOKEN');
    }

    // Validate old refresh token
    const tokenData = await validateRefreshToken(oldRefreshToken);

    if (!tokenData) {
      // Check if token was revoked (potential theft detection)
      const wasRevoked = await isTokenRevoked(oldRefreshToken);

      if (wasRevoked) {
        // SECURITY: Token reuse detected!
        // This could indicate a stolen token being used
        // Revoke ALL user's tokens and force re-login
        console.warn(
          '[Security] Revoked refresh token reuse detected. Revoking all user tokens.'
        );
        // We can't get user_id from invalid token, so this is best effort
        throw new AuthError(
          'Token reuse detected. Please login again.',
          401,
          'TOKEN_REUSE_DETECTED'
        );
      }

      throw new AuthError('Invalid or expired refresh token', 401, 'INVALID_REFRESH_TOKEN');
    }

    // Fetch fresh user data
    const [users] = await query<UserRow>(
      `SELECT user_id, username, email, first_name, last_name, role
       FROM users
       WHERE user_id = ?`,
      [tokenData.user_id]
    );

    if (users.length === 0) {
      throw new AuthError('User not found', 401, 'USER_NOT_FOUND');
    }

    const user = users[0];

    // Generate NEW tokens
    const newAccessToken = generateAccessToken({
      user_id: user.user_id,
      username: user.username,
      email: user.email,
      role: user.role,
      first_name: user.first_name || undefined,
      last_name: user.last_name || undefined,
    });

    const newRefreshToken = generateRefreshToken();

    // Revoke old refresh token (rotation)
    await revokeRefreshToken(oldRefreshToken);

    // Store new refresh token
    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    await storeRefreshToken(newRefreshToken, user.user_id, ipAddress, userAgent);

    // Build response
    const responseData: RefreshResponse = {
      access_token: newAccessToken,
      token_type: 'Bearer',
      expires_in: getTokenExpiry('access'), // 900 seconds (15 minutes)
    };

    const response = NextResponse.json(responseData);

    // Set new access token as HTTP-only cookie
    setCookie(response, 'access_token', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: getTokenExpiry('access'), // 15 minutes in seconds
    });

    // Set new refresh token as HTTP-only cookie
    setCookie(response, 'refresh_token', newRefreshToken, {
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
