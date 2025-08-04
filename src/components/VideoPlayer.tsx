import { useRef, useEffect, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Heart, MessageCircle, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import VideoComments from './VideoComments';

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
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [profileData, setProfileData] = useState(post.profiles);
  const startY = useRef(0);
  const isDragging = useRef(false);
  const { user } = useAuth();
  const { toast } = useToast();

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

  const fetchLikes = async () => {
    try {
      const { data: likesData, error } = await supabase
        .from('likes')
        .select('*')
        .eq('post_id', post.id);

      if (error) throw error;

      setLikeCount(likesData?.length || 0);
      
      if (user) {
        const userLike = likesData?.find(like => like.user_id === user.id);
        setIsLiked(!!userLike);
      }
    } catch (error) {
      console.error('Error fetching likes:', error);
    }
  };

  const handleLike = async () => {
    if (!user) return;

    try {
      if (isLiked) {
        // Remove like
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id);

        if (error) throw error;
        setIsLiked(false);
        setLikeCount(prev => prev - 1);
      } else {
        // Add like
        const { error } = await supabase
          .from('likes')
          .insert({
            post_id: post.id,
            user_id: user.id,
            emoji: '❤️'
          });

        if (error) throw error;
        setIsLiked(true);
        setLikeCount(prev => prev + 1);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update like",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Video by ${post.profiles.display_name || post.profiles.username}`,
          text: post.content,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link copied!",
          description: "Video link copied to clipboard",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to copy link",
          variant: "destructive",
        });
      }
    }
  };

  const getVerificationBadge = () => {
    if (!profileData?.is_verified) return null;
    
    const { verification_tier } = profileData;
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

  useEffect(() => {
    if (isActive) {
      fetchLikes();
    }
  }, [isActive, post.id]);

  // Listen for real-time profile updates
  useEffect(() => {
    if (!post.profiles?.user_id) return;

    const channel = supabase
      .channel('video-profile-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${post.profiles.user_id}`
        },
        (payload) => {
          setProfileData(payload.new as any);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    }
  }, [post.profiles?.user_id]);

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
          <AvatarImage src={profileData?.avatar_url || ''} />
          <AvatarFallback className="bg-muted">
            {(profileData?.display_name || profileData?.username || 'U')[0]}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">
              {profileData?.display_name || profileData?.username || 'Unknown User'}
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
        
        <div className="flex flex-col items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            className={cn(
              "text-white hover:bg-white/20 p-3 rounded-full transition-colors",
              isLiked && "text-red-500"
            )}
          >
            <Heart className={cn("w-6 h-6", isLiked && "fill-current")} />
          </Button>
          {likeCount > 0 && (
            <span className="text-xs text-white mt-1">{likeCount}</span>
          )}
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowComments(true)}
          className="text-white hover:bg-white/20 p-3 rounded-full"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleShare}
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

      {/* Comments Modal */}
      <VideoComments
        postId={post.id}
        postAuthorId={post.user_id}
        isOpen={showComments}
        onClose={() => setShowComments(false)}
      />
    </div>
  );
};

export default VideoPlayer;