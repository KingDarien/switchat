"use client";
import React from "react";
import { AudioPostCard, type AudioPost } from "../posts/AudioPostCard";

interface VoiceFeedProps {
  posts: AudioPost[];
}

export function VoiceFeed({ posts }: VoiceFeedProps) {
  return (
    <div className="h-full overflow-y-auto px-4 py-4 space-y-4">
      {posts.map((p) => (
        <AudioPostCard key={p.id} post={p} />
      ))}
    </div>
  );
}