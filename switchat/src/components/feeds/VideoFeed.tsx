"use client";
import React from "react";
import { VideoPostCard, type VideoPost } from "../posts/VideoPostCard";

interface VideoFeedProps {
  posts: VideoPost[];
}

export function VideoFeed({ posts }: VideoFeedProps) {
  return (
    <div className="h-full overflow-y-auto px-4 py-4 space-y-4">
      {posts.map((p) => (
        <VideoPostCard key={p.id} post={p} />
      ))}
    </div>
  );
}