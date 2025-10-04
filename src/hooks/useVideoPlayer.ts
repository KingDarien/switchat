import { useRef, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface UseVideoPlayerProps {
  postId: string;
  postUserId: string;
  isActive: boolean;
  isIntersecting: boolean;
}

export const useVideoPlayer = ({ 
  postId, 
  postUserId,
  isActive, 
  isIntersecting 
}: UseVideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [hasError, setHasError] = useState(false);
  const viewTrackedRef = useRef(false);
  const watchStartTimeRef = useRef<number>(0);
  const { user } = useAuth();

  // Track video view
  const trackView = useCallback(async () => {
    if (!user || viewTrackedRef.current) return;
    
    try {
      await supabase.from('video_views').insert({
        post_id: postId,
        user_id: user.id,
        watch_duration: 0,
        completed: false
      });
      viewTrackedRef.current = true;
      watchStartTimeRef.current = Date.now();
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  }, [postId, user]);

  // Update watch duration
  const updateWatchDuration = useCallback(async (completed: boolean = false) => {
    if (!user || !viewTrackedRef.current) return;

    const duration = Math.floor((Date.now() - watchStartTimeRef.current) / 1000);
    
    try {
      await supabase
        .from('video_views')
        .update({ 
          watch_duration: duration,
          completed 
        })
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);
    } catch (error) {
      console.error('Error updating watch duration:', error);
    }
  }, [postId, user]);

  // Auto-play management based on visibility
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive && isIntersecting) {
      video.currentTime = 0;
      video.play()
        .then(() => {
          setIsPlaying(true);
          setHasError(false);
          // Track view after 3 seconds of watching
          setTimeout(() => trackView(), 3000);
        })
        .catch((error) => {
          console.error('Playback error:', error);
          setHasError(true);
        });
    } else {
      video.pause();
      setIsPlaying(false);
      if (viewTrackedRef.current) {
        updateWatchDuration();
      }
    }
  }, [isActive, isIntersecting, trackView, updateWatchDuration]);

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleProgress = () => {
      if (video.duration) {
        setProgress((video.currentTime / video.duration) * 100);
      }
    };

    const handleWaiting = () => setIsBuffering(true);
    const handleCanPlay = () => setIsBuffering(false);
    const handleError = () => {
      setHasError(true);
      setIsBuffering(false);
    };
    
    const handleEnded = () => {
      updateWatchDuration(true);
      video.currentTime = 0;
      video.play();
    };

    video.addEventListener('timeupdate', handleProgress);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleProgress);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
      video.removeEventListener('ended', handleEnded);
    };
  }, [updateWatchDuration]);

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

  const retry = () => {
    const video = videoRef.current;
    if (!video) return;
    setHasError(false);
    video.load();
    video.play().then(() => setIsPlaying(true)).catch(console.error);
  };

  return {
    videoRef,
    isPlaying,
    isMuted,
    progress,
    isBuffering,
    hasError,
    togglePlayPause,
    toggleMute,
    retry
  };
};
