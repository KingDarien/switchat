
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

  return (
    <AnimatePresence mode="wait">
      <motion.div
        className={cn(
          "relative flex flex-col mx-auto rounded-2xl overflow-hidden bg-gradient-to-br from-purple-900/90 via-blue-900/90 to-indigo-900/90 shadow-[0_0_20px_rgba(139,69,255,0.3)] backdrop-blur-sm select-none",
          sizeConfig.padding
        )}
        style={{ 
          width: `${dimensions.width}px`
        }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{
          duration: 0.5,
          ease: "easeInOut",
          type: "spring",
        }}
        layout
      >
        <audio
          ref={audioRef}
          onTimeUpdate={handleTimeUpdate}
          src={musicUrl}
          className="hidden"
        />

        <AnimatePresence mode="wait">
          {!showLyrics ? (
            <motion.div
              key="player"
              className="flex flex-col relative"
              initial={{ opacity: 0, rotateY: -90 }}
              animate={{ opacity: 1, rotateY: 0 }}
              exit={{ opacity: 0, rotateY: 90 }}
              transition={{ duration: 0.6, type: "spring" }}
              layout
            >
              {/* Cover */}
              <motion.div 
                className={cn("bg-white/10 overflow-hidden rounded-[12px] w-full relative mb-1", sizeConfig.coverHeight)}
              >
                <img
                  src="https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=2970&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                  alt="cover"
                  className="object-cover w-full h-full"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              </motion.div>

              <motion.div className={cn("flex flex-col w-full", sizeConfig.gap)}>
                {/* Title & Artist */}
                <div className="text-center">
                  <motion.h3 className={cn("text-white font-bold truncate", sizeConfig.titleSize)}>
                    {musicTitle || 'Music'}
                  </motion.h3>
                  <motion.p className={cn("text-white/70", sizeConfig.titleSize)}>Electronic</motion.p>
                </div>

                {/* Slider */}
                <motion.div className={cn("flex flex-col", sizeConfig.gap)}>
                  <CustomSlider
                    value={progress}
                    onChange={handleSeek}
                    className="w-full"
                  />
                  <div className="flex items-center justify-between">
                    <span className={cn("text-white/80", sizeConfig.timeSize)}>
                      {formatTime(currentTime)}
                    </span>
                    <span className={cn("text-white/80", sizeConfig.timeSize)}>
                      {formatTime(duration)}
                    </span>
                  </div>
                </motion.div>

                {/* Controls */}
                <motion.div className="flex items-center justify-center w-full">
                  <div className={cn("flex items-center w-fit bg-black/20 rounded-[12px] p-1", sizeConfig.controlGap)}>
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsShuffle(!isShuffle)}
                        className={cn(
                          "text-white hover:bg-white/10 hover:text-white rounded-full",
                          sizeConfig.buttonSize,
                          isShuffle && "bg-white/20 text-white"
                        )}
                      >
                        <Shuffle className={sizeConfig.iconSize} />
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn("text-white hover:bg-white/10 hover:text-white rounded-full", sizeConfig.buttonSize)}
                      >
                        <SkipBack className={sizeConfig.iconSize} />
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <Button
                        onClick={togglePlay}
                        variant="ghost"
                        size="icon"
                        className={cn("text-white hover:bg-white/10 hover:text-white rounded-full bg-white/10", sizeConfig.playButtonSize)}
                      >
                        {isPlaying ? (
                          <Pause className={sizeConfig.iconSize} />
                        ) : (
                          <Play className={sizeConfig.iconSize} />
                        )}
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn("text-white hover:bg-white/10 hover:text-white rounded-full", sizeConfig.buttonSize)}
                      >
                        <SkipForward className={sizeConfig.iconSize} />
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsRepeat(!isRepeat)}
                        className={cn(
                          "text-white hover:bg-white/10 hover:text-white rounded-full",
                          sizeConfig.buttonSize,
                          isRepeat && "bg-white/20 text-white"
                        )}
                      >
                        <Repeat className={sizeConfig.iconSize} />
                      </Button>
                    </motion.div>
                  </div>
                </motion.div>

                {/* Function Buttons */}
                <motion.div className={cn(
                  "flex justify-center mt-1",
                  sizeConfig.compactMode ? "flex-col gap-0.5" : "flex-row gap-2"
                )}>
                  {/* Karaoke Button */}
                  <motion.button
                    onClick={toggleLyrics}
                    className={cn(
                      "flex items-center justify-center bg-gradient-to-r from-pink-500/80 to-purple-500/80 hover:from-pink-600/80 hover:to-purple-600/80 text-white rounded-full font-medium transition-all duration-300",
                      sizeConfig.compactMode 
                        ? `${sizeConfig.buttonSize} p-0` 
                        : `gap-1 px-2 py-1 ${sizeConfig.karaokeSize}`
                    )}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title="Toggle Karaoke Mode"
                  >
                    <Mic className={sizeConfig.karaokeIconSize} />
                    {sizeConfig.showLabels && "Karaoke"}
                  </motion.button>

                  {/* Size Control Button */}
                  <motion.button
                    onClick={cycleSizeUp}
                    className={cn(
                      "flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-full font-medium transition-all duration-300",
                      sizeConfig.compactMode 
                        ? `${sizeConfig.buttonSize} p-0` 
                        : `gap-1 px-2 py-1 ${sizeConfig.karaokeSize}`
                    )}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title="Cycle Size"
                  >
                    <Maximize2 className={sizeConfig.karaokeIconSize} />
                    {sizeConfig.showLabels && "Size"}
                  </motion.button>
                </motion.div>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="lyrics"
              className="flex flex-col relative h-[400px]"
              initial={{ opacity: 0, rotateY: 90 }}
              animate={{ opacity: 1, rotateY: 0 }}
              exit={{ opacity: 0, rotateY: -90 }}
              transition={{ duration: 0.6, type: "spring" }}
              layout
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-white font-bold text-lg">{musicTitle || 'Background Music'}</h3>
                  <p className="text-white/70 text-sm">Electronic Music</p>
                </div>
                <motion.button
                  onClick={toggleLyrics}
                  className="text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Music className="h-5 w-5" />
                </motion.button>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <CustomSlider
                  value={progress}
                  onChange={handleSeek}
                  className="w-full"
                />
                <div className="flex items-center justify-between mt-1">
                  <span className="text-white/60 text-xs">
                    {formatTime(currentTime)}
                  </span>
                  <span className="text-white/60 text-xs">
                    {formatTime(duration)}
                  </span>
                </div>
              </div>

              {/* Lyrics Display */}
              <div className="flex-1 overflow-hidden relative">
                <div className="absolute inset-0 overflow-y-auto scrollbar-hide">
                  <div className="space-y-4 p-2">
                    {lyrics.map((lyric, index) => (
                      <motion.div
                        key={index}
                        className={cn(
                          "text-center transition-all duration-500 p-3 rounded-lg",
                          index === currentLyricIndex
                            ? "text-white text-xl font-bold bg-gradient-to-r from-pink-500/20 to-purple-500/20 scale-105 shadow-lg"
                            : index < currentLyricIndex
                            ? "text-white/40 text-lg"
                            : "text-white/60 text-lg"
                        )}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        {lyric.text}
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Mini Controls */}
              <div className="flex items-center justify-center gap-3 mt-4 bg-black/20 rounded-full p-2">
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/10 hover:text-white h-8 w-8 rounded-full"
                  >
                    <SkipBack className="h-4 w-4" />
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <Button
                    onClick={togglePlay}
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/10 hover:text-white h-10 w-10 rounded-full bg-white/10"
                  >
                    {isPlaying ? (
                      <Pause className="h-5 w-5" />
                    ) : (
                      <Play className="h-5 w-5" />
                    )}
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/10 hover:text-white h-8 w-8 rounded-full"
                  >
                    <SkipForward className="h-4 w-4" />
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Resize Handles */}
        {!showLyrics && (
          <>
            {/* Corner resize handles */}
            <div
              className="absolute top-0 right-0 w-4 h-4 cursor-se-resize bg-white/20 hover:bg-white/40 transition-all duration-200 rounded-bl-md"
              onMouseDown={(e) => handleMouseDown(e, 'ne')}
            />
            <div
              className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize bg-white/20 hover:bg-white/40 transition-all duration-200 rounded-tl-md"
              onMouseDown={(e) => handleMouseDown(e, 'se')}
            />
            <div
              className="absolute bottom-0 left-0 w-4 h-4 cursor-sw-resize bg-white/20 hover:bg-white/40 transition-all duration-200 rounded-tr-md"
              onMouseDown={(e) => handleMouseDown(e, 'sw')}
            />
            <div
              className="absolute top-0 left-0 w-4 h-4 cursor-nw-resize bg-white/20 hover:bg-white/40 transition-all duration-200 rounded-br-md"
              onMouseDown={(e) => handleMouseDown(e, 'nw')}
            />
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
