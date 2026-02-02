import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hotScore } from "@/lib/rank";

const CreateSchema = z.object({
  spotifyAlbumId: z.string().min(1),
  title: z.string().min(1).max(120),
  body: z.string().min(1).max(5000),
});

const ListSchema = z.object({
  spotifyAlbumId: z.string().min(1),
  sort: z.enum(["new", "top", "hot"]).optional(),
});

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  const url = new URL(req.url);
  const parsed = ListSchema.safeParse({
    spotifyAlbumId: url.searchParams.get("spotifyAlbumId") ?? "",
    sort: (url.searchParams.get("sort") as any) ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Missing spotifyAlbumId" }, { status: 400 });
  }

  const album = await prisma.album.findUnique({
    where: { spotifyAlbumId: parsed.data.spotifyAlbumId },
    select: { id: true },
  });

  if (!album) return NextResponse.json({ items: [] });

  const sort = parsed.data.sort ?? "hot";

  const posts = await prisma.post.findMany({
    where: { albumId: album.id },
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
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = CreateSchema.parse(await req.json());

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

  const post = await prisma.post.create({
    data: {
      albumId: album.id,
      userId,
      title: body.title,
      body: body.body,
    },
    select: { id: true },
  });

  return NextResponse.json({ post });
}
