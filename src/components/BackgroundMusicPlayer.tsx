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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface LyricLine {
  time: number;
  text: string;
}

interface BackgroundMusicPlayerProps {
  musicUrl?: string;
  musicTitle?: string;
  autoPlay?: boolean;
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

export const BackgroundMusicPlayer: React.FC<BackgroundMusicPlayerProps> = ({
  musicUrl,
  musicTitle,
  autoPlay = false
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

  const lyrics: LyricLine[] = [
    { time: 0, text: "Welcome to the beat" },
    { time: 5, text: "Feel the rhythm flow" },
    { time: 10, text: "Let the music take control" },
    { time: 15, text: "Dance through the night" },
    { time: 20, text: "Everything will be alright" },
    { time: 25, text: "Music is our guide" },
    { time: 30, text: "Let the sound collide" },
    { time: 35, text: "Feel the energy rise" },
    { time: 40, text: "See the magic in your eyes" },
    { time: 45, text: "This is our time to shine" },
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

  if (!musicUrl) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        className="relative flex flex-col mx-auto rounded-3xl overflow-hidden bg-gradient-to-br from-purple-900/90 via-blue-900/90 to-indigo-900/90 shadow-[0_0_30px_rgba(139,69,255,0.3)] backdrop-blur-sm p-4 w-[320px] h-auto"
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
              <motion.div className="bg-white/10 overflow-hidden rounded-[20px] h-[200px] w-full relative mb-4">
                <img
                  src="https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=2970&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                  alt="cover"
                  className="object-cover w-full h-full"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              </motion.div>

              <motion.div className="flex flex-col w-full gap-y-3">
                {/* Title & Artist */}
                <div className="text-center">
                  <motion.h3 className="text-white font-bold text-lg">
                    {musicTitle || 'Background Music'}
                  </motion.h3>
                  <motion.p className="text-white/70 text-sm">Electronic Music</motion.p>
                </div>

                {/* Slider */}
                <motion.div className="flex flex-col gap-y-2">
                  <CustomSlider
                    value={progress}
                    onChange={handleSeek}
                    className="w-full"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-white/80 text-sm">
                      {formatTime(currentTime)}
                    </span>
                    <span className="text-white/80 text-sm">
                      {formatTime(duration)}
                    </span>
                  </div>
                </motion.div>

                {/* Controls */}
                <motion.div className="flex items-center justify-center w-full">
                  <div className="flex items-center gap-2 w-fit bg-black/20 rounded-[20px] p-3">
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsShuffle(!isShuffle)}
                        className={cn(
                          "text-white hover:bg-white/10 hover:text-white h-8 w-8 rounded-full",
                          isShuffle && "bg-white/20 text-white"
                        )}
                      >
                        <Shuffle className="h-4 w-4" />
                      </Button>
                    </motion.div>
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
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsRepeat(!isRepeat)}
                        className={cn(
                          "text-white hover:bg-white/10 hover:text-white h-8 w-8 rounded-full",
                          isRepeat && "bg-white/20 text-white"
                        )}
                      >
                        <Repeat className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  </div>
                </motion.div>

                {/* Karaoke Toggle Button */}
                <motion.div className="flex justify-center mt-2">
                  <motion.button
                    onClick={toggleLyrics}
                    className="flex items-center gap-2 bg-gradient-to-r from-pink-500/80 to-purple-500/80 hover:from-pink-600/80 hover:to-purple-600/80 text-white px-4 py-2 rounded-full font-medium transition-all duration-300"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Mic className="h-4 w-4" />
                    Karaoke Mode
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
      </motion.div>
    </AnimatePresence>
  );
};