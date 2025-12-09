import { NextRequest, NextResponse } from 'next/server';
import { revokeRefreshToken } from '@/lib/auth/tokens';
import { getCookie, clearCookie } from '@/lib/auth/cookies';
import { handleAuthError } from '@/lib/middleware/errors';

export async function POST(request: NextRequest) {
  try {
    // Get refresh token from cookie
    const refreshToken = getCookie(request, 'refresh_token');

    if (refreshToken) {
      // Revoke the refresh token in database
      await revokeRefreshToken(refreshToken);
    }

    // Build response
    const response = NextResponse.json({
      message: 'Logged out successfully',
    });

    // Clear the refresh token cookie
    clearCookie(response, 'refresh_token');
    clearCookie(response, 'access_token');

    return response;
  } catch (error) {
    return handleAuthError(error);
  }
}
