import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lightbulb, TrendingUp, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface GrowthTip {
  id: string;
  title: string;
  description: string;
  tip_type: string;
  min_followers: number;
  max_followers: number | null;
}

interface Profile {
  niche_id: string;
  popularity_score: number;
  niches?: {
    name: string;
    icon: string;
  };
}

const GrowthTips = () => {
  const { user } = useAuth();
  const [tips, setTips] = useState<GrowthTip[]>([]);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [followerCount, setFollowerCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchGrowthTips();
    }
  }, [user]);

  const fetchGrowthTips = async () => {
    if (!user) return;

    try {
      // Get user profile and niche
      const { data: profile } = await supabase
        .from('profiles')
        .select(`
          niche_id,
          popularity_score,
          niches (name, icon)
        `)
        .eq('user_id', user.id)
        .single();

      setUserProfile(profile);

      // Get follower count for better tip targeting
      const { count: followers } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', user.id);

      setFollowerCount(followers || 0);

      // Get relevant growth tips
      let tipsQuery = supabase
        .from('growth_tips')
        .select('*')
        .eq('is_active', true);

      // Filter by niche if user has one
      if (profile?.niche_id) {
        tipsQuery = tipsQuery.eq('niche_id', profile.niche_id);
      }

      // Filter by follower count
      tipsQuery = tipsQuery
        .lte('min_followers', followers || 0)
        .or(`max_followers.is.null,max_followers.gte.${followers || 0}`)
        .limit(6);

      const { data: growthTips } = await tipsQuery;

      setTips(growthTips || []);
    } catch (error) {
      console.error('Error fetching growth tips:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTipTypeColor = (type: string) => {
    const colors = {
      general: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      content: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      networking: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      business: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    };
    return colors[type as keyof typeof colors] || colors.general;
  };

  const getTipTypeIcon = (type: string) => {
    switch (type) {
      case 'content':
        return '📝';
      case 'networking':
        return '🤝';
      case 'business':
        return '💼';
      default:
        return '💡';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Growth Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-full"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!userProfile?.niche_id && tips.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            Growth Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Select Your Niche First</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Choose your niche in your profile to get personalized growth tips!
            </p>
            <Button variant="outline" onClick={() => window.location.href = '/profile'}>
              Update Profile
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary" />
          Growth Tips
          {userProfile?.niches && (
            <Badge variant="secondary" className="ml-2">
              <span className="mr-1">{userProfile.niches.icon}</span>
              {userProfile.niches.name}
            </Badge>
          )}
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={fetchGrowthTips}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="mb-4 p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span>
              You have <strong>{followerCount}</strong> followers and a popularity score of{' '}
              <strong>{userProfile?.popularity_score || 0}</strong>
            </span>
          </div>
        </div>

        <div className="space-y-4">
          {tips.map((tip) => (
            <div key={tip.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <span>{getTipTypeIcon(tip.tip_type)}</span>
                  {tip.title}
                </h3>
                <Badge className={getTipTypeColor(tip.tip_type)}>
                  {tip.tip_type}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {tip.description}
              </p>
              {tip.max_followers && (
                <p className="text-xs text-muted-foreground mt-2">
                  💡 Recommended for {tip.min_followers}-{tip.max_followers} followers
                </p>
              )}
            </div>
          ))}

          {tips.length === 0 && (
            <div className="text-center py-6">
              <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No tips available yet</h3>
              <p className="text-sm text-muted-foreground">
                Check back later for personalized growth tips!
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default GrowthTips;