/**
 * POST /api/albums/[id]/upsert
 * Upsert an album by MBID (fetch from MusicBrainz if not in database)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createAlbumService } from '@/lib/services/album.service';

const MBID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // Validate MBID format
    if (!MBID_REGEX.test(id)) {
      return NextResponse.json(
        { error: 'Invalid MBID format. Only MBID upsert is supported.' },
        { status: 400 }
      );
    }

    // Upsert album
    const albumService = createAlbumService(prisma);
    const album = await albumService.upsertByMbid(id);

    if (!album) {
      return NextResponse.json(
        { error: 'Album not found in MusicBrainz' },
        { status: 404 }
      );
    }

    return NextResponse.json({ album });
  } catch (error) {
    console.error('Album upsert error:', error);
    return NextResponse.json(
      { error: 'Failed to upsert album' },
      { status: 500 }
    );
  }
}
