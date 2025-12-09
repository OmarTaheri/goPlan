import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import type { User, JWTPayload } from '@/lib/types/auth';

// JWT Configuration from environment
const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const ACCESS_EXPIRY = (process.env.JWT_ACCESS_EXPIRY || '15m') as string;
const REFRESH_EXPIRY = (process.env.JWT_REFRESH_EXPIRY || '7d') as string;

// Validate secrets on module load
if (!ACCESS_SECRET || !REFRESH_SECRET) {
  throw new Error(
    'JWT secrets not configured. Please set JWT_ACCESS_SECRET and JWT_REFRESH_SECRET in .env.local'
  );
}

/**
 * Generate an access token (JWT) for a user
 *
 * @param user User object (without password)
 * @returns Signed JWT string
 */
export function generateAccessToken(user: User): string {
  const payload: JWTPayload = {
    user_id: user.user_id,
    username: user.username,
    email: user.email,
    role: user.role,
    first_name: user.first_name,
    last_name: user.last_name,
    type: 'access',
    iss: 'goplan',
    aud: 'goplan-app',
  };

  return jwt.sign(payload, ACCESS_SECRET, {
    expiresIn: ACCESS_EXPIRY,
  } as jwt.SignOptions);
}

/**
 * Verify and decode an access token
 *
 * @param token JWT string
 * @returns Decoded payload
 * @throws TokenExpiredError if token is expired
 * @throws AuthError if token is invalid
 */
export function verifyAccessToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, ACCESS_SECRET, {
      issuer: 'goplan',
      audience: 'goplan-app',
    }) as JWTPayload;

    if (decoded.type !== 'access') {
      throw new Error('Invalid token type');
    }

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      const expiredError = new Error('Token expired');
      expiredError.name = 'TokenExpiredError';
      throw expiredError;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      const authError = new Error('Invalid token');
      authError.name = 'AuthError';
      throw authError;
    }
    throw error;
  }
}

/**
 * Generate a refresh token (opaque UUID)
 * Refresh tokens are NOT JWTs - they're random UUIDs stored in the database
 * This allows for instant revocation (logout, security breach, etc.)
 *
 * @returns Random UUID string
 */
export function generateRefreshToken(): string {
  return crypto.randomUUID();
}

/**
 * Get token expiration time in seconds
 *
 * @param tokenType 'access' or 'refresh'
 * @returns Expiration time in seconds
 */
export function getTokenExpiry(tokenType: 'access' | 'refresh'): number {
  const expiry = tokenType === 'access' ? ACCESS_EXPIRY : REFRESH_EXPIRY;

  // Parse duration string (e.g., "15m", "7d")
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) {
    throw new Error(`Invalid token expiry format: ${expiry}`);
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  const multipliers = {
    s: 1,
    m: 60,
    h: 60 * 60,
    d: 60 * 60 * 24,
  };

  return value * multipliers[unit as keyof typeof multipliers];
}
