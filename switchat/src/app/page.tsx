"use client";

import { useMemo, useState } from "react";
import { BrandHeader } from "@/components/BrandHeader";
import { FeedTabs, type FeedKey } from "@/components/FeedTabs";
import { SwipePager } from "@/components/SwipePager";
import { VoiceFeed } from "@/components/feeds/VoiceFeed";
import { VideoFeed } from "@/components/feeds/VideoFeed";
import { TextFeed } from "@/components/feeds/TextFeed";
import { audioPosts, textPosts, videoPosts } from "@/data/mock";
import { NavBar } from "./(navigation)/NavBar";

export default function Home() {
  const [active, setActive] = useState<FeedKey>("voice");
  const index = useMemo(() => (active === "voice" ? 0 : active === "video" ? 1 : 2), [active]);

  return (
    <div className="font-sans min-h-screen">
      <BrandHeader />
      <NavBar />

      <div className="max-w-5xl mx-auto px-4 mt-4">
        <FeedTabs
          active={active}
          onChange={(key) => setActive(key)}
        />
      </div>

      <div className="max-w-5xl mx-auto mt-4">
        <SwipePager
          index={index}
          onIndexChange={(i) => setActive(i === 0 ? "voice" : i === 1 ? "video" : "posts")}
        >
          <VoiceFeed posts={audioPosts} />
          <VideoFeed posts={videoPosts} />
          <TextFeed posts={textPosts} />
        </SwipePager>
      </div>
    </div>
  );
}
