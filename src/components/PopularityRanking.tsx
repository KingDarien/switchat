import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Trophy, TrendingUp, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Profile {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  popularity_score: number;
  current_rank: number;
  niche_id: string;
  niches?: {
    name: string;
    icon: string;
  };
}

const PopularityRanking = () => {
  const { user } = useAuth();
  const [userRank, setUserRank] = useState<Profile | null>(null);
  const [topUsers, setTopUsers] = useState<Profile[]>([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchRankingData();
    }
  }, [user]);

  const fetchRankingData = async () => {
    if (!user) return;

    try {
      // Get current user's profile with ranking info
      const { data: userProfile } = await supabase
        .from('profiles')
        .select(`
          *,
          niches (name, icon)
        `)
        .eq('user_id', user.id)
        .single();

      if (userProfile) {
        setUserRank(userProfile);
      }

      // Get follower count
      const { count: followers } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', user.id);

      setFollowerCount(followers || 0);

      // Get top 10 users by popularity
      const { data: topProfiles } = await supabase
        .from('profiles')
        .select(`
          *,
          niches (name, icon)
        `)
        .not('popularity_score', 'is', null)
        .order('popularity_score', { ascending: false })
        .limit(10);

      setTopUsers(topProfiles || []);
    } catch (error) {
      console.error('Error fetching ranking data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
  };

  const getRankDisplay = (rank: number | null) => {
    if (!rank) return 'Unranked';
    if (rank === 1) return '🥇 #1';
    if (rank === 2) return '🥈 #2';  
    if (rank === 3) return '🥉 #3';
    return `#${rank}`;
  };

  const getProgressToNextLevel = (score: number) => {
    const levels = [0, 100, 250, 500, 1000, 2500, 5000, 10000];
    const currentLevel = levels.findIndex(level => score < level);
    const nextLevelThreshold = levels[currentLevel] || levels[levels.length - 1];
    const prevLevelThreshold = levels[currentLevel - 1] || 0;
    
    if (currentLevel === -1) return 100; // Max level reached
    
    const progress = ((score - prevLevelThreshold) / (nextLevelThreshold - prevLevelThreshold)) * 100;
    return Math.min(progress, 100);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Your Ranking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="h-4 bg-muted rounded w-2/3"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* User's Current Ranking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Your Ranking
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={userRank?.avatar_url} />
                <AvatarFallback>{getInitials(userRank?.display_name || '')}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{userRank?.display_name}</p>
                <p className="text-sm text-muted-foreground">
                  {userRank?.niches?.name && (
                    <span className="flex items-center gap-1">
                      <span>{userRank.niches.icon}</span>
                      {userRank.niches.name}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="text-lg font-bold">
              {getRankDisplay(userRank?.current_rank || null)}
            </Badge>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Popularity Score</span>
              <span className="font-semibold">{userRank?.popularity_score || 0}</span>
            </div>
            <Progress value={getProgressToNextLevel(userRank?.popularity_score || 0)} />
            <p className="text-xs text-muted-foreground">
              Keep engaging to improve your ranking!
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-2xl font-bold">{followerCount}</span>
              </div>
              <p className="text-sm text-muted-foreground">Followers</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-2xl font-bold">{userRank?.popularity_score || 0}</span>
              </div>
              <p className="text-sm text-muted-foreground">Score</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Users Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Top Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topUsers.map((profile, index) => (
              <div
                key={profile.user_id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Badge 
                    variant={index < 3 ? "default" : "secondary"}
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                  >
                    {index + 1}
                  </Badge>
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={profile.avatar_url} />
                    <AvatarFallback>{getInitials(profile.display_name || '')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{profile.display_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {profile.niches?.name && (
                        <span className="flex items-center gap-1">
                          <span>{profile.niches.icon}</span>
                          {profile.niches.name}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">{profile.popularity_score}</p>
                  <p className="text-xs text-muted-foreground">score</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PopularityRanking;