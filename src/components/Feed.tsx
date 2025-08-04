import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import PostCard from './PostCard';
import CreatePost from './CreatePost';
import UserSearch from './UserSearch';
import FeedToggle, { FeedType } from './FeedToggle';
import { LocationData } from './LocationPicker';
import NewsCard from './NewsCard';
import PullToRefresh from './PullToRefresh';

interface Profile {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  current_rank: number | null;
  is_verified: boolean;
  verification_tier: string;
}

interface Post {
  id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  user_id: string;
  profiles?: Profile;
}

const Feed = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedType, setFeedType] = useState<FeedType>('social');
  const [selectedLocation, setSelectedLocation] = useState<LocationData>({ type: 'city', name: 'New York', state: 'New York' });
  const [newsArticles, setNewsArticles] = useState<any[]>([]);
  const [followingUserIds, setFollowingUserIds] = useState<string[]>([]);

  const fetchFollowingUsers = async () => {
    try {
      const { data: follows, error } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', (await supabase.auth.getUser()).data.user?.id);

      if (error) {
        console.error('Error fetching following users:', error);
        return;
      }

      setFollowingUserIds(follows?.map(f => f.following_id) || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchPosts = async () => {
    try {
      // First fetch posts - exclude video posts from regular feed
      let query = supabase
        .from('posts')
        .select('*')
        .neq('post_type', 'video')
        .order('created_at', { ascending: false });

      // Filter by following users if in following mode
      if (feedType === 'following' && followingUserIds.length > 0) {
        query = query.in('user_id', followingUserIds);
      }

      const { data: postsData, error: postsError } = await query;

      if (postsError) {
        console.error('Error fetching posts:', postsError);
        return;
      }

      // Then fetch profiles for those posts
      const userIds = postsData?.map(post => post.user_id) || [];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url, current_rank, is_verified, verification_tier')
        .in('user_id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      }

      // Combine posts with profiles
      const postsWithProfiles = postsData?.map(post => ({
        ...post,
        profiles: profilesData?.find(profile => profile.user_id === post.user_id)
      })) || [];

      setPosts(postsWithProfiles);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNews = async () => {
    try {
      // Call our news API edge function
      const { data, error } = await supabase.functions.invoke('fetch-news', {
        body: { location: selectedLocation }
      });

      if (error) {
        console.error('Error fetching news:', error);
        // Fallback to mock data
        setNewsArticles(getMockNews());
        return;
      }

      setNewsArticles(data?.articles || getMockNews());
    } catch (error) {
      console.error('Error:', error);
      setNewsArticles(getMockNews());
    }
  };

  const getMockNews = () => {
    const locationName = selectedLocation.type === 'city' 
      ? selectedLocation.name 
      : selectedLocation.name;
    
    return [
      {
        title: `${locationName} Community Center Opens New Programs`,
        description: `New educational and wellness programs launched to serve the ${locationName} community with expanded services and facilities.`,
        url: '#',
        urlToImage: '/placeholder.svg',
        publishedAt: new Date().toISOString(),
        source: { name: `${locationName} Tribune` },
        location: selectedLocation.type === 'city' ? `${selectedLocation.name}, ${selectedLocation.state}` : selectedLocation.name
      },
      {
        title: `Weather Alert: ${locationName} Area Conditions Update`,
        description: `Current weather conditions and forecast for the ${locationName} area with important safety information.`,
        url: '#',
        publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        source: { name: 'Weather Service' },
        location: selectedLocation.type === 'city' ? `${selectedLocation.name}, ${selectedLocation.state}` : selectedLocation.name
      }
    ];
  };

  useEffect(() => {
    fetchFollowingUsers();
    fetchPosts();

    // Set up realtime subscription for new posts
    const channel = supabase
      .channel('posts-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts'
        },
        () => {
          fetchPosts();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'posts'
        },
        () => {
          fetchPosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Re-fetch posts when feed type or following list changes
  useEffect(() => {
    if (followingUserIds.length > 0 || feedType === 'social') {
      fetchPosts();
    }
  }, [feedType, followingUserIds]);

  useEffect(() => {
    if (feedType === 'news') {
      fetchNews();
    }
  }, [feedType, selectedLocation]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-32 bg-muted rounded-lg"></div>
        </div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-48 bg-muted rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  const handleRefresh = async () => {
    setLoading(true);
    await fetchFollowingUsers();
    await fetchPosts();
    if (feedType === 'news') {
      await fetchNews();
    }
    setLoading(false);
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <FeedToggle 
          feedType={feedType}
          selectedLocation={selectedLocation}
          onFeedTypeChange={setFeedType}
          onLocationChange={setSelectedLocation}
        />
        
        {feedType !== 'news' && <CreatePost onPostCreated={fetchPosts} />}
        
        <div className="space-y-4 animate-fade-in">
          {feedType === 'news' ? (
            newsArticles.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No news articles available for this location.</p>
              </div>
            ) : (
              newsArticles.map((article, index) => (
                <div key={index} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                  <NewsCard
                    article={article}
                    locationType={selectedLocation.type}
                  />
                </div>
              ))
            )
          ) : feedType === 'following' && followingUserIds.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">You're not following anyone yet. Follow some users to see their posts here!</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {feedType === 'following' 
                  ? "No posts from people you follow yet." 
                  : "No posts yet. Be the first to share something!"
                }
              </p>
            </div>
          ) : (
            posts.map((post, index) => (
              <div key={post.id} className="animate-fade-in hover-scale" style={{ animationDelay: `${index * 0.1}s` }}>
                <PostCard
                  post={post}
                  onLikeToggle={fetchPosts}
                />
              </div>
            ))
          )}
        </div>
      </div>
      
      <div className="hidden lg:block">
        <UserSearch />
      </div>
    </div>
    </PullToRefresh>
  );
};

export default Feed;