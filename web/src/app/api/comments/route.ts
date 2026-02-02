import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ListSchema = z.object({
  postId: z.string().min(1),
  sort: z.enum(["new", "top"]).optional(),
});

const CreateSchema = z.object({
  postId: z.string().min(1),
  parentId: z.string().min(1).optional(),
  body: z.string().min(1).max(5000),
});

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  const url = new URL(req.url);
  const parsed = ListSchema.safeParse({
    postId: url.searchParams.get("postId") ?? "",
    sort: (url.searchParams.get("sort") as any) ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Missing postId" }, { status: 400 });
  }

  const sort = parsed.data.sort ?? "new";

  const comments = await prisma.comment.findMany({
    where: { postId: parsed.data.postId },
    select: {
      id: true,
      parentId: true,
      body: true,
      createdAt: true,
      user: { select: { username: true, name: true, image: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const ids = comments.map((c) => c.id);
  const voteSums = await prisma.vote.groupBy({
    by: ["entityId"],
    where: { entityType: "COMMENT", entityId: { in: ids } },
    _sum: { value: true },
  });
  const scoreById = new Map(voteSums.map((v) => [v.entityId, v._sum.value ?? 0]));

  let myVoteById = new Map<string, number>();
  if (userId) {
    const myVotes = await prisma.vote.findMany({
      where: { userId, entityType: "COMMENT", entityId: { in: ids } },
      select: { entityId: true, value: true },
    });
    myVoteById = new Map(myVotes.map((v) => [v.entityId, v.value]));
  }

  const items = comments
    .map((c) => ({
      ...c,
      score: scoreById.get(c.id) ?? 0,
      myVote: myVoteById.get(c.id) ?? 0,
    }))
    .sort((a, b) => {
      if (sort === "top") return b.score - a.score;
      // "new" means chronological for now
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = CreateSchema.parse(await req.json());

  const comment = await prisma.comment.create({
    data: {
      postId: body.postId,
      userId,
      parentId: body.parentId,
      body: body.body,
    },
    select: { id: true },
  });

  return NextResponse.json({ comment });
}
