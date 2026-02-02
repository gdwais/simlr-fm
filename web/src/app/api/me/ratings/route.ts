import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
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
