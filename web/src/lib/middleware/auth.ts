/**
 * Authentication middleware for Next.js API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '../utils/token';

export interface AuthContext {
  userId: string;
  email: string;
}

/**
 * Middleware to protect API routes with JWT authentication
 */
export async function withAuth(
  req: NextRequest,
  handler: (req: NextRequest, auth: AuthContext) => Promise<Response>
): Promise<Response> {
  // Get token from cookie
  const token = req.cookies.get('access_token')?.value;

  if (!token) {
    return NextResponse.json(
      { error: 'Unauthorized - No token provided' },
      { status: 401 }
    );
  }

  // Verify token
  const payload = verifyAccessToken(token);

  if (!payload) {
    return NextResponse.json(
      { error: 'Unauthorized - Invalid token' },
      { status: 401 }
    );
  }

  // Call handler with auth context
  return handler(req, {
    userId: payload.userId,
    email: payload.email,
  });
}

/**
 * Get current user from JWT token (optional - returns null if not authenticated)
 */
export function getCurrentUser(req: NextRequest): AuthContext | null {
  const token = req.cookies.get('access_token')?.value;

  if (!token) {
    return null;
  }

  const payload = verifyAccessToken(token);

  if (!payload) {
    return null;
  }

  return {
    userId: payload.userId,
    email: payload.email,
  };
}

/**
 * Require authentication - throws if not authenticated
 */
export function requireAuth(req: NextRequest): AuthContext {
  const auth = getCurrentUser(req);

  if (!auth) {
    throw new Error('Unauthorized');
  }

  return auth;
}
