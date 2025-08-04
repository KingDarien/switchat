import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface BackgroundMusicPlayerProps {
  musicUrl?: string;
  musicTitle?: string;
  autoPlay?: boolean;
}

export const BackgroundMusicPlayer: React.FC<BackgroundMusicPlayerProps> = ({
  musicUrl,
  musicTitle,
  autoPlay = false
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem('profile-music-volume');
    return saved ? parseFloat(saved) : 0.3;
  });
  const [isMuted, setIsMuted] = useState(() => {
    const saved = localStorage.getItem('profile-music-muted');
    return saved === 'true';
  });
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Check if user has already interacted with the site
  useEffect(() => {
    const checkForPriorInteraction = () => {
      // Check if there have been any clicks or key presses on the document
      const hasInteracted = document.body.getAttribute('data-user-interacted') === 'true';
      if (hasInteracted || hasUserInteracted) {
        setHasUserInteracted(true);
        if (autoPlay && musicUrl && audioRef.current) {
          attemptAutoPlay();
        }
      }
    };

    checkForPriorInteraction();
  }, [autoPlay, musicUrl]);

  // Set up interaction detection for future interactions
  useEffect(() => {
    const handleUserInteraction = () => {
      setHasUserInteracted(true);
      document.body.setAttribute('data-user-interacted', 'true');
      if (autoPlay && musicUrl && audioRef.current && !isPlaying) {
        attemptAutoPlay();
      }
    };

    if (!hasUserInteracted) {
      document.addEventListener('click', handleUserInteraction, { once: true });
      document.addEventListener('keydown', handleUserInteraction, { once: true });
      document.addEventListener('touchstart', handleUserInteraction, { once: true });
    }

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };
  }, [autoPlay, musicUrl, hasUserInteracted, isPlaying]);

  const attemptAutoPlay = async () => {
    if (!audioRef.current || !musicUrl) return;
    
    try {
      await audioRef.current.play();
      setIsPlaying(true);
      setLoadError(false);
    } catch (error) {
      console.warn('Auto-play failed:', error);
      setLoadError(true);
    }
  };

  const togglePlayPause = () => {
    if (!audioRef.current || !musicUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(console.error);
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    localStorage.setItem('profile-music-muted', newMuted.toString());
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    localStorage.setItem('profile-music-volume', newVolume.toString());
    if (isMuted) {
      setIsMuted(false);
      localStorage.setItem('profile-music-muted', 'false');
    }
  };

  if (!musicUrl) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-card/90 backdrop-blur-sm border rounded-lg p-3 shadow-lg max-w-xs z-50">
      <audio
        ref={audioRef}
        src={musicUrl}
        loop
        onEnded={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
      
      <div className="flex items-center gap-2 mb-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={togglePlayPause}
          className="h-8 w-8 p-0"
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            {musicTitle || 'Background Music'}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleMute}
          className="h-6 w-6 p-0"
        >
          {isMuted ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
        </Button>
        
        <Slider
          value={[isMuted ? 0 : volume]}
          onValueChange={handleVolumeChange}
          max={1}
          step={0.1}
          className="flex-1"
        />
      </div>
    </div>
  );
};