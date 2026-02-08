"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

type Me = {
  id: string;
  username: string | null;
  name: string | null;
  image: string | null;
  rushmore: { slot: number; album: { mbid: string | null; spotifyAlbumId: string | null; title: string; coverUrl: string | null } }[];
};

type RatingItem = {
  score: number;
  updatedAt: string;
  album: { mbid: string | null; spotifyAlbumId: string | null; title: string; coverUrl: string | null };
};

type SearchItem = {
  mbid: string;
  title: string;
  artists: { mbid: string; name: string }[];
  coverUrl: string | null;
  releaseYear: number | null;
};

export default function MePage() {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  const [username, setUsername] = useState("");
  const [savingUsername, setSavingUsername] = useState(false);

  const [slot, setSlot] = useState<number>(1);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchItem[]>([]);
  const [reasonDraft, setReasonDraft] = useState(""); // not used yet; placeholder for future UX
  const [busy, setBusy] = useState(false);
  const [myRatings, setMyRatings] = useState<RatingItem[]>([]);

  const rushmoreBySlot = useMemo(() => {
    const m = new Map<number, Me["rushmore"][number]>();
    for (const r of me?.rushmore ?? []) m.set(r.slot, r);
    return m;
  }, [me]);

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch("/api/me");
      const data = await res.json();
      if (!res.ok) {
        // Not logged in - just show the sign in message
        setMe(null);
        return;
      }
      setMe(data.me);
      setUsername(data.me?.username ?? "");

      const rr = await fetch("/api/me/ratings");
      const rd = await rr.json();
      if (rr.ok) setMyRatings(rd.items ?? []);
    } catch (error) {
      // Handle network errors gracefully
      console.error('Failed to load profile:', error);
      setMe(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function saveUsername() {
    setSavingUsername(true);
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username: username.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to save");
      await refresh();
    } finally {
      setSavingUsername(false);
    }
  }

  async function searchAlbums(nextQ: string) {
    const res = await fetch(`/api/albums/search?q=${encodeURIComponent(nextQ)}`);
    const data = (await res.json()) as { results: SearchItem[] };
    setResults(data.results ?? []);
  }

  async function setRushmore(slotNum: number, mbid: string) {
    setBusy(true);
    try {
      await fetch(`/api/albums/${mbid}/upsert`, { method: "POST" });

      // Get the internal album ID
      const res = await fetch("/api/me/rushmore", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slot: slotNum, spotifyAlbumId: mbid }), // API still expects this field name
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to set Rushmore slot");
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function clearRushmore(slotNum: number) {
    setBusy(true);
    try {
      const res = await fetch("/api/me/rushmore", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slot: slotNum }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to clear");
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Your profile</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Set a username and pick your Mount Rushmore (4 albums).
          </p>
        </div>
        <Link href="/" className="text-sm text-muted-foreground hover:underline">
          Home
        </Link>
      </div>

      {loading && <p className="mt-6 text-sm text-muted-foreground">Loading…</p>}

      {!loading && !me && (
        <p className="mt-6 text-sm text-muted-foreground">Sign in required.</p>
      )}

      {me && (
        <div className="mt-6 space-y-6">
          <Card className="p-4">
            <div className="text-sm font-medium">Username</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Used for your public profile: /u/&lt;username&gt;
            </p>
            <div className="mt-3 flex gap-2">
              <Input value={username} onChange={(e) => setUsername(e.target.value)} />
              <Button onClick={saveUsername} disabled={savingUsername || username.trim().length < 3}>
                {savingUsername ? "Saving…" : "Save"}
              </Button>
            </div>
          </Card>

          <Card className="p-4">
            <div className="text-sm font-medium">Mount Rushmore (Top 4 albums)</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Album-level only. You can change these any time.
            </p>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[1, 2, 3, 4].map((s) => {
                const r = rushmoreBySlot.get(s);
                return (
                  <div key={s} className="rounded border p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-medium text-muted-foreground">Slot {s}</div>
                      {r ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={busy}
                          onClick={() => clearRushmore(s)}
                        >
                          Clear
                        </Button>
                      ) : null}
                    </div>
                    <div className="mt-2 text-sm">
                      {r ? (
                        <Link href={`/album/${r.album.mbid ?? r.album.spotifyAlbumId}`} className="hover:underline">
                          {r.album.title}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">(empty)</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <Separator className="my-4" />

            <div className="text-sm font-medium">Set a slot</div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <div className="text-xs text-muted-foreground">Slot:</div>
              {[1, 2, 3, 4].map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={slot === s ? "default" : "secondary"}
                  onClick={() => setSlot(s)}
                >
                  {s}
                </Button>
              ))}
            </div>

            <div className="mt-3">
              <Input
                value={q}
                placeholder="Search albums to set Rushmore slot…"
                onChange={(e) => {
                  const next = e.target.value;
                  setQ(next);
                  if (next.trim().length >= 2) void searchAlbums(next);
                  else setResults([]);
                }}
              />
            </div>

            {results.length > 0 && (
              <div className="mt-3 grid grid-cols-1 gap-2">
                {results.map((a) => (
                  <button
                    key={a.mbid}
                    className="rounded border p-3 text-left hover:bg-accent"
                    disabled={busy}
                    onClick={() => setRushmore(slot, a.mbid)}
                    type="button"
                  >
                    <div className="font-medium">
                      {a.title} — {a.artists.map((x) => x.name).join(", ")}
                    </div>
                    <div className="text-xs text-muted-foreground">{a.releaseYear || 'Unknown year'}</div>
                  </button>
                ))}
              </div>
            )}

            {/* placeholder for future copy/UX improvements */}
            <div className="mt-4 hidden">
              <Textarea value={reasonDraft} onChange={(e) => setReasonDraft(e.target.value)} />
            </div>
          </Card>

          <Card className="p-4">
            <div className="text-sm font-medium">My ratings</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Your most recent ratings.
            </p>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {myRatings.map((r) => {
                const albumId = r.album.mbid ?? r.album.spotifyAlbumId;
                if (!albumId) return null;
                return (
                  <Link
                    key={albumId + r.updatedAt}
                    href={`/album/${albumId}`}
                    className="rounded-lg border p-4 hover:bg-accent/50"
                  >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate font-medium">{r.album.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(r.updatedAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="shrink-0 rounded-md bg-secondary px-2 py-1 text-sm font-medium">
                      {r.score}/10
                    </div>
                  </div>
                </Link>
                );
              })}

              {myRatings.length === 0 && (
                <p className="text-sm text-muted-foreground">No ratings yet.</p>
              )}
            </div>
          </Card>
        </div>
      )}
    </main>
  );
}
