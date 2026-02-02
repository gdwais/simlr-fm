import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const UpsertSchema = z.object({
  slot: z.number().int().min(1).max(4),
  spotifyAlbumId: z.string().min(1),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = UpsertSchema.parse(await req.json());

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

  const slotRow = await prisma.rushmoreSlot.upsert({
    where: { userId_slot: { userId, slot: body.slot } },
    create: { userId, slot: body.slot, albumId: album.id },
    update: { albumId: album.id },
    select: { id: true },
  });

  return NextResponse.json({ slot: slotRow });
}

const ClearSchema = z.object({
  slot: z.number().int().min(1).max(4),
});

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = ClearSchema.parse(await req.json());

  await prisma.rushmoreSlot.deleteMany({
    where: { userId, slot: body.slot },
  });

  return NextResponse.json({ ok: true });
}
