import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createAlbumService } from "@/lib/services/album.service";
import { getCurrentUser } from "@/lib/server-auth";
import { RatingPanel } from "./rating-panel";
import { SimlrsPanel } from "./simlrs-panel";
import { DiscussionPanel } from "./discussion-panel";

// ID format detection
const MBID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SPOTIFY_ID_REGEX = /^[0-9A-Za-z]{22}$/;

export default async function AlbumPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const user = await getCurrentUser();

  // Detect ID format
  const isMbid = MBID_REGEX.test(id);
  const isSpotifyId = SPOTIFY_ID_REGEX.test(id);

  if (!isMbid && !isSpotifyId) {
    notFound();
  }

  // Fetch album using album service
  const albumService = createAlbumService(prisma);

  let albumDetail;
  if (isMbid) {
    albumDetail = await albumService.getByMbid(id);
  } else if (isSpotifyId) {
    albumDetail = await albumService.getBySpotifyId(id);
  }

  if (!albumDetail) {
    notFound();
  }

  const album = albumDetail;
  const stats = albumDetail.stats;

  // Get user's rating
  const mine = user?.id
    ? await prisma.rating.findUnique({
        where: { userId_albumId: { userId: user.id, albumId: album.id } },
        select: { score: true },
      })
    : null;

  // Determine which ID to use for panels (prefer MBID, fallback to Spotify ID)
  const albumIdentifier = album.mbid || album.spotifyAlbumId;

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{album.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {album.artists.map((a) => a.name).join(", ")}
            {album.releaseYear && ` · ${album.releaseYear}`}
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
            {album.coverUrl ? (
              <Image
                src={album.coverUrl}
                alt={album.title}
                fill
                className="object-cover"
                sizes="240px"
              />
            ) : (
              <div className="h-full w-full bg-muted flex items-center justify-center text-muted-foreground">
                No Cover
              </div>
            )}
          </div>
        </div>

        <div className="space-y-8">
          <section>
            <h2 className="text-lg font-semibold">Rate</h2>
            {user ? (
              <RatingPanel
                albumId={albumIdentifier!}
                initialMine={mine?.score ?? null}
                initialAvg={stats.averageRating}
                initialMedian={stats.medianRating}
                initialCount={stats.ratingCount}
                initialHistogram={stats.histogram}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                Sign in to rate this album.
              </p>
            )}
          </section>

          <section>
            <h2 className="text-lg font-semibold">Simlrs</h2>
            {user ? (
              <SimlrsPanel albumId={albumIdentifier!} />
            ) : (
              <p className="text-sm text-muted-foreground">
                Sign in to add Simlrs.
              </p>
            )}
          </section>

          <section>
            <h2 className="text-lg font-semibold">Discussion</h2>
            {user ? (
              <DiscussionPanel albumId={albumIdentifier!} />
            ) : (
              <p className="text-sm text-muted-foreground">
                Sign in to start threads and comment.
              </p>
            )}
          </section>
        </div>
      </div>

      <p className="mt-10 text-xs text-muted-foreground">
        {album.mbid ? 'Album data from MusicBrainz' : 'Legacy Spotify album'}
      </p>
    </main>
  );
}
