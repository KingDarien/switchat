import { useRef, useEffect, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Heart, MessageCircle, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Profile {
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  is_verified: boolean;
  verification_tier: string;
}

interface Post {
  id: string;
  content: string;
  video_url: string | null;
  duration: number | null;
  user_id: string;
  created_at: string;
  profiles: Profile;
}

interface VideoPlayerProps {
  post: Post;
  isActive: boolean;
  onScroll: (direction: 'up' | 'down') => void;
  canScrollUp: boolean;
  canScrollDown: boolean;
}

const VideoPlayer = ({ post, isActive, onScroll, canScrollUp, canScrollDown }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const startY = useRef(0);
  const isDragging = useRef(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive) {
      video.currentTime = 0;
      video.play().then(() => setIsPlaying(true)).catch(console.error);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, [isActive]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateProgress = () => {
      if (video.duration) {
        setProgress((video.currentTime / video.duration) * 100);
      }
    };

    const handleEnded = () => {
      video.currentTime = 0;
      video.play();
    };

    video.addEventListener('timeupdate', updateProgress);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', updateProgress);
      video.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
    isDragging.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (Math.abs(e.touches[0].clientY - startY.current) > 10) {
      isDragging.current = true;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isDragging.current) {
      const deltaY = e.changedTouches[0].clientY - startY.current;
      
      if (Math.abs(deltaY) > 50) {
        if (deltaY > 0 && canScrollUp) {
          onScroll('up');
        } else if (deltaY < 0 && canScrollDown) {
          onScroll('down');
        }
      }
    } else {
      // Single tap to play/pause
      togglePlayPause();
    }
    isDragging.current = false;
  };

  const getVerificationBadge = () => {
    if (!post.profiles.is_verified) return null;
    
    const { verification_tier } = post.profiles;
    const colors = {
      diamond: 'bg-gradient-to-r from-blue-400 to-purple-400',
      gold: 'bg-gradient-to-r from-yellow-400 to-orange-400',
      silver: 'bg-gradient-to-r from-gray-300 to-gray-400',
      bronze: 'bg-gradient-to-r from-orange-300 to-orange-500'
    };
    
    return (
      <Badge className={cn('text-xs text-white border-0', colors[verification_tier as keyof typeof colors] || colors.bronze)}>
        ✓
      </Badge>
    );
  };

  if (!post.video_url) return null;

  return (
    <div className="relative h-full w-full bg-black flex items-center justify-center">
      <video
        ref={videoRef}
        src={post.video_url}
        muted={isMuted}
        loop
        playsInline
        className="h-full w-full object-cover"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={togglePlayPause}
      />

      {/* Play/Pause Overlay */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <Button
            variant="ghost"
            size="lg"
            onClick={togglePlayPause}
            className="text-white hover:bg-white/20 p-4 rounded-full"
          >
            <Play className="w-12 h-12" />
          </Button>
        </div>
      )}

      {/* Progress Bar */}
      <div className="absolute bottom-20 left-4 right-20 h-1 bg-white/30 rounded-full">
        <div 
          className="h-full bg-primary rounded-full transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* User Info */}
      <div className="absolute bottom-24 left-4 flex items-center gap-3 text-white">
        <Avatar className="w-12 h-12 border-2 border-white">
          <AvatarImage src={post.profiles.avatar_url || ''} />
          <AvatarFallback className="bg-muted">
            {(post.profiles.display_name || post.profiles.username || 'U')[0]}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">
              {post.profiles.display_name || post.profiles.username || 'Unknown User'}
            </span>
            {getVerificationBadge()}
          </div>
          <p className="text-xs text-white/80 max-w-xs truncate">
            {post.content}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="absolute right-4 bottom-20 flex flex-col gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleMute}
          className="text-white hover:bg-white/20 p-3 rounded-full"
        >
          {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/20 p-3 rounded-full"
        >
          <Heart className="w-6 h-6" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/20 p-3 rounded-full"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/20 p-3 rounded-full"
        >
          <Share className="w-6 h-6" />
        </Button>
      </div>

      {/* Scroll Indicators */}
      {canScrollUp && (
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2 text-white/60 animate-bounce">
          ↑
        </div>
      )}
      {canScrollDown && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white/60 animate-bounce">
          ↓
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;