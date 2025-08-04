
import React, { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Music,
  Mic,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface LyricLine {
  time: number;
  text: string;
}

type PlayerSize = 'small' | 'medium' | 'large';

interface BackgroundMusicPlayerProps {
  musicUrl?: string;
  musicTitle?: string;
  autoPlay?: boolean;
  lyrics?: LyricLine[];
}

const formatTime = (seconds: number = 0) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

const CustomSlider = ({
  value,
  onChange,
  className,
}: {
  value: number;
  onChange: (value: number) => void;
  className?: string;
}) => {
  return (
    <motion.div
      className={cn(
        "relative w-full h-1 bg-white/20 rounded-full cursor-pointer",
        className
      )}
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = (x / rect.width) * 100;
        onChange(Math.min(Math.max(percentage, 0), 100));
      }}
    >
      <motion.div
        className="absolute top-0 left-0 h-full bg-white rounded-full"
        style={{ width: `${value}%` }}
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      />
    </motion.div>
  );
};

const getSizeFromDimensions = (width: number, height: number): PlayerSize => {
  if (width <= 130) return 'small';
  if (width <= 200) return 'medium';
  return 'large';
};

const getSizeConfig = (width: number, height: number) => {
  const size = getSizeFromDimensions(width, height);
  const isVerySmall = width < 140;
  const coverHeight = isVerySmall ? 30 : width < 200 ? 40 : 50;
  
  switch (size) {
    case 'small':
      return {
        titleSize: isVerySmall ? 'text-[9px]' : 'text-xs',
        timeSize: 'text-[9px]',
        iconSize: isVerySmall ? 'h-2.5 w-2.5' : 'h-3 w-3',
        buttonSize: isVerySmall ? 'h-4 w-4' : 'h-5 w-5',
        playButtonSize: isVerySmall ? 'h-5 w-5' : 'h-6 w-6',
        karaokeSize: 'text-[9px]',
        karaokeIconSize: 'h-2 w-2',
        padding: 'p-1',
        gap: 'gap-y-0.5',
        controlGap: 'gap-0.5',
        coverHeight: `h-[${coverHeight}px]`,
        showLabels: false, // Never show labels in small mode
        compactMode: true,
        showFunctionButtons: true, // Always show function buttons
      };
    case 'medium':
      return {
        titleSize: 'text-sm',
        timeSize: 'text-xs',
        iconSize: 'h-4 w-4',
        buttonSize: 'h-7 w-7',
        playButtonSize: 'h-9 w-9',
        karaokeSize: 'text-xs',
        karaokeIconSize: 'h-3 w-3',
        padding: 'p-2.5',
        gap: 'gap-y-1.5',
        controlGap: 'gap-1.5',
        coverHeight: `h-[${coverHeight}px]`,
        showLabels: true,
        compactMode: false,
        showFunctionButtons: true,
      };
    case 'large':
      return {
        titleSize: 'text-base',
        timeSize: 'text-sm',
        iconSize: 'h-5 w-5',
        buttonSize: 'h-9 w-9',
        playButtonSize: 'h-11 w-11',
        karaokeSize: 'text-sm',
        karaokeIconSize: 'h-4 w-4',
        padding: 'p-4',
        gap: 'gap-y-3',
        controlGap: 'gap-2',
        coverHeight: `h-[${coverHeight}px]`,
        showLabels: true,
        compactMode: false,
        showFunctionButtons: true,
      };
  }
};

export const BackgroundMusicPlayer: React.FC<BackgroundMusicPlayerProps> = ({
  musicUrl,
  musicTitle,
  autoPlay = false,
  lyrics: providedLyrics
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [currentLyricIndex, setCurrentLyricIndex] = useState(-1);
  
  // Adjustable dimensions - only track width, let height be auto
  const [dimensions, setDimensions] = useState({ width: 320 });
  const [isResizing, setIsResizing] = useState(false);

  const sizeConfig = getSizeConfig(dimensions.width, 0);
  const size = getSizeFromDimensions(dimensions.width, 0);

  // Use provided lyrics or default message for instrumental music
  const lyrics = providedLyrics || [
    { time: 0, text: "🎵 Instrumental Music 🎵" },
    { time: 5, text: "No lyrics available for this track" },
    { time: 10, text: "Enjoy the beautiful sounds" }
  ];

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const progress =
        (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setProgress(isFinite(progress) ? progress : 0);
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration);

      // Update current lyric
      const currentLyric = lyrics.findIndex(
        (lyric, index) =>
          audioRef.current!.currentTime >= lyric.time &&
          (index === lyrics.length - 1 ||
            audioRef.current!.currentTime < lyrics[index + 1].time)
      );
      setCurrentLyricIndex(currentLyric);
    }
  };

  const handleSeek = (value: number) => {
    if (audioRef.current && audioRef.current.duration) {
      const time = (value / 100) * audioRef.current.duration;
      if (isFinite(time)) {
        audioRef.current.currentTime = time;
        setProgress(value);
      }
    }
  };

  const toggleLyrics = () => {
    setShowLyrics(!showLyrics);
  };

  const cycleSizeUp = () => {
    const widths = [320, 250, 180, 110];
    const currentIndex = widths.indexOf(dimensions.width);
    const nextIndex = (currentIndex + 1) % widths.length;
    setDimensions({ width: widths[nextIndex] });
  };

  const handleMouseDown = (e: React.MouseEvent, direction: 'se' | 'sw' | 'ne' | 'nw') => {
    e.preventDefault();
    setIsResizing(true);
    
    const startX = e.clientX;
    const startWidth = dimensions.width;
    
    const handleMouseMove = (e: MouseEvent) => {
      let newWidth = startWidth;
      
      if (direction.includes('e')) {
        newWidth = Math.max(110, startWidth + (e.clientX - startX));
      }
      if (direction.includes('w')) {
        newWidth = Math.max(110, startWidth - (e.clientX - startX));
      }
      
      setDimensions({ 
        width: Math.min(400, Math.max(110, Math.round(newWidth)))
      });
    };
    
    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  if (!musicUrl) return null;

  return null;
};
