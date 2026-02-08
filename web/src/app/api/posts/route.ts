import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/server-auth";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { hotScore } from "@/lib/rank";
import { createAlbumService } from "@/lib/services/album.service";

const CreateSchema = z.object({
  albumId: z.string().min(1), // Accepts both MBID and Spotify ID
  title: z.string().min(1).max(120),
  body: z.string().min(1).max(5000),
});

const ListSchema = z.object({
  albumId: z.string().min(1), // Accepts both MBID and Spotify ID
  sort: z.enum(["new", "top", "hot"]).optional(),
});

export async function GET(req: Request) {
  const userId = await getCurrentUserId();
  // userId already fetched

  const url = new URL(req.url);
  const parsed = ListSchema.safeParse({
    albumId: url.searchParams.get("albumId") ?? "",
    sort: url.searchParams.get("sort") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Missing albumId" }, { status: 400 });
  }

  // Resolve album ID (supports both MBID and Spotify ID)
  const albumService = createAlbumService(prisma);
  const albumId = await albumService.resolveAlbumId(parsed.data.albumId);

  if (!albumId) return NextResponse.json({ items: [] });

  const sort = parsed.data.sort ?? "hot";

  const posts = await prisma.post.findMany({
    where: { albumId },
    select: {
      id: true,
      title: true,
      body: true,
      createdAt: true,
      user: { select: { username: true, name: true, image: true } },
      _count: { select: { comments: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const postIds = posts.map((p) => p.id);
  const voteSums = await prisma.vote.groupBy({
    by: ["entityId"],
    where: { entityType: "POST", entityId: { in: postIds } },
    _sum: { value: true },
  });
  const scoreById = new Map(voteSums.map((v) => [v.entityId, v._sum.value ?? 0]));

  let myVoteById = new Map<string, number>();
  if (userId) {
    const myVotes = await prisma.vote.findMany({
      where: { userId, entityType: "POST", entityId: { in: postIds } },
      select: { entityId: true, value: true },
    });
    myVoteById = new Map(myVotes.map((v) => [v.entityId, v.value]));
  }

  const items = posts
    .map((p) => {
      const score = scoreById.get(p.id) ?? 0;
      const myVote = myVoteById.get(p.id) ?? 0;
      return { ...p, score, myVote };
    })
    .sort((a, b) => {
      if (sort === "new") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sort === "top") return b.score - a.score;
      return hotScore({ score: b.score, date: new Date(b.createdAt) }) -
        hotScore({ score: a.score, date: new Date(a.createdAt) });
    })
    .slice(0, 50);

  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const userId = await getCurrentUserId();
  // userId already fetched
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = CreateSchema.parse(await req.json());

  // Resolve album ID (supports both MBID and Spotify ID)
  const albumService = createAlbumService(prisma);
  const albumId = await albumService.resolveAlbumId(body.albumId);

  if (!albumId) {
    return NextResponse.json(
      { error: "Album not found (upsert it first)" },
      { status: 400 },
    );
  }

  const post = await prisma.post.create({
    data: {
      albumId,
      userId,
      title: body.title,
      body: body.body,
    },
    select: { id: true },
  });

  return NextResponse.json({ post });
}
