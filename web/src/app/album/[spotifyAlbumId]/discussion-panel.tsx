"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { VoteControls } from "@/components/vote-controls";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type PostItem = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  score: number;
  myVote?: number;
  user: { username: string | null; name: string | null; image: string | null };
  _count: { comments: number };
};

type CommentItem = {
  id: string;
  parentId: string | null;
  body: string;
  createdAt: string;
  score: number;
  myVote?: number;
  user: { username: string | null; name: string | null; image: string | null };
};

export function DiscussionPanel({ spotifyAlbumId }: { spotifyAlbumId: string }) {
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);

  const [commentBody, setCommentBody] = useState("");
  const [commenting, setCommenting] = useState(false);

  const [postSort, setPostSort] = useState<"hot" | "new" | "top">("hot");
  const [commentSort, setCommentSort] = useState<"new" | "top">("new");

  async function refreshPosts() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/posts?spotifyAlbumId=${encodeURIComponent(spotifyAlbumId)}&sort=${postSort}`,
      );
      const data = await res.json();
      setPosts(data.items ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function loadComments(postId: string) {
    const res = await fetch(
      `/api/comments?postId=${encodeURIComponent(postId)}&sort=${commentSort}`,
    );
    const data = await res.json();
    setComments(data.items ?? []);
  }

  useEffect(() => {
    void refreshPosts();
  }, [spotifyAlbumId, postSort]);

  async function createPost() {
    setPosting(true);
    try {
      await fetch(`/api/albums/${spotifyAlbumId}/upsert`, { method: "POST" });
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ spotifyAlbumId, title: title.trim(), body: body.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to create post");
      setTitle("");
      setBody("");
      await refreshPosts();
    } finally {
      setPosting(false);
    }
  }

  async function createComment() {
    if (!activePostId) return;
    setCommenting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ postId: activePostId, body: commentBody.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to comment");
      setCommentBody("");
      await loadComments(activePostId);
      await refreshPosts();
    } finally {
      setCommenting(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <div className="text-sm font-medium">Start a thread</div>
        <div className="mt-3 space-y-3">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
          />
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your thoughts…"
          />
          <Button
            onClick={createPost}
            disabled={posting || title.trim().length === 0 || body.trim().length === 0}
          >
            {posting ? "Posting…" : "Post"}
          </Button>
        </div>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm font-medium">Threads</div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Sort:</span>
          <Select value={postSort} onValueChange={(v) => setPostSort(v as any)}>
            <SelectTrigger className="h-8 w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hot">Hot</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="top">Top</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {!loading && posts.length === 0 && (
          <p className="text-sm text-muted-foreground">No posts yet.</p>
        )}

        {posts.map((p) => (
          <Card key={p.id} className="p-4">
            <div className="flex items-start gap-4">
              <VoteControls entityType="POST" entityId={p.id} initialScore={p.score} initialMyVote={p.myVote ?? 0} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{p.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {(p.user.username ?? p.user.name ?? "unknown") + " · " + new Date(p.createdAt).toLocaleString()}
                      {" · "}{p._count.comments} comments
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={activePostId === p.id ? "default" : "secondary"}
                    onClick={async () => {
                      const next = activePostId === p.id ? null : p.id;
                      setActivePostId(next);
                      setComments([]);
                      if (next) await loadComments(next);
                    }}
                  >
                    {activePostId === p.id ? "Hide" : "Open"}
                  </Button>
                </div>

                <div className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">
                  {p.body}
                </div>

                {activePostId === p.id && (
                  <div className="mt-4 space-y-3 border-t pt-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">Comments</div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Sort:</span>
                        <Select value={commentSort} onValueChange={async (v) => {
                          setCommentSort(v as any);
                          if (activePostId) await loadComments(activePostId);
                        }}>
                          <SelectTrigger className="h-8 w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="top">Top</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {comments.map((c) => (
                        <div key={c.id} className="flex gap-3 rounded border p-3">
                          <VoteControls
                            entityType="COMMENT"
                            entityId={c.id}
                            initialScore={c.score}
                            initialMyVote={c.myVote ?? 0}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="text-xs text-muted-foreground">
                              {(c.user.username ?? c.user.name ?? "unknown") + " · " + new Date(c.createdAt).toLocaleString()}
                            </div>
                            <div className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                              {c.body}
                            </div>
                          </div>
                        </div>
                      ))}

                      {comments.length === 0 && (
                        <p className="text-sm text-muted-foreground">No comments yet.</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Textarea
                        value={commentBody}
                        onChange={(e) => setCommentBody(e.target.value)}
                        placeholder="Add a comment…"
                      />
                      <Button
                        onClick={createComment}
                        disabled={commenting || commentBody.trim().length === 0}
                      >
                        {commenting ? "Commenting…" : "Comment"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
