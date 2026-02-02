import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type SpotifyApi from "spotify-web-api-node";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { spotifyAppClient, hasSpotifyKeys } from "@/lib/spotify";
import { ensureMockSeeded } from "@/lib/seed";
import { prisma } from "@/lib/prisma";
import { median as medianFn, ratingHistogram } from "@/lib/stats";
import { getMockAlbum } from "@/lib/mock";
import { RatingPanel } from "./rating-panel";
import { SimlrsPanel } from "./simlrs-panel";
import { DiscussionPanel } from "./discussion-panel";

export default async function AlbumPage({
  params,
}: {
  params: Promise<{ spotifyAlbumId: string }>;
}) {
  const { spotifyAlbumId } = await params;

  const session = await getServerSession(authOptions);

  // Ensure we have baseline data in DB when Spotify keys are missing
  if (!hasSpotifyKeys()) {
    await ensureMockSeeded();
  }

  let album: SpotifyApi.AlbumObjectFull | null = null;

  if (hasSpotifyKeys()) {
    const spotify = spotifyAppClient();
    const token = await spotify.clientCredentialsGrant();
    spotify.setAccessToken(token.body.access_token);

    try {
      const res = await spotify.getAlbum(spotifyAlbumId);
      album = res.body as SpotifyApi.AlbumObjectFull;

      // Upsert into DB for ratings/simlrs/discussion
      await prisma.album.upsert({
        where: { spotifyAlbumId },
        create: {
          spotifyAlbumId,
          title: album.name,
          artistsJson: album.artists.map((x) => ({ id: x.id, name: x.name })),
          coverUrl: album.images?.[0]?.url ?? null,
          releaseYear: album.release_date ? Number(album.release_date.slice(0, 4)) : null,
        },
        update: {
          title: album.name,
          artistsJson: album.artists.map((x) => ({ id: x.id, name: x.name })),
          coverUrl: album.images?.[0]?.url ?? null,
          releaseYear: album.release_date ? Number(album.release_date.slice(0, 4)) : null,
        },
      });
    } catch {
      notFound();
    }
  } else {
    // Mock mode: try DB first, then known mock list
    const dbAlbum = await prisma.album.findUnique({
      where: { spotifyAlbumId },
      select: {
        spotifyAlbumId: true,
        title: true,
        artistsJson: true,
        coverUrl: true,
        releaseYear: true,
      },
    });

    const mock = getMockAlbum(spotifyAlbumId);
    const title = dbAlbum?.title ?? mock?.title;
    if (!title) notFound();

    const artists = (dbAlbum?.artistsJson ?? mock?.artists ?? []) as any[];
    const coverUrl = dbAlbum?.coverUrl ?? mock?.coverUrl ?? null;
    const releaseDate = mock?.releaseDate ?? (dbAlbum?.releaseYear ? String(dbAlbum.releaseYear) : "");

    album = {
      // minimal fields we use
      name: title,
      artists: artists.map((a) => ({ id: a.id ?? "", name: a.name })),
      images: coverUrl ? [{ url: coverUrl, height: 640, width: 640 }] : [],
      release_date: releaseDate,
    } as any;
  }

  // Load stats from DB
  const db = await prisma.album.findUnique({
    where: { spotifyAlbumId },
    select: { id: true },
  });

  const scores = db
    ? (await prisma.rating.findMany({ where: { albumId: db.id }, select: { score: true } })).map((r) => r.score)
    : [];

  const avg = scores.length ? Math.round((scores.reduce((a,b)=>a+b,0)/scores.length) * 10) / 10 : null;
  const med = medianFn(scores);
  const hist = ratingHistogram(scores);

  if (!album) notFound();

  const mine = session?.user?.id && db
    ? await prisma.rating.findUnique({
        where: { userId_albumId: { userId: session.user.id, albumId: db.id } },
        select: { score: true },
      })
    : null;

  return (

    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{album.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {album.artists.map((a) => a.name).join(", ")} · {album.release_date}
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/search" className="text-sm text-muted-foreground hover:underline">
            Search
          </Link>
          <Link href="/" className="text-sm text-muted-foreground hover:underline">
            Home
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-8 md:grid-cols-[240px_1fr]">
        <div>
          <div className="relative aspect-square w-full max-w-[240px] overflow-hidden rounded-lg border">
            {album.images?.[0]?.url ? (
              <Image
                src={album.images[0].url}
                alt={album.name}
                fill
                className="object-cover"
                sizes="240px"
              />
            ) : (
              <div className="h-full w-full bg-muted" />
            )}
          </div>
        </div>

        <div className="space-y-8">
          <section>
            <h2 className="text-lg font-semibold">Rate</h2>
            {session?.user ? (
              <RatingPanel
                spotifyAlbumId={spotifyAlbumId}
                initialMine={mine?.score ?? null}
                initialAvg={avg}
                initialMedian={med}
                initialCount={scores.length}
                initialHistogram={hist}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                Sign in to rate this album.
              </p>
            )}
          </section>

          <section>
            <h2 className="text-lg font-semibold">Simlrs</h2>
            {session?.user ? (
              <SimlrsPanel spotifyAlbumId={spotifyAlbumId} />
            ) : (
              <p className="text-sm text-muted-foreground">
                Sign in to add Simlrs.
              </p>
            )}
          </section>

          <section>
            <h2 className="text-lg font-semibold">Discussion</h2>
            {session?.user ? (
              <DiscussionPanel spotifyAlbumId={spotifyAlbumId} />
            ) : (
              <p className="text-sm text-muted-foreground">
                Sign in to start threads and comment.
              </p>
            )}
          </section>
        </div>
      </div>

      <p className="mt-10 text-xs text-muted-foreground">
        Spotify data fetched server-side via client credentials.
      </p>
    </main>
  );
}
