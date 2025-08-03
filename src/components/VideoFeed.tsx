import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import VideoPlayer from './VideoPlayer';
import { toast } from 'sonner';

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

const VideoFeed = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchVideoPosts = useCallback(async () => {
    if (!user) return;

    try {
      // Get users the current user is following
      const { data: followingData } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);

      const followingIds = followingData?.map(f => f.following_id) || [];
      
      // Include the user's own posts
      const userIds = [...followingIds, user.id];

        // Fetch video posts and profile data separately
        const { data: postsData, error } = await supabase
          .from('posts')
          .select('*')
          .eq('post_type', 'video')
          .not('video_url', 'is', null)
          .in('user_id', userIds)
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) throw error;

        if (!postsData || postsData.length === 0) {
          setPosts([]);
          return;
        }

        // Get profile data for the post authors
        const userIdsToFetch = [...new Set(postsData.map(post => post.user_id))];
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, username, display_name, avatar_url, is_verified, verification_tier')
          .in('user_id', userIdsToFetch);

        if (profilesError) throw profilesError;

        // Combine posts with profile data
        const postsWithProfiles = postsData.map(post => {
          const profile = profilesData?.find(p => p.user_id === post.user_id);
          return {
            ...post,
            profiles: profile || {
              user_id: post.user_id,
              username: null,
              display_name: null,
              avatar_url: null,
              is_verified: false,
              verification_tier: 'none'
            }
          };
        });

        setPosts(postsWithProfiles);
    } catch (error) {
      console.error('Error fetching video posts:', error);
      toast.error('Failed to load videos');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchVideoPosts();
  }, [fetchVideoPosts]);

  const handleScroll = useCallback((direction: 'up' | 'down') => {
    if (direction === 'down' && currentIndex < posts.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (direction === 'up' && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex, posts.length]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading videos...</div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background p-8 text-center">
        <h3 className="text-xl font-semibold mb-2">No Videos Yet</h3>
        <p className="text-muted-foreground mb-4">
          Follow more users or create your first video to see content here
        </p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="h-screen overflow-hidden bg-background relative"
    >
      <div 
        className="flex flex-col transition-transform duration-300 ease-out"
        style={{
          transform: `translateY(-${currentIndex * 100}vh)`,
          height: `${posts.length * 100}vh`
        }}
      >
        {posts.map((post, index) => (
          <div key={post.id} className="h-screen flex-shrink-0">
            <VideoPlayer
              post={post}
              isActive={index === currentIndex}
              onScroll={handleScroll}
              canScrollUp={currentIndex > 0}
              canScrollDown={currentIndex < posts.length - 1}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default VideoFeed;