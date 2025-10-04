import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Profile {
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  is_verified: boolean;
  verification_tier: string;
}

export interface VideoPost {
  id: string;
  content: string;
  video_url: string | null;
  duration: number | null;
  user_id: string;
  created_at: string;
  profiles: Profile;
}

export const useVideoFeed = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<VideoPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);

  const fetchVideoPosts = useCallback(async (loadMore: boolean = false) => {
    if (!user) return;

    try {
      setLoading(true);

      // Get following users
      const { data: followingData } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);

      const followingIds = followingData?.map(f => f.following_id) || [];
      const userIds = [...followingIds, user.id];

      // Build query with cursor-based pagination
      let query = supabase
        .from('posts')
        .select('*')
        .eq('post_type', 'video')
        .not('video_url', 'is', null)
        .in('user_id', userIds)
        .order('created_at', { ascending: false })
        .limit(10);

      // Add cursor for pagination
      if (loadMore && cursor) {
        query = query.lt('created_at', cursor);
      }

      const { data: postsData, error } = await query;

      if (error) throw error;

      if (!postsData || postsData.length === 0) {
        setHasMore(false);
        if (!loadMore) setPosts([]);
        return;
      }

      // Fetch profiles
      const userIdsToFetch = [...new Set(postsData.map(post => post.user_id))];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url, is_verified, verification_tier')
        .in('user_id', userIdsToFetch);

      if (profilesError) throw profilesError;

      // Combine data
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

      if (loadMore) {
        setPosts(prev => [...prev, ...postsWithProfiles]);
      } else {
        setPosts(postsWithProfiles);
      }

      // Update cursor and hasMore
      if (postsData.length < 10) {
        setHasMore(false);
      } else {
        setCursor(postsData[postsData.length - 1].created_at);
      }
    } catch (error) {
      console.error('Error fetching video posts:', error);
    } finally {
      setLoading(false);
    }
  }, [user, cursor]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchVideoPosts(true);
    }
  }, [loading, hasMore, fetchVideoPosts]);

  const refresh = useCallback(() => {
    setCursor(null);
    setHasMore(true);
    fetchVideoPosts(false);
  }, [fetchVideoPosts]);

  useEffect(() => {
    fetchVideoPosts();
  }, [user]);

  return {
    posts,
    loading,
    hasMore,
    loadMore,
    refresh
  };
};
