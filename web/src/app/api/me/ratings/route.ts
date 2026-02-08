import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/server-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ratings = await prisma.rating.findMany({
    where: { userId },
    select: {
      score: true,
      updatedAt: true,
      album: { select: { spotifyAlbumId: true, title: true, coverUrl: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ items: ratings });
}
