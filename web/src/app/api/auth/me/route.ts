/**
 * GET /api/auth/me
 * Get current authenticated user
 *
 * PATCH /api/auth/me
 * Update current user profile
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/middleware/auth';
import { UserRepository } from '@/lib/repositories/user.repository';

const updateProfileSchema = z.object({
  username: z.string().min(3).max(20).optional(),
  displayName: z.string().min(1).max(50).optional(),
  avatarUrl: z.string().url().optional(),
});

export async function GET(req: NextRequest) {
  return withAuth(req, async (req, auth) => {
    try {
      const userRepo = new UserRepository(prisma);
      const user = await userRepo.findById(auth.userId);

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          createdAt: user.createdAt,
        },
      });
    } catch {
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  });
}

export async function PATCH(req: NextRequest) {
  return withAuth(req, async (req, auth) => {
    try {
      const body = await req.json();

      // Validate input
      const validation = updateProfileSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid input', details: validation.error.issues },
          { status: 400 }
        );
      }

      const userRepo = new UserRepository(prisma);

      // Check if username is taken (if changing username)
      if (validation.data.username) {
        const existingUser = await userRepo.findByUsername(
          validation.data.username
        );
        if (existingUser && existingUser.id !== auth.userId) {
          return NextResponse.json(
            { error: 'Username already taken' },
            { status: 400 }
          );
        }
      }

      // Update user
      const updatedUser = await userRepo.update(auth.userId, validation.data);

      return NextResponse.json({
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          username: updatedUser.username,
          displayName: updatedUser.displayName,
          avatarUrl: updatedUser.avatarUrl,
        },
      });
    } catch {
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  });
}
