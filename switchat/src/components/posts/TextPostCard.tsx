"use client";
import React, { useState } from "react";

export interface Comment {
  id: string;
  author: string;
  text: string;
}

export interface TextPost {
  id: string;
  author: string;
  avatarUrl?: string;
  timestamp: string;
  text: string;
  imageUrl?: string;
  comments?: Comment[];
}

interface TextPostCardProps {
  post: TextPost;
}

export function TextPostCard({ post }: TextPostCardProps) {
  const [comments, setComments] = useState<Comment[]>(post.comments ?? []);
  const [draft, setDraft] = useState("");

  const addComment = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    setComments((c) => [
      ...c,
      { id: String(Date.now()), author: "You", text: trimmed },
    ]);
    setDraft("");
  };

  return (
    <article className="card soft-shadow overflow-hidden">
      <div className="p-4">
        <header className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-[color:var(--surface-2)] overflow-hidden flex items-center justify-center text-sm">
            {post.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={post.avatarUrl} alt={post.author} className="h-full w-full object-cover" />
            ) : (
              <span>💬</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="font-semibold truncate">{post.author}</p>
            <p className="text-xs text-white/60">{post.timestamp}</p>
          </div>
        </header>
        <p className="mt-3 text-sm leading-6 text-white/90 whitespace-pre-wrap">{post.text}</p>
      </div>
      {post.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.imageUrl}
          alt="post image"
          className="w-full max-h-[480px] object-cover"
        />
      )}

      <div className="p-4 border-t border-white/5">
        <div className="space-y-2">
          {comments.map((c) => (
            <div key={c.id} className="text-sm">
              <span className="font-semibold">{c.author}</span>{" "}
              <span className="text-white/80">{c.text}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg bg-[color:var(--surface-2)] border border-white/10 focus-ring text-sm"
            placeholder="Write a comment"
          />
          <button
            onClick={addComment}
            className="px-3 py-2 rounded-lg bg-[color:var(--primary)] text-black text-sm font-semibold focus-ring"
          >
            Comment
          </button>
        </div>
      </div>
    </article>
  );
}