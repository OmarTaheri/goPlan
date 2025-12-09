import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/query';
import { generateAccessToken, generateRefreshToken, getTokenExpiry } from '@/lib/auth/jwt';
import {
  validateRefreshToken,
  storeRefreshToken,
  revokeRefreshToken,
  isTokenRevoked,
} from '@/lib/auth/tokens';
import { getCookie, setCookie, clearCookie } from '@/lib/auth/cookies';
import type { UserRow } from '@/lib/db/types';

export async function GET(request: NextRequest) {
    try {
        const oldRefreshToken = getCookie(request, 'refresh_token');

        if (!oldRefreshToken) {
            // No refresh token, redirect to login (shouldn't happen if middleware did its job, but safe fallback)
            return NextResponse.redirect(new URL('/login', request.url));
        }

        // Validate old refresh token
        const tokenData = await validateRefreshToken(oldRefreshToken);

        if (!tokenData) {
            // Token invalid or revoked - clear cookies and force login
            const response = NextResponse.redirect(new URL('/login', request.url));
            clearCookie(response, 'access_token');
            clearCookie(response, 'refresh_token');
            
            // Check for revocation for security logging (optional)
            const wasRevoked = await isTokenRevoked(oldRefreshToken);
            if (wasRevoked) {
               console.warn('[Security] Handoff attempted with revoked token');
            }
            
            return response;
        }

        // Fetch user
        const [users] = await query<UserRow>(
            `SELECT user_id, username, email, first_name, last_name, role
             FROM users
             WHERE user_id = ?`,
            [tokenData.user_id]
        );

        if (users.length === 0) {
            const response = NextResponse.redirect(new URL('/login', request.url));
            clearCookie(response, 'access_token');
            clearCookie(response, 'refresh_token');
            return response;
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

        // Rotate refresh token
        await revokeRefreshToken(oldRefreshToken);

        // Store new refresh token
        const ipAddress =
            request.headers.get('x-forwarded-for')?.split(',')[0] ||
            request.headers.get('x-real-ip') ||
            'unknown';
        const userAgent = request.headers.get('user-agent') || 'unknown';

        await storeRefreshToken(newRefreshToken, user.user_id, ipAddress, userAgent);

        // Determine redirect path
        const dashboardMap: Record<string, string> = {
            ADMIN: '/dashboard/admin',
            STUDENT: '/dashboard/student',
            ADVISOR: '/dashboard/advisor',
        };
        const redirectPath = dashboardMap[user.role] || '/dashboard/default';

        const response = NextResponse.redirect(new URL(redirectPath, request.url));

        // Set cookies on the redirect response
        setCookie(response, 'access_token', newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: getTokenExpiry('access'),
        });

        setCookie(response, 'refresh_token', newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: getTokenExpiry('refresh'),
        });

        return response;

    } catch (error) {
        console.error('Handoff error:', error);
        // Fallback to login on error
        return NextResponse.redirect(new URL('/login', request.url));
    }
}
