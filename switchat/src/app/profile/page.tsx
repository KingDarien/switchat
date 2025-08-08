"use client";

import { useMemo, useState } from "react";
import { demoProfile, audioPosts, textPosts, videoPosts } from "@/data/mock";
import { AudioPostCard } from "@/components/posts/AudioPostCard";
import { VideoPostCard } from "@/components/posts/VideoPostCard";
import { TextPostCard } from "@/components/posts/TextPostCard";

export default function ProfilePage() {
  const [profile] = useState(demoProfile);

  const featured = useMemo(() => {
    if (!profile.featuredType || !profile.featuredId) return null;
    if (profile.featuredType === "voice")
      return (
        <AudioPostCard post={audioPosts.find((p) => p.id === profile.featuredId)!} />
      );
    if (profile.featuredType === "video")
      return (
        <VideoPostCard post={videoPosts.find((p) => p.id === profile.featuredId)!} />
      );
    return (
      <TextPostCard post={textPosts.find((p) => p.id === profile.featuredId)!} />
    );
  }, [profile]);

  return (
    <div className="min-h-screen">
      {/* Profile Banner */}
      <div
        className="h-48 sm:h-56 w-full relative"
        style={{
          background:
            profile.theme.backgroundType === "image"
              ? `url(${profile.theme.backgroundValue}) center/cover no-repeat`
              : profile.theme.backgroundValue,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-10">
        <div className="flex items-end gap-4">
          <div className="h-24 w-24 rounded-2xl border-2 border-white/20 overflow-hidden bg-[color:var(--surface-2)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {profile.avatarUrl && (
              <img
                src={profile.avatarUrl}
                alt={profile.displayName}
                className="h-full w-full object-cover"
              />
            )}
          </div>
          <div className="pb-2">
            <h2 className="text-2xl font-extrabold tracking-tight">
              {profile.displayName}
            </h2>
            <p className="text-white/70 text-sm">@{profile.handle}</p>
          </div>
        </div>

        {profile.theme.bannerText && (
          <div className="mt-4 p-4 rounded-xl border border-white/10 bg-[color:var(--surface-2)]">
            <p className="text-sm text-white/90">{profile.theme.bannerText}</p>
          </div>
        )}

        {/* Featured media */}
        {featured && (
          <div className="mt-5">
            <h3 className="text-sm uppercase tracking-wide text-white/60 mb-2">
              Featured
            </h3>
            {featured}
          </div>
        )}

        {/* Friends */}
        <div className="mt-6">
          <h3 className="text-sm uppercase tracking-wide text-white/60 mb-3">
            Connections
          </h3>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {profile.friends.map((f) => (
              <div
                key={f.handle}
                className="card p-3 text-center hover:scale-[1.01] transition-transform"
                style={{
                  borderColor: profile.theme.highlightColor ?? "#ffffff22",
                }}
              >
                <div className="h-16 w-16 rounded-xl mx-auto overflow-hidden bg-[color:var(--surface-2)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {f.avatarUrl && (
                    <img src={f.avatarUrl} alt={f.displayName} className="h-full w-full object-cover" />
                  )}
                </div>
                <p className="mt-2 text-xs font-semibold line-clamp-1">
                  {f.displayName}
                </p>
                <p className="text-[10px] text-white/60 line-clamp-1">@{f.handle}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}