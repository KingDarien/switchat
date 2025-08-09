import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, UserPlus, UserMinus, Calendar, MapPin, Globe, Cake, Music, Heart, Target, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import PostCard from '@/components/PostCard';
import Navbar from '@/components/Navbar';
import UserDisplayName from '@/components/UserDisplayName';
import { BackgroundMusicPlayer } from '@/components/BackgroundMusicPlayer';
import { ProfileStats } from '@/components/ProfileStats';
import UserGoals from '@/components/UserGoals';
import ClosestFriends from '@/components/ClosestFriends';
import { CompactMusicPlayer } from '@/components/CompactMusicPlayer';
import { formatDistanceToNow } from 'date-fns';

interface Profile {
  user_id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  created_at: string;
  current_rank: number | null;
  is_verified: boolean;
  verification_tier: string;
  popularity_score: number;
  trust_score: number;
  goals_completed: number;
  total_contributions_made: number;
  location: string;
  website_url: string;
  birthday: string;
  ethnicity: string;
  background_theme: any;
  background_music_url: string;
  background_music_title: string;
  interests: string[];
  niche_id: string;
  niches?: {
    name: string;
    icon: string;
  };
}

interface Post {
  id: string;
  content: string;
  image_url: string | null;
  video_url: string | null;
  post_type: string;
  created_at: string;
  user_id: string;
  profiles?: Profile;
}

interface Community {
  id: string;
  name: string;
  color: string;
}

const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [videoPosts, setVideoPosts] = useState<Post[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [postsCount, setPostsCount] = useState(0);
  const [likesReceived, setLikesReceived] = useState(0);
  const [commentsReceived, setCommentsReceived] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  const fetchUserData = async () => {
    try {
      // Fetch user profile with niche information
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select(`
          *,
          niches (
            name,
            icon
          )
        `)
        .eq('user_id', userId)
        .single();

      if (profileError) {
        throw profileError;
      }

      setProfile(profileData);

      // Fetch user's posts
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (postsError) {
        throw postsError;
      }

      // Separate posts by type
      const textImagePosts = postsData?.filter(post => post.post_type !== 'video') || [];
      const videoPostsData = postsData?.filter(post => post.post_type === 'video') || [];

      // Add profile data to posts
      const postsWithProfile = textImagePosts.map(post => ({
        ...post,
        profiles: profileData
      }));

      const videoPostsWithProfile = videoPostsData.map(post => ({
        ...post,
        profiles: profileData
      }));

      setPosts(postsWithProfile);
      setVideoPosts(videoPostsWithProfile);
      setPostsCount(postsData?.length || 0);

      // Fetch user's communities
      const { data: userCommunities } = await supabase
        .from('user_communities')
        .select(`
          community_tags (
            id,
            name,
            color
          )
        `)
        .eq('user_id', userId);

      const communityData = userCommunities?.map(uc => uc.community_tags).filter(Boolean) || [];
      setCommunities(communityData);

      // Get engagement stats
      const { data: likesData } = await supabase
        .from('likes')
        .select('id')
        .in('post_id', postsData?.map(p => p.id) || []);

      const { data: commentsData } = await supabase
        .from('comments')
        .select('id')
        .in('post_id', postsData?.map(p => p.id) || []);

      setLikesReceived(likesData?.length || 0);
      setCommentsReceived(commentsData?.length || 0);

      // Check if current user follows this profile
      if (user && user.id !== userId) {
        const { data: followData } = await supabase
          .from('follows')
          .select('id')
          .eq('follower_id', user.id)
          .eq('following_id', userId)
          .single();

        setIsFollowing(!!followData);
      }

      // Get followers count
      const { data: followersData } = await supabase
        .from('follows')
        .select('id')
        .eq('following_id', userId);

      // Get following count
      const { data: followingData } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', userId);

      setFollowersCount(followersData?.length || 0);
      setFollowingCount(followingData?.length || 0);

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleFollow = async () => {
    if (!user || user.id === userId) return;

    try {
      if (isFollowing) {
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', userId);

        if (error) throw error;

        setIsFollowing(false);
        setFollowersCount(prev => prev - 1);
        
        toast({
          title: "Success!",
          description: "Unfollowed user.",
        });
      } else {
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: user.id,
            following_id: userId,
          });

        if (error) throw error;

        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);
        
        toast({
          title: "Success!",
          description: "Following user.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatBirthday = (birthday: string) => {
    if (!birthday) return null;
    const date = new Date(birthday);
    return date.toLocaleDateString('en-US', { 
      month: 'long',
      day: 'numeric'
    });
  };

  const getBackgroundStyle = (theme: any) => {
    if (!theme) return {};
    
    if (theme.type === 'gradient') {
      return {
        background: `linear-gradient(135deg, ${theme.colors.join(', ')})`
      };
    } else if (theme.type === 'solid') {
      return {
        backgroundColor: theme.colors[0]
      };
    }
    
    return {};
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-4xl mx-auto p-4">
          <div className="animate-pulse space-y-6">
            <div className="h-48 bg-muted rounded-lg"></div>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-4xl mx-auto p-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">User not found</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const displayName = profile.display_name || profile.username || 'Anonymous';
  const isOwnProfile = user?.id === userId;

  return (
    <div 
      className="min-h-screen relative"
      style={getBackgroundStyle(profile.background_theme)}
    >
      {/* Background overlay for better text readability */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm"></div>
      
      <div className="relative z-10">
        <Navbar />
        

        <div className="max-w-4xl mx-auto p-4 pb-20 space-y-6">
          {/* Profile Header */}
          <Card className="bg-card/90 backdrop-blur-sm border border-border/50">
            <CardHeader>
              <div className="flex flex-col md:flex-row items-start gap-6">
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                  <div className="flex flex-col items-center">
                    <Avatar className="h-32 w-32 border-4 border-primary/20 flex-shrink-0">
                      <AvatarImage src={profile.avatar_url} />
                      <AvatarFallback className="text-2xl">
                        {getInitials(displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <ClosestFriends userId={userId!} />
                    <CompactMusicPlayer 
                      className="mt-2" 
                      musicUrl={profile.background_music_url}
                      musicTitle={profile.background_music_title}
                    />
                  </div>
                  
                  {/* Background Music Player - responsive width */}
                  {profile.background_music_url && (
                    <div className="w-full max-w-xs sm:max-w-sm md:w-80 p-1 min-w-0">
                      <BackgroundMusicPlayer
                        musicUrl={profile.background_music_url}
                        musicTitle={profile.background_music_title}
                        autoPlay={true}
                      />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 space-y-4">
                  <div>
                    <UserDisplayName
                      displayName={displayName}
                      username={profile.username || ''}
                      rank={profile.current_rank}
                      isVerified={profile.is_verified}
                      verificationTier={profile.verification_tier}
                      className="text-3xl"
                    />
                    
                    {profile.niches && (
                      <Badge variant="secondary" className="mt-2">
                        {profile.niches.icon && (
                          <span className="mr-1">{profile.niches.icon}</span>
                        )}
                        {profile.niches.name}
                      </Badge>
                    )}
                  </div>
                  
                  {profile.bio && (
                    <p className="text-muted-foreground">{profile.bio}</p>
                  )}
                  
                  {/* Personal Info */}
                  <div className="flex flex-wrap gap-3">
                    {profile.location && (
                      <Badge variant="outline" className="text-xs">
                        <MapPin className="h-3 w-3 mr-1" />
                        {profile.location}
                      </Badge>
                    )}
                    
                    {profile.ethnicity && (
                      <Badge variant="outline" className="text-xs">
                        <Heart className="h-3 w-3 mr-1" />
                        {profile.ethnicity}
                      </Badge>
                    )}
                    
                    {profile.birthday && (
                      <Badge variant="outline" className="text-xs">
                        <Cake className="h-3 w-3 mr-1" />
                        {formatBirthday(profile.birthday)}
                      </Badge>
                    )}
                    
                    {profile.website_url && (
                      <Badge variant="outline" className="text-xs">
                        <Globe className="h-3 w-3 mr-1" />
                        <a href={profile.website_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          Website
                        </a>
                      </Badge>
                    )}
                    
                    <Badge variant="outline" className="text-xs">
                      <Calendar className="h-3 w-3 mr-1" />
                      Joined {formatDistanceToNow(new Date(profile.created_at), { addSuffix: true })}
                    </Badge>
                  </div>

                  {/* Interests */}
                  {profile.interests && profile.interests.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Interests</h4>
                      <div className="flex flex-wrap gap-2">
                        {profile.interests.map((interest, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {interest}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Communities */}
                  {communities.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Communities</h4>
                      <div className="flex flex-wrap gap-2">
                        {communities.map((community) => (
                          <Badge 
                            key={community.id} 
                            variant="secondary" 
                            className="text-xs"
                            style={{ backgroundColor: community.color + '20', color: community.color }}
                          >
                            {community.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-4">
                    <Badge variant="secondary" className="text-xs">
                      <Users className="h-3 w-3 mr-1" />
                      {followersCount} followers
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {followingCount} following
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {postsCount} posts
                    </Badge>
                  </div>
                  
                  {!isOwnProfile && user && (
                    <Button
                      variant={isFollowing ? "outline" : "default"}
                      onClick={toggleFollow}
                      className="flex items-center gap-2"
                    >
                      {isFollowing ? (
                        <>
                          <UserMinus className="h-4 w-4" />
                          Unfollow
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4" />
                          Follow
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Featured Media */}
          {(videoPosts.length > 0 || posts.length > 0) && (
            <Card className="bg-card/90 backdrop-blur-sm border border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Featured Media
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <PostCard post={(videoPosts[0] || posts[0]) as any} />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Profile Content */}
          <Tabs defaultValue="posts" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-card/90 backdrop-blur-sm">
              <TabsTrigger value="posts">Posts</TabsTrigger>
              <TabsTrigger value="videos">Videos</TabsTrigger>
              <TabsTrigger value="goals">Goals</TabsTrigger>
              <TabsTrigger value="stats">Stats</TabsTrigger>
            </TabsList>

            <TabsContent value="posts" className="space-y-4">
              <Card className="bg-card/90 backdrop-blur-sm border border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5" />
                    Posts ({posts.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {posts.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      {isOwnProfile ? "You haven't posted anything yet" : "No posts yet"}
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {posts.map((post) => (
                        <PostCard key={post.id} post={post} />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="videos" className="space-y-4">
              <Card className="bg-card/90 backdrop-blur-sm border border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Music className="h-5 w-5" />
                    Videos ({videoPosts.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {videoPosts.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      {isOwnProfile ? "You haven't posted any videos yet" : "No videos yet"}
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {videoPosts.map((post) => (
                        <PostCard key={post.id} post={post} />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="goals" className="space-y-4">
              <Card className="bg-card/90 backdrop-blur-sm border border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Public Goals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isOwnProfile ? (
                    <UserGoals />
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      Public goals will be displayed here when available.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="stats" className="space-y-4">
              <ProfileStats
                followersCount={followersCount}
                followingCount={followingCount}
                postsCount={postsCount}
                likesReceived={likesReceived}
                commentsReceived={commentsReceived}
                goalsCompleted={profile.goals_completed || 0}
                totalContributions={profile.total_contributions_made || 0}
                trustScore={profile.trust_score || 0}
                popularityScore={profile.popularity_score || 0}
                currentRank={profile.current_rank}
                joinedDate={profile.created_at}
                verificationTier={profile.verification_tier}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
