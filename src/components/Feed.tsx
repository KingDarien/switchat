import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import PostCard from './PostCard';
import CreatePost from './CreatePost';
import UserSearch from './UserSearch';
import FeedToggle, { FeedType, NewsLocation } from './FeedToggle';
import NewsCard from './NewsCard';

interface Profile {
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
  const [newsLocation, setNewsLocation] = useState<NewsLocation>('local');
  const [newsArticles, setNewsArticles] = useState<any[]>([]);

  const fetchPosts = async () => {
    try {
      // First fetch posts
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

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
    // Mock news data for demonstration
    const mockNews = [
      {
        title: `${newsLocation === 'local' ? 'Local' : newsLocation === 'city' ? 'City' : 'State'} Community Center Opens New Programs`,
        description: `New educational and wellness programs launched to serve the ${newsLocation} community with expanded services and facilities.`,
        url: '#',
        urlToImage: '/placeholder.svg',
        publishedAt: new Date().toISOString(),
        source: { name: `${newsLocation.charAt(0).toUpperCase() + newsLocation.slice(1)} News` },
        location: newsLocation === 'local' ? 'Downtown Area' : newsLocation === 'city' ? 'City Center' : 'State Capital'
      },
      {
        title: `Weather Alert: ${newsLocation === 'state' ? 'Statewide' : 'Local'} Conditions Update`,
        description: `Current weather conditions and forecast for the ${newsLocation} area with important safety information.`,
        url: '#',
        publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        source: { name: 'Weather Service' },
        location: newsLocation === 'local' ? 'Your Area' : newsLocation === 'city' ? 'Metro Area' : 'State Region'
      }
    ];
    setNewsArticles(mockNews);
  };

  useEffect(() => {
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

  useEffect(() => {
    if (feedType === 'news') {
      fetchNews();
    }
  }, [feedType, newsLocation]);

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

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <FeedToggle 
          feedType={feedType}
          newsLocation={newsLocation}
          onFeedTypeChange={setFeedType}
          onNewsLocationChange={setNewsLocation}
        />
        
        {feedType !== 'news' && <CreatePost onPostCreated={fetchPosts} />}
        
        <div className="space-y-4">
          {feedType === 'news' ? (
            newsArticles.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No news articles available for this location.</p>
              </div>
            ) : (
              newsArticles.map((article, index) => (
                <NewsCard
                  key={index}
                  article={article}
                  locationType={newsLocation}
                />
              ))
            )
          ) : posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No posts yet. Be the first to share something!</p>
            </div>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onLikeToggle={fetchPosts}
              />
            ))
          )}
        </div>
      </div>
      
      <div className="hidden lg:block">
        <UserSearch />
      </div>
    </div>
  );
};

export default Feed;