import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/server-auth";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { median as medianFn, ratingHistogram } from "@/lib/stats";
import { createAlbumService } from "@/lib/services/album.service";

const BodySchema = z.object({
  albumId: z.string().min(1), // Accepts both MBID and Spotify ID
  score: z.number().int().min(1).max(10),
});

export async function POST(req: Request) {
  const userId = await getCurrentUserId();
  // userId already fetched
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = BodySchema.parse(await req.json());

  // Resolve album ID (supports both MBID and Spotify ID)
  const albumService = createAlbumService(prisma);
  const albumId = await albumService.resolveAlbumId(body.albumId);

  if (!albumId) {
    return NextResponse.json(
      { error: "Album not found (upsert it first)" },
      { status: 400 },
    );
  }

  const rating = await prisma.rating.upsert({
    where: {
      userId_albumId: { userId, albumId },
    },
    create: {
      userId,
      albumId,
      score: body.score,
    },
    update: {
      score: body.score,
    },
    select: { score: true, updatedAt: true },
  });

  const all = await prisma.rating.findMany({
    where: { albumId },
    select: { score: true },
  });
  const scores = all.map((r) => r.score);
  const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
  const med = medianFn(scores);
  const hist = ratingHistogram(scores);

  return NextResponse.json({
    rating,
    aggregate: {
      avg: avg ? Math.round(avg * 10) / 10 : null,
      median: med,
      count: scores.length,
      histogram: hist,
    },
  });
}
