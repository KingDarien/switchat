"use client";
import React, { useEffect, useRef, useState } from "react";

export interface VideoPost {
  id: string;
  author: string;
  avatarUrl?: string;
  caption?: string;
  videoUrl: string;
  timestamp: string;
}

interface VideoPostCardProps {
  post: VideoPost;
}

export function VideoPostCard({ post }: VideoPostCardProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [muted, setMuted] = useState(true);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setIsActive(entry.isIntersecting && entry.intersectionRatio > 0.6);
      },
      { threshold: [0, 0.6, 1] }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (isActive) {
      el.play().catch(() => {});
    } else {
      el.pause();
    }
  }, [isActive]);

  return (
    <article className="card overflow-hidden soft-shadow">
      <div className="relative aspect-[9/16] bg-black">
        <video
          ref={videoRef}
          src={post.videoUrl}
          className="h-full w-full object-cover"
          playsInline
          muted={muted}
          loop
          preload="metadata"
          onClick={() => setMuted((m) => !m)}
        />
        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/60 to-transparent text-white">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full overflow-hidden bg-white/20 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {post.avatarUrl ? (
                <img src={post.avatarUrl} alt={post.author} className="h-full w-full object-cover" />
              ) : (
                <span>🎬</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{post.author}</p>
              {!!post.caption && (
                <p className="text-xs text-white/80 line-clamp-2">{post.caption}</p>
              )}
            </div>
            <div className="ml-auto text-xs opacity-80 bg-white/10 px-2 py-1 rounded-full">
              {muted ? "Muted" : "Sound on"}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}