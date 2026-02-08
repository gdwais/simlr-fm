/**
 * GET /api/albums/[id]/stats
 * Get album statistics (ratings)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createAlbumService } from '@/lib/services/album.service';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // Resolve album ID (supports both MBID and Spotify ID)
    const albumService = createAlbumService(prisma);
    const albumId = await albumService.resolveAlbumId(id);

    if (!albumId) {
      return NextResponse.json(
        { error: 'Album not found' },
        { status: 404 }
      );
    }

    // Get stats from repository
    const albumRepo = albumService['albumRepo']; // Access private field for stats
    const stats = await albumRepo.getStats(albumId);

    return NextResponse.json({
      avg: stats.averageRating,
      median: stats.medianRating,
      count: stats.ratingCount,
      histogram: Array.from({ length: 10 }, (_, i) => stats.histogram[i + 1] || 0),
    });
  } catch (error) {
    console.error('Album stats error:', error);
    return NextResponse.json(
      { error: 'Failed to get album stats' },
      { status: 500 }
    );
  }
}
