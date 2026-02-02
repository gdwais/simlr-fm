import { NextResponse } from "next/server";
import { z } from "zod";
import { spotifyAppClient, hasSpotifyKeys } from "@/lib/spotify";
import { mockSearch } from "@/lib/mock";
import { ensureMockSeeded } from "@/lib/seed";

const QuerySchema = z.object({
  q: z.string().min(1),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse({ q: url.searchParams.get("q") ?? "" });
  if (!parsed.success) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  const { q } = parsed.data;

  if (!hasSpotifyKeys()) {
    await ensureMockSeeded();
    const items = mockSearch(q).slice(0, 12);
    return NextResponse.json({
      items: items.map((a) => ({
        spotifyAlbumId: a.spotifyAlbumId,
        title: a.title,
        artists: a.artists,
        coverUrl: a.coverUrl,
        releaseDate: a.releaseDate,
      })),
    });
  }

  const spotify = spotifyAppClient();
  const token = await spotify.clientCredentialsGrant();
  spotify.setAccessToken(token.body.access_token);

  const res = await spotify.searchAlbums(q, { limit: 12 });
  const items = res.body.albums?.items ?? [];

  return NextResponse.json({
    items: items.map((a) => ({
      spotifyAlbumId: a.id,
      title: a.name,
      artists: a.artists.map((x) => ({ id: x.id, name: x.name })),
      coverUrl: a.images?.[0]?.url ?? null,
      releaseDate: a.release_date,
    })),
  });
}
