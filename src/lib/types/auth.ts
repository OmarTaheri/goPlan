/**
 * User role types
 */
export type Role = 'ADMIN' | 'ADVISOR' | 'STUDENT';

/**
 * User object (sanitized, no password hash)
 */
export interface User {
  user_id: number;
  username: string;
  email: string;
  role: Role;
  first_name?: string;
  last_name?: string;
}

/**
 * JWT payload structure for access tokens
 */
export interface JWTPayload {
  user_id: number;
  username: string;
  email: string;
  role: Role;
  first_name?: string;
  last_name?: string;
  type: 'access';
  iss: string; // Issuer
  aud: string; // Audience
  iat?: number; // Issued at
  exp?: number; // Expiration
}

/**
 * Refresh token data structure
 */
export interface RefreshToken {
  token_id: number;
  user_id: number;
  token_hash: string;
  expires_at: Date;
  created_at: Date;
  revoked: boolean;
  revoked_at: Date | null;
  ip_address: string | null;
  user_agent: string | null;
}

/**
 * Login request body
 */
export interface LoginRequest {
  username: string;
  password: string;
}

/**
 * Login response
 */
export interface LoginResponse {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number; // Seconds
  user: User;
}

/**
 * Refresh token response
 */
export interface RefreshResponse {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number; // Seconds
}

/**
 * Current user response
 */
export interface MeResponse {
  user: User;
}
