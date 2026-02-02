"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

type SearchItem = {
  spotifyAlbumId: string;
  title: string;
  artists: { id: string; name: string }[];
  coverUrl: string | null;
  releaseDate: string;
};

export default function SearchPage() {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(false);

  const canSearch = useMemo(() => q.trim().length >= 2, [q]);

  async function runSearch(nextQ: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/spotify/search?q=${encodeURIComponent(nextQ)}`);
      const data = (await res.json()) as { items: SearchItem[] };
      setItems(data.items ?? []);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Search albums</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Search by artist, album, or keywords.
          </p>
        </div>
        <Link href="/" className="text-sm text-muted-foreground hover:underline">
          Home
        </Link>
      </div>

      <div className="mt-6">
        <Input
          value={q}
          placeholder="e.g. Radiohead In Rainbows"
          onChange={(e) => {
            const next = e.target.value;
            setQ(next);
            if (next.trim().length >= 2) void runSearch(next);
            else setItems([]);
          }}
        />
      </div>

      <div className="mt-6">
        {loading && <p className="text-sm text-muted-foreground">Searching…</p>}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((a) => (
            <Link key={a.spotifyAlbumId} href={`/album/${a.spotifyAlbumId}`}>
              <Card className="flex gap-4 p-4 hover:bg-accent/50">
                <div className="relative h-16 w-16 overflow-hidden rounded">
                  {a.coverUrl ? (
                    <Image
                      src={a.coverUrl}
                      alt={a.title}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  ) : (
                    <div className="h-full w-full bg-muted" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="truncate font-medium">{a.title}</div>
                  <div className="truncate text-sm text-muted-foreground">
                    {a.artists.map((x) => x.name).join(", ")}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {a.releaseDate}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        {!loading && canSearch && items.length === 0 && (
          <p className="mt-4 text-sm text-muted-foreground">No results.</p>
        )}
      </div>
    </main>
  );
}
