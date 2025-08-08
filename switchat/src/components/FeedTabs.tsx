"use client";

import React from "react";

export type FeedKey = "voice" | "video" | "posts";

interface FeedTabsProps {
  active: FeedKey;
  onChange: (key: FeedKey) => void;
}

const tabs: { key: FeedKey; label: string }[] = [
  { key: "voice", label: "Voice" },
  { key: "video", label: "Video" },
  { key: "posts", label: "Posts" },
];

export function FeedTabs({ active, onChange }: FeedTabsProps) {
  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="relative grid grid-cols-3 rounded-full border border-white/10 bg-[color:var(--surface-2)] p-1">
        {/* indicator */}
        <div
          className="absolute top-1 bottom-1 w-1/3 rounded-full transition-transform duration-300 ease-out bg-[color:var(--surface)] border border-white/10 soft-shadow"
          style={{
            transform:
              active === "voice"
                ? "translateX(0%)"
                : active === "video"
                ? "translateX(100%)"
                : "translateX(200%)",
          }}
        />
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={`relative z-10 py-2.5 text-sm font-medium rounded-full transition-colors focus-ring ${
              active === t.key
                ? "text-[color:var(--foreground)]"
                : "text-white/60 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}