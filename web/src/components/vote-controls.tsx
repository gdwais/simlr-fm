"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function VoteControls({
  entityType,
  entityId,
  initialScore,
  initialMyVote,
  className,
}: {
  entityType: "SIMLR_EDGE" | "POST" | "COMMENT";
  entityId: string;
  initialScore?: number;
  initialMyVote?: number;
  className?: string;
}) {
  const [score, setScore] = useState(initialScore ?? 0);
  const [myVote, setMyVote] = useState(initialMyVote ?? 0);
  const [busy, setBusy] = useState(false);

  async function vote(value: 1 | -1) {
    setBusy(true);
    try {
      const res = await fetch("/api/votes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ entityType, entityId, value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Vote failed");
      setScore(data.score ?? 0);
      setMyVote(data.myVote ?? 0);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={cn("inline-flex items-center gap-1", className)}>
      <Button
        size="icon"
        variant={myVote === 1 ? "default" : "secondary"}
        className="h-8 w-8"
        disabled={busy}
        onClick={() => vote(1)}
        aria-label="Upvote"
      >
        ↑
      </Button>
      <span className="min-w-[2ch] text-center text-sm tabular-nums text-muted-foreground">
        {score}
      </span>
      <Button
        size="icon"
        variant={myVote === -1 ? "default" : "secondary"}
        className="h-8 w-8"
        disabled={busy}
        onClick={() => vote(-1)}
        aria-label="Downvote"
      >
        ↓
      </Button>
    </div>
  );
}
