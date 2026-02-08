"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { VoteControls } from "@/components/vote-controls";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SearchItem = {
  mbid: string;
  title: string;
  artists: { mbid: string; name: string }[];
  coverUrl: string | null;
  releaseYear: number | null;
};

type SimlrItem = {
  id: string;
  createdAt: string;
  score: number;
  myVote: number;
  targetAlbum: {
    mbid: string | null;
    spotifyAlbumId: string | null;
    title: string;
    coverUrl: string | null;
    artistsJson: unknown;
    releaseYear: number | null;
  };
  reasons: {
    user: { username: string | null; name: string | null; image: string | null };
    reason: string;
    createdAt: string;
  }[];
};

export function SimlrsPanel({ albumId }: { albumId: string }) {
  const [targetQ, setTargetQ] = useState("");
  const [targetResults, setTargetResults] = useState<SearchItem[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<SearchItem | null>(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [items, setItems] = useState<SimlrItem[]>([]);
  const [sort, setSort] = useState<"top" | "new">("top");
  const [loading, setLoading] = useState(false);

  const reasonLen = reason.trim().length;
  const reasonOk = reasonLen >= 140 && reasonLen <= 280;

  const canSearchTarget = useMemo(() => targetQ.trim().length >= 2, [targetQ]);

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/simlrs/list?albumId=${encodeURIComponent(albumId)}&sort=${sort}`,
      );
      const data = await res.json();
      setItems(data.items ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [albumId, sort]);

  async function searchTargets(nextQ: string) {
    const res = await fetch(`/api/albums/search?q=${encodeURIComponent(nextQ)}`);
    const data = (await res.json()) as { results: SearchItem[] };
    setTargetResults(data.results ?? []);
  }

  async function submit() {
    if (!selectedTarget) return;
    if (!reasonOk) return;

    setSubmitting(true);
    try {
      // Ensure target exists in DB too
      await fetch(`/api/albums/${selectedTarget.mbid}/upsert`, {
        method: "POST",
      });

      const res = await fetch("/api/simlrs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sourceAlbumId: albumId,
          targetAlbumId: selectedTarget.mbid,
          reason: reason.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to add simlr");

      setSelectedTarget(null);
      setTargetQ("");
      setTargetResults([]);
      setReason("");
      await refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="browse">
        <TabsList>
          <TabsTrigger value="browse">Browse</TabsTrigger>
          <TabsTrigger value="add">Add Simlr</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">Simlrs</div>
            <Select value={sort} onValueChange={(v) => setSort(v as "top" | "new")}>
              <SelectTrigger className="h-8 w-[120px]">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="top">Top</SelectItem>
                <SelectItem value="new">New</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {loading && (
            <p className="text-sm text-muted-foreground">Loading…</p>
          )}
          {!loading && items.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No Simlrs yet. Be the first to add one.
            </p>
          )}

          <div className="grid grid-cols-1 gap-3">
            {items.map((e) => {
              const targetAlbumId = e.targetAlbum.mbid ?? e.targetAlbum.spotifyAlbumId;
              if (!targetAlbumId) return null;
              return (
              <Link key={e.id} href={`/album/${targetAlbumId}`}>
                <Card className="flex gap-4 p-4 hover:bg-accent/50">
                  <div className="flex flex-col items-center justify-center">
                    <VoteControls
                      entityType="SIMLR_EDGE"
                      entityId={e.id}
                      initialScore={e.score}
                      initialMyVote={e.myVote}
                    />
                  </div>

                  <div className="relative h-14 w-14 overflow-hidden rounded">
                    {e.targetAlbum.coverUrl ? (
                      <Image
                        src={e.targetAlbum.coverUrl}
                        alt={e.targetAlbum.title}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    ) : (
                      <div className="h-full w-full bg-muted" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">
                      {e.targetAlbum.title}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {e.targetAlbum.releaseYear ?? ""}
                    </div>
                    {e.reasons?.[0] && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        “{e.reasons[0].reason}”
                      </div>
                    )}
                  </div>
                </Card>
              </Link>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="add" className="mt-4 space-y-4">
          <div className="rounded-lg border p-4">
            <div className="text-sm font-medium">Target album</div>
            <div className="mt-2">
              <Input
                value={targetQ}
                placeholder="Search for the album to link…"
                onChange={(e) => {
                  const next = e.target.value;
                  setTargetQ(next);
                  setSelectedTarget(null);
                  if (next.trim().length >= 2) void searchTargets(next);
                  else setTargetResults([]);
                }}
              />
            </div>

            {canSearchTarget && targetResults.length > 0 && !selectedTarget && (
              <div className="mt-3 grid grid-cols-1 gap-2">
                {targetResults.map((a) => (
                  <button
                    key={a.mbid}
                    className="rounded border p-3 text-left hover:bg-accent"
                    onClick={() => setSelectedTarget(a)}
                    type="button"
                  >
                    <div className="font-medium">
                      {a.title} — {a.artists.map((x) => x.name).join(", ")}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {a.releaseYear || 'Unknown year'}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {selectedTarget && (
              <div className="mt-3 rounded border bg-accent/30 p-3">
                <div className="text-sm font-medium">Selected</div>
                <div className="mt-1 text-sm">
                  {selectedTarget.title} —{" "}
                  {selectedTarget.artists.map((x) => x.name).join(", ")}
                </div>
                <button
                  className="mt-2 text-xs text-muted-foreground hover:underline"
                  type="button"
                  onClick={() => setSelectedTarget(null)}
                >
                  Change
                </button>
              </div>
            )}

            <div className="mt-4 text-sm font-medium">Reason (140–280 chars)</div>
            <div className="mt-2">
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Write a liner-notes style shoutout: what’s the connection and why should someone listen?"
              />
              <div className="mt-1 flex items-center justify-between text-xs">
                <span className={reasonOk ? "text-muted-foreground" : "text-destructive"}>
                  {reasonLen}/280
                </span>
                {!reasonOk && (
                  <span className="text-destructive">
                    Must be between 140 and 280 characters.
                  </span>
                )}
              </div>
            </div>

            <div className="mt-4">
              <Button
                onClick={submit}
                disabled={submitting || !selectedTarget || !reasonOk}
              >
                {submitting ? "Adding…" : "Add Simlr"}
              </Button>
              <p className="mt-2 text-xs text-muted-foreground">
                You must rate the source album before adding Simlrs.
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
