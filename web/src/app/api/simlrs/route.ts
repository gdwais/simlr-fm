import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const CreateSchema = z.object({
  sourceSpotifyAlbumId: z.string().min(1),
  targetSpotifyAlbumId: z.string().min(1),
  reason: z.string().min(140).max(280),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = CreateSchema.parse(await req.json());
  if (body.sourceSpotifyAlbumId === body.targetSpotifyAlbumId) {
    return NextResponse.json(
      { error: "Source and target must be different albums" },
      { status: 400 },
    );
  }

  const [source, target] = await Promise.all([
    prisma.album.findUnique({
      where: { spotifyAlbumId: body.sourceSpotifyAlbumId },
      select: { id: true },
    }),
    prisma.album.findUnique({
      where: { spotifyAlbumId: body.targetSpotifyAlbumId },
      select: { id: true },
    }),
  ]);

  if (!source || !target) {
    return NextResponse.json(
      { error: "Album not found. Upsert both albums first." },
      { status: 400 },
    );
  }

  // Require user has rated the source album (anti-spam gating)
  const userRating = await prisma.rating.findUnique({
    where: { userId_albumId: { userId: userId, albumId: source.id } },
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
          sourceAlbumId: source.id,
          targetAlbumId: target.id,
        },
      },
      create: {
        sourceAlbumId: source.id,
        targetAlbumId: target.id,
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
