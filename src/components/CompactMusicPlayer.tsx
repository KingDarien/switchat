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
  musicUrl?: string;
  musicTitle?: string;
}

// Default lyrics for when no specific lyrics are available
const getDefaultLyrics = (title: string) => [
  { time: 0, text: `🎵 Now playing: ${title}` },
  { time: 3, text: "🎵 Enjoy the music..." },
  { time: 6, text: "🎵 Let the rhythm move you" },
  { time: 9, text: "🎵 Feel the beat in your heart" },
  { time: 12, text: "🎵 Music brings us together" },
  { time: 15, text: "🎵 Life sounds better with music" }
];

export const CompactMusicPlayer: React.FC<CompactMusicPlayerProps> = ({ 
  className, 
  musicUrl, 
  musicTitle 
}) => {
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

  const currentSong = {
    title: musicTitle || "No music selected",
    url: musicUrl || "",
    lyrics: musicTitle ? getDefaultLyrics(musicTitle) : [{ time: 0, text: "🎵 No music playing..." }]
  };

  const getCurrentLyric = () => {
    return currentSong.lyrics.find((lyric, index) => {
      const nextLyric = currentSong.lyrics[index + 1];
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
      <audio ref={audioRef} src={currentSong.url} />
      
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
              {currentSong.title}
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