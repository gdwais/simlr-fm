import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const QuerySchema = z.object({
  spotifyAlbumId: z.string().min(1),
  sort: z.enum(["new", "top"]).optional(),
});

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse({
    spotifyAlbumId: url.searchParams.get("spotifyAlbumId") ?? "",
    sort: (url.searchParams.get("sort") as any) ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Missing spotifyAlbumId" }, { status: 400 });
  }

  const source = await prisma.album.findUnique({
    where: { spotifyAlbumId: parsed.data.spotifyAlbumId },
    select: { id: true },
  });

  if (!source) {
    return NextResponse.json({ items: [] });
  }

  const edges = await prisma.simlrEdge.findMany({
    where: { sourceAlbumId: source.id },
    select: {
      id: true,
      targetAlbum: {
        select: {
          spotifyAlbumId: true,
          title: true,
          coverUrl: true,
          artistsJson: true,
          releaseYear: true,
        },
      },
      reasons: {
        select: {
          user: { select: { username: true, name: true, image: true } },
          reason: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 3,
      },
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const edgeIds = edges.map((e) => e.id);
  const sums = await prisma.vote.groupBy({
    by: ["entityId"],
    where: { entityType: "SIMLR_EDGE", entityId: { in: edgeIds } },
    _sum: { value: true },
  });

  const scoreById = new Map(sums.map((s) => [s.entityId, s._sum.value ?? 0]));

  let myVoteById = new Map<string, number>();
  if (userId) {
    const myVotes = await prisma.vote.findMany({
      where: { userId, entityType: "SIMLR_EDGE", entityId: { in: edgeIds } },
      select: { entityId: true, value: true },
    });
    myVoteById = new Map(myVotes.map((v) => [v.entityId, v.value]));
  }

  const items = edges
    .map((e) => ({
      ...e,
      score: scoreById.get(e.id) ?? 0,
      myVote: myVoteById.get(e.id) ?? 0,
    }))
    .sort((a, b) => {
      const sort = parsed.data.sort ?? "top";
      if (sort === "new") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return b.score - a.score;
    })
    .slice(0, 50);

  return NextResponse.json({ items });
}
