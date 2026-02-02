import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { median as medianFn, ratingHistogram } from "@/lib/stats";

const BodySchema = z.object({
  spotifyAlbumId: z.string().min(1),
  score: z.number().int().min(1).max(10),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = BodySchema.parse(await req.json());

  const album = await prisma.album.findUnique({
    where: { spotifyAlbumId: body.spotifyAlbumId },
    select: { id: true },
  });

  if (!album) {
    return NextResponse.json(
      { error: "Album not found (upsert it first)" },
      { status: 400 },
    );
  }

  const rating = await prisma.rating.upsert({
    where: {
      userId_albumId: { userId, albumId: album.id },
    },
    create: {
      userId,
      albumId: album.id,
      score: body.score,
    },
    update: {
      score: body.score,
    },
    select: { score: true, updatedAt: true },
  });

  const all = await prisma.rating.findMany({
    where: { albumId: album.id },
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
