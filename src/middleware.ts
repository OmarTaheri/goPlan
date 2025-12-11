import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { JWTPayload } from '@/lib/types/auth';

// Paths that trigger the redirect check
const AUTH_PATHS = ['/login'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only run on auth paths (e.g., /login)
  if (AUTH_PATHS.some((path) => pathname.startsWith(path))) {
    const accessToken = request.cookies.get('access_token')?.value;

    // Only redirect if we have a valid access token
    // If token is expired or missing, let user see login page
    if (accessToken) {
      try {
        const payload = parseJwt(accessToken);
        
        // Only redirect if token is valid and not expired
        if (payload && payload.exp && payload.exp * 1000 > Date.now()) {
          const role = payload.role;
          const redirectPath = getDashboardPath(role);
          return NextResponse.redirect(new URL(redirectPath, request.url));
        }
      } catch (e) {
        // Token invalid, let user see login page
      }
    }
    
    // No valid access token - let user see login page
    // Don't redirect to handoff - that causes issues
  }

  return NextResponse.next();
}

// Helper to decode JWT payload without verification (verification happens in API)
function parseJwt(token: string): JWTPayload | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

function getDashboardPath(role: string): string {
  switch (role) {
    case 'ADMIN':
      return '/dashboard/admin';
    case 'STUDENT':
      return '/dashboard/student';
    case 'ADVISOR':
      return '/dashboard/advisor';
    default:
      return '';
  }
}

export const config = {
  matcher: [
    // match all the files except for the ones starting with:
    // - api (API routes)
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
