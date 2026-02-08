import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/server-auth";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { createAlbumService } from "@/lib/services/album.service";

const CreateSchema = z.object({
  sourceAlbumId: z.string().min(1), // Accepts both MBID and Spotify ID
  targetAlbumId: z.string().min(1), // Accepts both MBID and Spotify ID
  reason: z.string().min(140).max(280),
});

export async function POST(req: Request) {
  const userId = await getCurrentUserId();
  // userId already fetched
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = CreateSchema.parse(await req.json());
  if (body.sourceAlbumId === body.targetAlbumId) {
    return NextResponse.json(
      { error: "Source and target must be different albums" },
      { status: 400 },
    );
  }

  // Resolve album IDs (supports both MBID and Spotify ID)
  const albumService = createAlbumService(prisma);
  const [sourceId, targetId] = await Promise.all([
    albumService.resolveAlbumId(body.sourceAlbumId),
    albumService.resolveAlbumId(body.targetAlbumId),
  ]);

  if (!sourceId || !targetId) {
    return NextResponse.json(
      { error: "Album not found. Upsert both albums first." },
      { status: 400 },
    );
  }

  // Require user has rated the source album (anti-spam gating)
  const userRating = await prisma.rating.findUnique({
    where: { userId_albumId: { userId: userId, albumId: sourceId } },
    select: { id: true },
  });

  if (!userRating) {
    return NextResponse.json(
      { error: "You must rate the source album before adding Simlrs." },
      { status: 403 },
    );
  }

  const edge = await prisma.$transaction(async (tx) => {
    const e = await tx.simlrEdge.upsert({
      where: {
        sourceAlbumId_targetAlbumId: {
          sourceAlbumId: sourceId,
          targetAlbumId: targetId,
        },
      },
      create: {
        sourceAlbumId: sourceId,
        targetAlbumId: targetId,
      },
      update: {},
      select: { id: true },
    });

    await tx.simlrReason.upsert({
      where: { edgeId_userId: { edgeId: e.id, userId: userId } },
      create: { edgeId: e.id, userId: userId, reason: body.reason },
      update: { reason: body.reason },
      select: { id: true },
    });

    return e;
  });

  return NextResponse.json({ edge });
}
