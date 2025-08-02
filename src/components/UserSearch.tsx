import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Users, UserPlus, UserMinus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import UserDisplayName from './UserDisplayName';

interface Profile {
  user_id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  current_rank: number | null;
  is_verified: boolean;
  verification_tier: string;
}

interface ProfileWithFollowStatus extends Profile {
  isFollowing: boolean;
  followersCount: number;
  followingCount: number;
}

const UserSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<ProfileWithFollowStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setUsers([]);
      return;
    }

    setLoading(true);
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .neq('user_id', user!.id)
        .limit(10);

      if (error) {
        throw error;
      }

      // Get follow status and counts for each user
      const usersWithStatus = await Promise.all(
        (profiles || []).map(async (profile) => {
          // Check if current user follows this profile
          const { data: followData } = await supabase
            .from('follows')
            .select('id')
            .eq('follower_id', user!.id)
            .eq('following_id', profile.user_id)
            .single();

          // Get followers count
          const { data: followersData } = await supabase
            .from('follows')
            .select('id')
            .eq('following_id', profile.user_id);

          // Get following count
          const { data: followingData } = await supabase
            .from('follows')
            .select('id')
            .eq('follower_id', profile.user_id);

          return {
            ...profile,
            isFollowing: !!followData,
            followersCount: followersData?.length || 0,
            followingCount: followingData?.length || 0,
          };
        })
      );

      setUsers(usersWithStatus);
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

  const toggleFollow = async (targetUserId: string, isCurrentlyFollowing: boolean) => {
    try {
      if (isCurrentlyFollowing) {
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user!.id)
          .eq('following_id', targetUserId);

        if (error) throw error;

        toast({
          title: "Success!",
          description: "Unfollowed user.",
        });
      } else {
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: user!.id,
            following_id: targetUserId,
          });

        if (error) throw error;

        toast({
          title: "Success!",
          description: "Following user.",
        });
      }

      // Refresh the search results
      searchUsers(searchQuery);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      searchUsers(searchQuery);
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchQuery]);

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Discover Users
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users by username or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {loading && (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-center gap-3 p-3">
                <div className="h-10 w-10 bg-muted rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/3"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && users.length === 0 && searchQuery && (
          <p className="text-center text-muted-foreground py-6">
            No users found matching "{searchQuery}"
          </p>
        )}

        {!loading && searchQuery === '' && (
          <p className="text-center text-muted-foreground py-6">
            Start typing to search for users
          </p>
        )}

        <div className="space-y-3">
          {users.map((userProfile) => {
            const displayName = userProfile.display_name || userProfile.username || 'Anonymous';
            
            return (
              <div key={userProfile.user_id} className="flex items-center gap-3 p-3 rounded-lg border">
                <Link to={`/user/${userProfile.user_id}`} className="flex items-center gap-3 flex-1 min-w-0">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={userProfile.avatar_url} />
                    <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
                  </Avatar>
                  
                   <div className="flex-1 min-w-0">
                    <UserDisplayName
                      displayName={displayName}
                      username={userProfile.username || ''}
                      rank={userProfile.current_rank}
                      isVerified={userProfile.is_verified}
                      verificationTier={userProfile.verification_tier}
                    />
                    
                    {userProfile.bio && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {userProfile.bio}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 mt-2">
                      <Badge variant="secondary" className="text-xs">
                        <Users className="h-3 w-3 mr-1" />
                        {userProfile.followersCount} followers
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {userProfile.followingCount} following
                      </Badge>
                    </div>
                  </div>
                </Link>
                
                <Button
                  variant={userProfile.isFollowing ? "outline" : "default"}
                  size="sm"
                  onClick={() => toggleFollow(userProfile.user_id, userProfile.isFollowing)}
                  className="flex items-center gap-2 shrink-0"
                >
                  {userProfile.isFollowing ? (
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
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default UserSearch;