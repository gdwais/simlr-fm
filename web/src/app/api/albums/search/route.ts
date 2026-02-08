/**
 * GET /api/albums/search
 * Search for albums using MusicBrainz
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createAlbumService } from '@/lib/services/album.service';

const searchSchema = z.object({
  q: z.string().min(1),
  limit: z.string().nullable().transform((val) => {
    if (!val) return 12;
    const num = parseInt(val, 10);
    return isNaN(num) ? 12 : Math.min(Math.max(num, 1), 50);
  }),
});

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;

    // Validate query parameters
    const validation = searchSchema.safeParse({
      q: searchParams.get('q'),
      limit: searchParams.get('limit'),
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { q, limit } = validation.data;

    // Search albums
    const albumService = createAlbumService(prisma);
    const results = await albumService.search(q, limit);

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Album search error:', error);
    return NextResponse.json(
      { error: 'Failed to search albums' },
      { status: 500 }
    );
  }
}
