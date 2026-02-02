import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      username: true,
      name: true,
      image: true,
      rushmore: {
        select: {
          slot: true,
          album: {
            select: {
              spotifyAlbumId: true,
              title: true,
              coverUrl: true,
              artistsJson: true,
              releaseYear: true,
            },
          },
        },
        orderBy: { slot: "asc" },
      },
      ratings: {
        select: {
          score: true,
          updatedAt: true,
          album: { select: { spotifyAlbumId: true, title: true, coverUrl: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: 20,
      },
    },
  });

  if (!user) notFound();

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          {user.image ? (
            <div className="relative h-12 w-12 overflow-hidden rounded-full border">
              <Image
                src={user.image}
                alt={user.username ?? "user"}
                fill
                className="object-cover"
                sizes="48px"
              />
            </div>
          ) : (
            <div className="h-12 w-12 rounded-full border bg-muted" />
          )}

          <div>
            <h1 className="text-2xl font-semibold">@{user.username}</h1>
            {user.name && (
              <p className="mt-1 text-sm text-muted-foreground">{user.name}</p>
            )}
          </div>
        </div>

        <Link href="/" className="text-sm text-muted-foreground hover:underline">
          Home
        </Link>
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Mount Rushmore</h2>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((slot) => {
            const r = user.rushmore.find((x) => x.slot === slot);
            if (!r) {
              return (
                <div key={slot} className="rounded-lg border p-4 text-sm text-muted-foreground">
                  Slot {slot}: (empty)
                </div>
              );
            }
            return (
              <Link
                key={slot}
                href={`/album/${r.album.spotifyAlbumId}`}
                className="rounded-lg border p-4 hover:bg-accent/50"
              >
                <div className="relative aspect-square w-full overflow-hidden rounded">
                  {r.album.coverUrl ? (
                    <Image
                      src={r.album.coverUrl}
                      alt={r.album.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="h-full w-full bg-muted" />
                  )}
                </div>
                <div className="mt-3 font-medium">{r.album.title}</div>
                <div className="text-xs text-muted-foreground">
                  {r.album.releaseYear ?? ""}
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Recent ratings</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {user.ratings.map((r) => (
            <Link
              key={r.album.spotifyAlbumId + r.updatedAt}
              href={`/album/${r.album.spotifyAlbumId}`}
              className="rounded-lg border p-4 hover:bg-accent/50"
            >
              <div className="flex gap-4">
                <div className="relative h-14 w-14 overflow-hidden rounded">
                  {r.album.coverUrl ? (
                    <Image
                      src={r.album.coverUrl}
                      alt={r.album.title}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  ) : (
                    <div className="h-full w-full bg-muted" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{r.album.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {r.score}/10
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(r.updatedAt).toLocaleString()}
                  </div>
                </div>
              </div>
            </Link>
          ))}
          {user.ratings.length === 0 && (
            <p className="text-sm text-muted-foreground">No ratings yet.</p>
          )}
        </div>
      </section>
    </main>
  );
}
