"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Item = {
  album: {
    spotifyAlbumId: string;
    title: string;
    coverUrl: string | null;
    releaseYear: number | null;
    artistsJson: unknown;
  };
  avg: number;
  count: number;
};

export default function TopPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [min, setMin] = useState("5");

  useEffect(() => {
    const m = Number(min);
    const q = Number.isFinite(m) && m > 0 ? m : 5;
    void (async () => {
      const res = await fetch(`/api/top?min=${q}`);
      const data = await res.json();
      setItems(data.items ?? []);
    })();
  }, [min]);

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Top albums</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ranked by average rating (with a minimum number of ratings).
          </p>
        </div>
        <Link href="/" className="text-sm text-muted-foreground hover:underline">
          Home
        </Link>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <div className="text-sm text-muted-foreground">Min ratings</div>
        <Input
          className="h-9 w-24"
          value={min}
          inputMode="numeric"
          onChange={(e) => setMin(e.target.value)}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {items.map((it) => (
          <Link key={it.album.spotifyAlbumId} href={`/album/${it.album.spotifyAlbumId}`}>
            <Card className="flex gap-4 p-4 hover:bg-accent/50">
              <div className="relative h-16 w-16 overflow-hidden rounded">
                {it.album.coverUrl ? (
                  <Image
                    src={it.album.coverUrl}
                    alt={it.album.title}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                ) : (
                  <div className="h-full w-full bg-muted" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{it.album.title}</div>
                <div className="text-xs text-muted-foreground">
                  {it.album.releaseYear ?? ""}
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  {it.avg}/10 · {it.count} ratings
                </div>
              </div>
            </Card>
          </Link>
        ))}

        {items.length === 0 && (
          <p className="text-sm text-muted-foreground">No data yet.</p>
        )}
      </div>
    </main>
  );
}
