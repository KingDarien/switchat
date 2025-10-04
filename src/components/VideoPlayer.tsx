import { useRef, useEffect, useState, lazy, Suspense } from 'react';
import { Play, Volume2, VolumeX, Heart, MessageCircle, Share, Bookmark, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useVideoPlayer } from '@/hooks/useVideoPlayer';
import UserDisplayName from './UserDisplayName';
import VideoStats from './VideoStats';
import DoubleTapLike from './DoubleTapLike';
import VideoDescription from './VideoDescription';

// Lazy load comments for better performance
const VideoComments = lazy(() => import('./VideoComments'));
const AnimatedReaction = lazy(() => import('./AnimatedReaction'));

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
  const { user } = useAuth();
  const { toast } = useToast();
  const { targetRef, isIntersecting } = useIntersectionObserver({ threshold: 0.7 });
  
  const {
    videoRef,
    isPlaying,
    isMuted,
    progress,
    isBuffering,
    hasError,
    togglePlayPause,
    toggleMute,
    retry
  } = useVideoPlayer({
    postId: post.id,
    postUserId: post.user_id,
    isActive,
    isIntersecting
  });

  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [profileData, setProfileData] = useState(post.profiles);
  const [showReactionAnimation, setShowReactionAnimation] = useState(false);
  const [animatedEmoji, setAnimatedEmoji] = useState('');
  const startY = useRef(0);
  const isDragging = useRef(false);

  // Fetch likes and saved status
  useEffect(() => {
    if (!isActive || !user) return;

    const fetchInteractions = async () => {
      try {
        // Fetch likes
        const { data: likesData } = await supabase
          .from('likes')
          .select('*')
          .eq('post_id', post.id);

        setLikeCount(likesData?.length || 0);
        const userLike = likesData?.find(like => like.user_id === user.id);
        setIsLiked(!!userLike);

        // Fetch saved status
        const { data: savedData } = await supabase
          .from('saved_videos')
          .select('*')
          .eq('post_id', post.id)
          .eq('user_id', user.id)
          .maybeSingle();

        setIsSaved(!!savedData);
      } catch (error) {
        console.error('Error fetching interactions:', error);
      }
    };

    fetchInteractions();
  }, [isActive, post.id, user]);

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
        await supabase
          .from('likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id);

        setIsLiked(false);
        setLikeCount(prev => prev - 1);
      } else {
        await supabase
          .from('likes')
          .insert({
            post_id: post.id,
            user_id: user.id,
            emoji: '❤️'
          });

        setIsLiked(true);
        setLikeCount(prev => prev + 1);
        setAnimatedEmoji('❤️');
        setShowReactionAnimation(true);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update like",
        variant: "destructive",
      });
    }
  };

  const handleDoubleTapLike = () => {
    if (!isLiked) {
      handleLike();
    }
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      if (isSaved) {
        await supabase
          .from('saved_videos')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id);

        setIsSaved(false);
        toast({ title: "Removed from saved videos" });
      } else {
        await supabase
          .from('saved_videos')
          .insert({
            post_id: post.id,
            user_id: user.id
          });

        setIsSaved(true);
        toast({ title: "Saved to your collection" });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save video",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Video by ${post.profiles.display_name || post.profiles.username}`,
          text: post.content,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link copied!",
          description: "Video link copied to clipboard",
        });
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        toast({
          title: "Error",
          description: "Failed to share video",
          variant: "destructive",
        });
      }
    }
  };

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

  // Format duration
  const formatDuration = (seconds: number | null): string => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div ref={targetRef} className="relative h-full w-full bg-black flex items-center justify-center">
      <DoubleTapLike onDoubleTap={handleDoubleTapLike}>
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
        />
      </DoubleTapLike>

      {/* Buffering Overlay */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <Loader2 className="w-12 h-12 text-white animate-spin" />
        </div>
      )}

      {/* Error Overlay */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm gap-4">
          <p className="text-white text-lg">Failed to load video</p>
          <Button
            onClick={retry}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Tap to retry
          </Button>
        </div>
      )}

      {/* Duration Badge */}
      {post.duration && (
        <div className="absolute top-4 right-4 px-2 py-1 bg-black/70 backdrop-blur-sm rounded text-white text-xs font-medium">
          {formatDuration(post.duration)}
        </div>
      )}

      {/* Play/Pause Tap Indicator */}
      {!isPlaying && !hasError && !isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-black/40 backdrop-blur-sm p-4 rounded-full animate-pulse">
            <Play className="w-12 h-12 text-white" />
          </div>
        </div>
      )}

      {/* Gradient Overlay for Readability */}
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 via-black/30 to-transparent pointer-events-none" />

      {/* Progress Bar */}
      <div className="absolute bottom-20 left-4 right-20 h-1 bg-white/20 rounded-full overflow-hidden">
        <div 
          className="h-full bg-white rounded-full transition-all duration-100 shadow-lg"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* User Info */}
      <div className="absolute bottom-24 left-4 right-20 flex items-start gap-3">
        <Avatar className="w-12 h-12 border-2 border-white shadow-lg">
          <AvatarImage src={profileData?.avatar_url || ''} />
          <AvatarFallback className="bg-muted">
            {(profileData?.display_name || profileData?.username || 'U')[0]}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col flex-1">
          <UserDisplayName
            displayName={profileData?.display_name || 'Unknown User'}
            username={profileData?.username || 'user'}
            userId={profileData?.user_id}
            isVerified={profileData?.is_verified}
            verificationTier={profileData?.verification_tier}
            variant="video"
            size="sm"
            showRank={false}
          />
          <VideoDescription content={post.content} />
        </div>
      </div>

      {/* Modern Controls with Stats */}
      <div className="absolute right-4 bottom-20 flex flex-col gap-3">
        {/* Mute Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleMute}
          className="text-white hover:bg-white/20 backdrop-blur-sm p-3 rounded-full transition-all hover:scale-110"
        >
          {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
        </Button>
        
        {/* Stats */}
        <VideoStats postId={post.id} likeCount={likeCount} />
        
        {/* Like Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLike}
          className={cn(
            "text-white hover:bg-white/20 backdrop-blur-sm p-3 rounded-full transition-all hover:scale-110",
            isLiked && "text-red-500"
          )}
        >
          <Heart className={cn("w-7 h-7", isLiked && "fill-current animate-pulse")} />
        </Button>
        
        {/* Comments Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowComments(true)}
          className="text-white hover:bg-white/20 backdrop-blur-sm p-3 rounded-full transition-all hover:scale-110"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
        
        {/* Save Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSave}
          className={cn(
            "text-white hover:bg-white/20 backdrop-blur-sm p-3 rounded-full transition-all hover:scale-110",
            isSaved && "text-accent"
          )}
        >
          <Bookmark className={cn("w-6 h-6", isSaved && "fill-current")} />
        </Button>
        
        {/* Share Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleShare}
          className="text-white hover:bg-white/20 backdrop-blur-sm p-3 rounded-full transition-all hover:scale-110"
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

      {/* Comments Modal - Lazy Loaded */}
      {showComments && (
        <Suspense fallback={<div className="absolute inset-0 bg-black/50 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-white" /></div>}>
          <VideoComments
            postId={post.id}
            postAuthorId={post.user_id}
            isOpen={showComments}
            onClose={() => setShowComments(false)}
          />
        </Suspense>
      )}

      {/* Reaction Animation - Lazy Loaded */}
      {showReactionAnimation && (
        <Suspense fallback={null}>
          <AnimatedReaction
            emoji={animatedEmoji}
            show={showReactionAnimation}
            onComplete={() => setShowReactionAnimation(false)}
          />
        </Suspense>
      )}
    </div>
  );
};

export default VideoPlayer;