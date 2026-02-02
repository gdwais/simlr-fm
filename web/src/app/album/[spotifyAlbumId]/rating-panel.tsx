"use client";

import { useEffect, useMemo, useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";

function Bar({ value, max }: { value: number; max: number }) {
  const w = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="h-2 w-full rounded bg-secondary">
      <div className="h-2 rounded bg-primary" style={{ width: `${w}%` }} />
    </div>
  );
}

export function RatingPanel({
  spotifyAlbumId,
  initialMine,
  initialAvg,
  initialMedian,
  initialCount,
  initialHistogram,
}: {
  spotifyAlbumId: string;
  initialMine: number | null;
  initialAvg: number | null;
  initialMedian: number | null;
  initialCount: number;
  initialHistogram: number[];
}) {
  const [value, setValue] = useState<number>(initialMine ?? 7);
  const [saving, setSaving] = useState(false);

  const [avg, setAvg] = useState<number | null>(initialAvg);
  const [med, setMed] = useState<number | null>(initialMedian);
  const [count, setCount] = useState<number>(initialCount);
  const [hist, setHist] = useState<number[]>(initialHistogram);

  const label = useMemo(() => `${value}/10`, [value]);
  const maxBin = useMemo(() => Math.max(0, ...hist), [hist]);

  useEffect(() => {
    // ensure album exists in DB before rating
    void fetch(`/api/albums/${spotifyAlbumId}/upsert`, { method: "POST" });
  }, [spotifyAlbumId]);

  async function refreshStats() {
    const res = await fetch(`/api/albums/${spotifyAlbumId}/stats`);
    const data = await res.json();
    if (res.ok) {
      setAvg(data.aggregate?.avg ?? null);
      setMed(data.aggregate?.median ?? null);
      setCount(data.aggregate?.count ?? 0);
      setHist(data.aggregate?.histogram ?? Array.from({ length: 10 }, () => 0));
      if (typeof data.mine === "number") setValue(data.mine);
    }
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/ratings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ spotifyAlbumId, score: value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to save rating");

      setAvg(data.aggregate?.avg ?? null);
      setMed(data.aggregate?.median ?? null);
      setCount(data.aggregate?.count ?? 0);
      setHist(data.aggregate?.histogram ?? Array.from({ length: 10 }, () => 0));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg border p-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-sm font-medium">Your rating</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">{label}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            Community: avg {avg ?? "—"} · median {med ?? "—"} · {count} ratings
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={refreshStats} disabled={saving}>
            Refresh
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      <div className="mt-4">
        <Slider
          value={[value]}
          onValueChange={(v) => setValue(v[0] ?? 7)}
          min={1}
          max={10}
          step={1}
        />
      </div>

      <div className="mt-5">
        <div className="text-sm font-medium">Distribution</div>
        <div className="mt-3 space-y-2">
          {hist.map((c, i) => (
            <div key={i} className="grid grid-cols-[32px_1fr_40px] items-center gap-3">
              <div className="text-xs text-muted-foreground">{i + 1}</div>
              <Bar value={c} max={maxBin} />
              <div className="text-right text-xs text-muted-foreground tabular-nums">
                {c}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
