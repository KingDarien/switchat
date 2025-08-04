import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Target, 
  Heart, 
  MessageCircle, 
  Calendar,
  TrendingUp,
  Award,
  Star
} from 'lucide-react';

interface ProfileStatsProps {
  followersCount: number;
  followingCount: number;
  postsCount: number;
  likesReceived: number;
  commentsReceived: number;
  goalsCompleted: number;
  totalContributions: number;
  trustScore: number;
  popularityScore: number;
  currentRank?: number;
  joinedDate: string;
  verificationTier?: string;
}

export const ProfileStats: React.FC<ProfileStatsProps> = ({
  followersCount,
  followingCount,
  postsCount,
  likesReceived,
  commentsReceived,
  goalsCompleted,
  totalContributions,
  trustScore,
  popularityScore,
  currentRank,
  joinedDate,
  verificationTier
}) => {
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getVerificationColor = (tier?: string) => {
    switch (tier) {
      case 'diamond': return 'text-blue-400';
      case 'gold': return 'text-yellow-400';
      case 'silver': return 'text-gray-400';
      case 'bronze': return 'text-orange-400';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Social Stats */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Users className="h-4 w-4" />
            Social
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Followers</span>
            <span className="font-semibold">{formatNumber(followersCount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Following</span>
            <span className="font-semibold">{formatNumber(followingCount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Posts</span>
            <span className="font-semibold">{formatNumber(postsCount)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Engagement Stats */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Heart className="h-4 w-4" />
            Engagement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Likes Received</span>
            <span className="font-semibold">{formatNumber(likesReceived)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Comments</span>
            <span className="font-semibold">{formatNumber(commentsReceived)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Engagement Rate</span>
            <span className="font-semibold">
              {postsCount > 0 ? `${((likesReceived + commentsReceived) / postsCount).toFixed(1)}%` : '0%'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Achievement Stats */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Target className="h-4 w-4" />
            Achievements
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Goals Completed</span>
            <span className="font-semibold">{goalsCompleted}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Contributions</span>
            <span className="font-semibold">{formatCurrency(totalContributions)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Trust Score</span>
            <span className="font-semibold">{trustScore}</span>
          </div>
        </CardContent>
      </Card>

      {/* Ranking & Verification */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Ranking
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Current Rank</span>
            <span className="font-semibold">
              {currentRank ? `#${currentRank}` : 'Unranked'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Popularity Score</span>
            <span className="font-semibold">{formatNumber(popularityScore)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Verification</span>
            <Badge variant="outline" className={getVerificationColor(verificationTier)}>
              <Star className="h-3 w-3 mr-1" />
              {verificationTier || 'None'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card className="md:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Member Since</span>
            <span className="font-semibold">
              {new Date(joinedDate).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long' 
              })}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};