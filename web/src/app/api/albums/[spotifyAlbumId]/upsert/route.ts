import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { spotifyAppClient } from "@/lib/spotify";

const ParamsSchema = z.object({ spotifyAlbumId: z.string().min(1) });

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ spotifyAlbumId: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { spotifyAlbumId } = ParamsSchema.parse(await ctx.params);

  const spotify = spotifyAppClient();
  const token = await spotify.clientCredentialsGrant();
  spotify.setAccessToken(token.body.access_token);

  const res = await spotify.getAlbum(spotifyAlbumId);
  const a = res.body;

  const album = await prisma.album.upsert({
    where: { spotifyAlbumId },
    create: {
      spotifyAlbumId,
      title: a.name,
      artistsJson: a.artists.map((x) => ({ id: x.id, name: x.name })),
      coverUrl: a.images?.[0]?.url ?? null,
      releaseYear: a.release_date ? Number(a.release_date.slice(0, 4)) : null,
    },
    update: {
      title: a.name,
      artistsJson: a.artists.map((x) => ({ id: x.id, name: x.name })),
      coverUrl: a.images?.[0]?.url ?? null,
      releaseYear: a.release_date ? Number(a.release_date.slice(0, 4)) : null,
    },
    select: { id: true, spotifyAlbumId: true },
  });

  return NextResponse.json({ album });
}
