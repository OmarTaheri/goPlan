import bcrypt from 'bcryptjs';

/**
 * Number of bcrypt rounds (OWASP 2024 recommendation)
 * 10 rounds = ~100ms on modern hardware
 * Balance between security and UX
 */
const SALT_ROUNDS = 10;

/**
 * Hash a plaintext password using bcrypt
 *
 * @param password Plaintext password
 * @returns Bcrypt hash string
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a plaintext password against a bcrypt hash
 * Uses constant-time comparison to prevent timing attacks
 *
 * @param password Plaintext password to verify
 * @param hash Bcrypt hash to compare against
 * @returns True if password matches, false otherwise
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Check if a hash needs to be upgraded (algorithm change)
 * Useful when increasing SALT_ROUNDS in the future
 *
 * @param hash Bcrypt hash to check
 * @returns True if hash should be regenerated
 */
export function needsRehash(hash: string): boolean {
  try {
    const rounds = bcrypt.getRounds(hash);
    return rounds < SALT_ROUNDS;
  } catch (error) {
    // Invalid hash format
    return true;
  }
}
