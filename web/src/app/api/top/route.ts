import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const QuerySchema = z.object({
  min: z.coerce.number().int().min(1).max(500).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse({
    min: url.searchParams.get("min") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
  });

  const min = parsed.success ? parsed.data.min ?? 5 : 5;
  const limit = parsed.success ? parsed.data.limit ?? 50 : 50;

  const grouped = await prisma.rating.groupBy({
    by: ["albumId"],
    _avg: { score: true },
    _count: { score: true },
    having: {
      score: { _count: { gte: min } },
    },
  });

  // Sort by avg desc, then count desc
  const sorted = grouped
    .map((g) => ({
      albumId: g.albumId,
      avg: g._avg.score ?? 0,
      count: g._count.score ?? 0,
    }))
    .sort((a, b) => (b.avg - a.avg) || (b.count - a.count))
    .slice(0, limit);

  const albums = await prisma.album.findMany({
    where: { id: { in: sorted.map((x) => x.albumId) } },
    select: {
      id: true,
      spotifyAlbumId: true,
      title: true,
      coverUrl: true,
      releaseYear: true,
      artistsJson: true,
    },
  });

  const byId = new Map(albums.map((a) => [a.id, a]));

  return NextResponse.json({
    items: sorted.map((s) => ({
      album: byId.get(s.albumId),
      avg: Math.round(s.avg * 10) / 10,
      count: s.count,
    })),
  });
}
