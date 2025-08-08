import type { AudioPost } from "@/components/posts/AudioPostCard";
import type { VideoPost } from "@/components/posts/VideoPostCard";
import type { TextPost } from "@/components/posts/TextPostCard";

export const audioPosts: AudioPost[] = [
  {
    id: "a1",
    author: "Neon Comet",
    avatarUrl: "https://i.pravatar.cc/100?img=12",
    timestamp: "2h",
    text: "Late night thoughts about design and music.",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    duration: "2:34",
  },
  {
    id: "a2",
    author: "Echo Mirage",
    avatarUrl: "https://i.pravatar.cc/100?img=32",
    timestamp: "4h",
    text: "Morning update: shipping a small feature today!",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
  },
];

export const videoPosts: VideoPost[] = [
  {
    id: "v1",
    author: "Solar Pulse",
    avatarUrl: "https://i.pravatar.cc/100?img=5",
    caption: "City lights and synth vibes.",
    videoUrl:
      "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    timestamp: "3h",
  },
  {
    id: "v2",
    author: "Aurora Drift",
    avatarUrl: "https://i.pravatar.cc/100?img=20",
    caption: "Minimal beats for focus.",
    videoUrl:
      "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    timestamp: "6h",
  },
];

export const textPosts: TextPost[] = [
  {
    id: "t1",
    author: "Pixel Wisp",
    avatarUrl: "https://i.pravatar.cc/100?img=15",
    timestamp: "1h",
    text: "Exploring bright gradients and bold type for SWITCHAT!",
    imageUrl:
      "https://images.unsplash.com/photo-1520975928316-56f2d75c6a0a?q=80&w=1200&auto=format&fit=crop",
    comments: [
      { id: "c1", author: "Neon Comet", text: "Loving this direction!" },
    ],
  },
  {
    id: "t2",
    author: "Luna K.",
    avatarUrl: "https://i.pravatar.cc/100?img=38",
    timestamp: "5h",
    text: "Nostalgia meets modern performance. What would your profile look like?",
  },
];

export interface ProfileTheme {
  backgroundType: "color" | "image";
  backgroundValue: string;
  bannerText?: string;
  highlightColor?: string;
}

export interface ProfileData {
  handle: string;
  displayName: string;
  bio: string;
  avatarUrl?: string;
  featuredType?: "voice" | "video" | "post";
  featuredId?: string;
  friends: { handle: string; displayName: string; avatarUrl?: string }[];
  theme: ProfileTheme;
}

export const demoProfile: ProfileData = {
  handle: "neoncomet",
  displayName: "Neon Comet",
  bio: "Designer • Producer • Night runner",
  avatarUrl: "https://i.pravatar.cc/100?img=12",
  featuredType: "voice",
  featuredId: "a1",
  friends: [
    { handle: "auroradrift", displayName: "Aurora Drift", avatarUrl: "https://i.pravatar.cc/100?img=20" },
    { handle: "pixelwisp", displayName: "Pixel Wisp", avatarUrl: "https://i.pravatar.cc/100?img=15" },
    { handle: "solarpulse", displayName: "Solar Pulse", avatarUrl: "https://i.pravatar.cc/100?img=5" },
  ],
  theme: {
    backgroundType: "image",
    backgroundValue:
      "https://images.unsplash.com/photo-1552084117-56a987666844?q=80&w=1200&auto=format&fit=crop",
    bannerText: "Welcome to my corner of SWITCHAT",
    highlightColor: "#7b6cff",
  },
};