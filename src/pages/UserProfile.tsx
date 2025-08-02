import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, UserPlus, UserMinus, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import PostCard from '@/components/PostCard';
import Navbar from '@/components/Navbar';
import UserDisplayName from '@/components/UserDisplayName';
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
}

interface Post {
  id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  user_id: string;
  profiles?: Profile;
}

const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
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
      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
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

      // Add profile data to posts
      const postsWithProfile = postsData?.map(post => ({
        ...post,
        profiles: profileData
      })) || [];

      setPosts(postsWithProfile);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-2xl mx-auto p-4">
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
        <div className="max-w-2xl mx-auto p-4">
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
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-2xl mx-auto p-4 pb-20 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-start gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile.avatar_url} />
                <AvatarFallback className="text-lg">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
              
               <div className="flex-1 space-y-3">
                <div>
                  <UserDisplayName
                    displayName={displayName}
                    username={profile.username || ''}
                    rank={profile.current_rank}
                    isVerified={profile.is_verified}
                    verificationTier={profile.verification_tier}
                    className="text-2xl"
                  />
                </div>
                
                {profile.bio && (
                  <p className="text-sm">{profile.bio}</p>
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
                    <Calendar className="h-3 w-3 mr-1" />
                    Joined {formatDistanceToNow(new Date(profile.created_at), { addSuffix: true })}
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
        
        <div>
          <h2 className="text-xl font-semibold mb-4">
            Posts ({posts.length})
          </h2>
          
          {posts.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  {isOwnProfile ? "You haven't posted anything yet" : "No posts yet"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;