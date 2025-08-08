"use client";
import React from "react";
import { TextPostCard, type TextPost } from "../posts/TextPostCard";

interface TextFeedProps {
  posts: TextPost[];
}

export function TextFeed({ posts }: TextFeedProps) {
  return (
    <div className="h-full overflow-y-auto px-4 py-4 space-y-4">
      {posts.map((p) => (
        <TextPostCard key={p.id} post={p} />
      ))}
    </div>
  );
}