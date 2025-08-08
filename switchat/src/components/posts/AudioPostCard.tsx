"use client";
import React, { useEffect, useRef, useState } from "react";

export interface AudioPost {
  id: string;
  author: string;
  avatarUrl?: string;
  timestamp: string;
  text?: string;
  audioUrl: string;
  duration?: string;
}

interface AudioPostCardProps {
  post: AudioPost;
}

export function AudioPostCard({ post }: AudioPostCardProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => {
      if (!audio.duration) return setProgress(0);
      setProgress((audio.currentTime / audio.duration) * 100);
    };
    const onEnded = () => setIsPlaying(false);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  const toggle = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch (e) {
        console.warn(e);
      }
    }
  };

  return (
    <article className="card soft-shadow p-4 flex flex-col gap-3">
      <header className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-[color:var(--surface-2)] overflow-hidden flex items-center justify-center text-sm">
          {post.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.avatarUrl} alt={post.author} className="h-full w-full object-cover" />
          ) : (
            <span>🎧</span>
          )}
        </div>
        <div className="min-w-0">
          <p className="font-semibold truncate">{post.author}</p>
          <p className="text-xs text-white/60">{post.timestamp}</p>
        </div>
      </header>

      {post.text && (
        <p className="text-sm leading-6 text-white/90 whitespace-pre-wrap">{post.text}</p>
      )}

      <div className="bg-[color:var(--surface-2)] rounded-xl p-3 border border-white/5">
        <div className="flex items-center gap-3">
          <button
            onClick={toggle}
            className="h-10 w-10 rounded-full bg-[color:var(--primary)] text-black font-semibold flex items-center justify-center focus-ring"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? "❚❚" : "▶"}
          </button>

          <div className="flex items-end h-6" aria-hidden>
            <span className="wave" />
            <span className="wave" />
            <span className="wave" />
            <span className="wave" />
            <span className="wave" />
          </div>
        </div>
        <div className="mt-3 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-[color:var(--accent)] transition-[width] duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
        <audio ref={audioRef} src={post.audioUrl} preload="none" />
      </div>
    </article>
  );
}