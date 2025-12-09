import crypto from 'crypto';
import { query, execute } from '@/lib/db/query';
import type { RefreshTokenRow } from '@/lib/db/types';
import { getTokenExpiry } from './jwt';

/**
 * Hash a token using SHA-256
 * Store hashed tokens in DB for defense in depth
 *
 * @param token Plain token string
 * @returns Hex-encoded hash
 */
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Store a refresh token in the database
 *
 * @param token Refresh token (UUID)
 * @param userId User ID who owns this token
 * @param ipAddress Client IP address (optional, for auditing)
 * @param userAgent Client user agent (optional, for auditing)
 */
export async function storeRefreshToken(
  token: string,
  userId: number,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  const tokenHash = hashToken(token);
  const expirySeconds = getTokenExpiry('refresh');
  const expiresAt = new Date(Date.now() + expirySeconds * 1000);

  await execute(
    `INSERT INTO refresh_tokens
     (user_id, token_hash, expires_at, ip_address, user_agent)
     VALUES (?, ?, ?, ?, ?)`,
    [userId, tokenHash, expiresAt, ipAddress || null, userAgent || null]
  );
}

/**
 * Validate a refresh token and return associated user ID
 *
 * @param token Refresh token to validate
 * @returns User ID if valid, null otherwise
 */
export async function validateRefreshToken(token: string): Promise<{ user_id: number } | null> {
  const tokenHash = hashToken(token);

  const [rows] = await query<RefreshTokenRow>(
    `SELECT user_id, expires_at, revoked
     FROM refresh_tokens
     WHERE token_hash = ?`,
    [tokenHash]
  );

  if (rows.length === 0) {
    return null;
  }

  const tokenData = rows[0];

  // Check if token is revoked
  if (tokenData.revoked) {
    return null;
  }

  // Check if token is expired
  if (new Date(tokenData.expires_at) < new Date()) {
    return null;
  }

  return { user_id: tokenData.user_id };
}

/**
 * Revoke a specific refresh token
 *
 * @param token Refresh token to revoke
 */
export async function revokeRefreshToken(token: string): Promise<void> {
  const tokenHash = hashToken(token);

  await execute(
    `UPDATE refresh_tokens
     SET revoked = TRUE, revoked_at = NOW()
     WHERE token_hash = ?`,
    [tokenHash]
  );
}

/**
 * Revoke all refresh tokens for a user
 * Used for forced logout / security breach response
 *
 * @param userId User ID whose tokens should be revoked
 */
export async function revokeAllUserTokens(userId: number): Promise<void> {
  await execute(
    `UPDATE refresh_tokens
     SET revoked = TRUE, revoked_at = NOW()
     WHERE user_id = ? AND revoked = FALSE`,
    [userId]
  );
}

/**
 * Check if a token has been revoked
 * Used for detecting token reuse attacks
 *
 * @param token Refresh token to check
 * @returns True if token exists and is revoked
 */
export async function isTokenRevoked(token: string): Promise<boolean> {
  const tokenHash = hashToken(token);

  const [rows] = await query<RefreshTokenRow>(
    `SELECT revoked FROM refresh_tokens WHERE token_hash = ?`,
    [tokenHash]
  );

  return rows.length > 0 && rows[0].revoked;
}

/**
 * Clean up expired tokens
 * Should be run periodically (e.g., daily cron job)
 *
 * @returns Number of tokens deleted
 */
export async function cleanupExpiredTokens(): Promise<number> {
  const result = await execute(
    `DELETE FROM refresh_tokens
     WHERE expires_at < NOW()
        OR (revoked = TRUE AND revoked_at < DATE_SUB(NOW(), INTERVAL 30 DAY))`
  );

  return result.affectedRows;
}
