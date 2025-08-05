import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Music, Mic, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface LyricLine {
  time: number;
  text: string;
}

interface CompactMusicPlayerProps {
  className?: string;
}

// Sample data for demonstration
const sampleSong = {
  title: "Feel Good Vibes",
  url: "/music/peaceful-ambient.wav",
  lyrics: [
    { time: 0, text: "🎵 Life is beautiful when we're together" },
    { time: 3, text: "🎵 Dancing through the moments that we treasure" },
    { time: 6, text: "🎵 Every heartbeat tells a story" },
    { time: 9, text: "🎵 Every smile lights up the glory" },
    { time: 12, text: "🎵 Feel the rhythm, feel the beat" },
    { time: 15, text: "🎵 Life is good and oh so sweet" }
  ]
};

export const CompactMusicPlayer: React.FC<CompactMusicPlayerProps> = ({ className }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showLyrics, setShowLyrics] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;

    const newTime = (value[0] / 100) * duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const getCurrentLyric = () => {
    return sampleSong.lyrics.find((lyric, index) => {
      const nextLyric = sampleSong.lyrics[index + 1];
      return currentTime >= lyric.time && (!nextLyric || currentTime < nextLyric.time);
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={cn(
      "w-full max-w-[280px] h-16 bg-background/80 backdrop-blur-sm border border-border rounded-lg p-3 transition-all duration-300",
      className
    )}>
      <audio ref={audioRef} src={sampleSong.url} />
      
      {!showLyrics ? (
        // Music Player Mode
        <div className="flex items-center gap-2 h-full">
          <Button
            size="sm"
            variant="ghost"
            onClick={togglePlay}
            className="h-8 w-8 p-0 shrink-0"
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4 ml-0.5" />
            )}
          </Button>

          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-foreground truncate mb-1">
              {sampleSong.title}
            </div>
            <div className="flex items-center gap-2">
              <Slider
                value={[progress]}
                onValueChange={handleSeek}
                max={100}
                step={0.1}
                className="flex-1 h-1"
              />
              <span className="text-xs text-muted-foreground shrink-0">
                {formatTime(currentTime)}
              </span>
            </div>
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowLyrics(true)}
            className="h-8 w-8 p-0 shrink-0"
          >
            <Mic className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        // Karaoke Mode
        <div className="flex items-center gap-2 h-full">
          <Button
            size="sm"
            variant="ghost"
            onClick={togglePlay}
            className="h-8 w-8 p-0 shrink-0"
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4 ml-0.5" />
            )}
          </Button>

          <div className="flex-1 min-w-0 flex items-center">
            <div className="text-xs text-foreground truncate animate-pulse">
              {getCurrentLyric()?.text || "🎵 Music playing..."}
            </div>
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowLyrics(false)}
            className="h-8 w-8 p-0 shrink-0"
          >
            <Music className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
};