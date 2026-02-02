import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { median as medianFn, ratingHistogram } from "@/lib/stats";

const ParamsSchema = z.object({ spotifyAlbumId: z.string().min(1) });

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ spotifyAlbumId: string }> },
) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  const { spotifyAlbumId } = ParamsSchema.parse(await ctx.params);

  const album = await prisma.album.findUnique({
    where: { spotifyAlbumId },
    select: { id: true },
  });

  if (!album) {
    return NextResponse.json(
      { error: "Album not found (upsert it first)" },
      { status: 404 },
    );
  }

  const all = await prisma.rating.findMany({
    where: { albumId: album.id },
    select: { score: true },
  });
  const scores = all.map((r) => r.score);
  const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
  const med = medianFn(scores);
  const hist = ratingHistogram(scores);

  const mine = userId
    ? await prisma.rating.findUnique({
        where: { userId_albumId: { userId, albumId: album.id } },
        select: { score: true },
      })
    : null;

  return NextResponse.json({
    mine: mine?.score ?? null,
    aggregate: {
      avg: avg ? Math.round(avg * 10) / 10 : null,
      median: med,
      count: scores.length,
      histogram: hist,
    },
  });
}
