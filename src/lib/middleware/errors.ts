import { NextResponse } from 'next/server';

/**
 * Base authentication error class
 */
export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: number = 401,
    public code: string = 'AUTH_ERROR'
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * Authorization error (403 Forbidden)
 * User is authenticated but doesn't have permission
 */
export class AuthorizationError extends AuthError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
    this.name = 'AuthorizationError';
  }
}

/**
 * Invalid credentials error (401 Unauthorized)
 * Generic message to prevent username enumeration
 */
export class InvalidCredentialsError extends AuthError {
  constructor(message: string = 'Invalid credentials') {
    super(message, 401, 'INVALID_CREDENTIALS');
    this.name = 'InvalidCredentialsError';
  }
}

/**
 * Token expired error (401 Unauthorized)
 * Client should refresh the token
 */
export class TokenExpiredError extends AuthError {
  constructor(message: string = 'Token expired') {
    super(message, 401, 'TOKEN_EXPIRED');
    this.name = 'TokenExpiredError';
  }
}

/**
 * Account locked error (401 Unauthorized)
 * Account has been disabled by admin
 */
export class AccountLockedError extends AuthError {
  constructor(message: string = 'Account locked') {
    super(message, 401, 'ACCOUNT_LOCKED');
    this.name = 'AccountLockedError';
  }
}

/**
 * Validation error (400 Bad Request)
 * Invalid input data
 */
export class ValidationError extends AuthError {
  constructor(message: string = 'Validation failed') {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

/**
 * Error response format
 */
interface ErrorResponse {
  error: string;
  code: string;
}

/**
 * Handle authentication errors and return appropriate NextResponse
 * Standardizes error responses across API routes
 *
 * @param error Error object (any type)
 * @returns NextResponse with error details
 */
export function handleAuthError(error: unknown): NextResponse<ErrorResponse> {
  // Handle known auth errors
  if (error instanceof AuthError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
      },
      { status: error.statusCode }
    );
  }

  // Handle generic errors without leaking details
  console.error('[Auth Error]', error);

  return NextResponse.json(
    {
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    },
    { status: 500 }
  );
}

/**
 * Create a standardized success response
 *
 * @param data Response data
 * @param status HTTP status code (default: 200)
 * @returns NextResponse with data
 */
export function successResponse<T>(data: T, status: number = 200): NextResponse<T> {
  return NextResponse.json(data, { status });
}

/**
 * Create a standardized error response
 *
 * @param message Error message
 * @param code Error code
 * @param status HTTP status code (default: 400)
 * @returns NextResponse with error
 */
export function errorResponse(
  message: string,
  code: string,
  status: number = 400
): NextResponse<ErrorResponse> {
  return NextResponse.json(
    {
      error: message,
      code,
    },
    { status }
  );
}
