import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/rbac';
import { handleAuthError, errorResponse } from '@/lib/middleware/errors';
import type { MeResponse } from '@/lib/types/auth';

export async function GET(request: NextRequest) {
  try {
    // Extract and verify user from JWT
    const user = await requireAuth(request);

    if (!user) {
      return errorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    }

    const responseData: MeResponse = {
      user,
    };

    return NextResponse.json(responseData);
  } catch (error) {
    return handleAuthError(error);
  }
}
