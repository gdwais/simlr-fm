/**
 * POST /api/auth/logout
 * Logout and delete refresh token
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/services/auth.service';
import { getCurrentUser } from '@/lib/middleware/auth';

export async function POST(req: NextRequest) {
  try {
    const auth = getCurrentUser(req);

    if (!auth) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get refresh token from cookie
    const refreshToken = req.cookies.get('refresh_token')?.value;

    if (refreshToken) {
      // Delete refresh token from database
      const authService = new AuthService(prisma);
      await authService.logout(auth.userId, refreshToken);
    }

    // Clear cookies
    const response = NextResponse.json({ message: 'Logged out successfully' });

    response.cookies.set('access_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    response.cookies.set('refresh_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
