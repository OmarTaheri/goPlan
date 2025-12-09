import { NextResponse } from 'next/server';
import { serialize, parse, SerializeOptions } from 'cookie';

/**
 * Default cookie configuration
 * Security best practices for authentication cookies
 */
const DEFAULT_COOKIE_OPTIONS: SerializeOptions = {
  httpOnly: true, // Prevents JavaScript access (XSS protection)
  secure: process.env.NODE_ENV === 'production', // HTTPS only in production
  sameSite: 'lax', // CSRF protection, allows top-level navigation
  path: '/',
  maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
};

/**
 * Set a cookie on a NextResponse object
 *
 * @param response NextResponse object to modify
 * @param name Cookie name
 * @param value Cookie value
 * @param options Optional cookie configuration (overrides defaults)
 */
export function setCookie(
  response: NextResponse,
  name: string,
  value: string,
  options: Partial<SerializeOptions> = {}
): void {
  const cookieOptions = { ...DEFAULT_COOKIE_OPTIONS, ...options };
  const serialized = serialize(name, value, cookieOptions);
  response.headers.append('Set-Cookie', serialized);
}

/**
 * Clear a cookie by setting it to expire immediately
 *
 * @param response NextResponse object to modify
 * @param name Cookie name to clear
 */
export function clearCookie(response: NextResponse, name: string): void {
  const serialized = serialize(name, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0, // Expire immediately
  });
  response.headers.append('Set-Cookie', serialized);
}

/**
 * Parse cookies from a request header string
 *
 * @param cookieHeader Cookie header string
 * @returns Object with cookie key-value pairs
 */
export function parseCookies(cookieHeader: string | null): Record<string, string | undefined> {
  if (!cookieHeader) {
    return {};
  }
  return parse(cookieHeader);
}

/**
 * Get a specific cookie value from a request
 *
 * @param request Request object
 * @param name Cookie name
 * @returns Cookie value or null if not found
 */
export function getCookie(request: Request, name: string): string | null {
  const cookieHeader = request.headers.get('cookie');
  const cookies = parseCookies(cookieHeader);
  return cookies[name] || null;
}
