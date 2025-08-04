import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Heart, DollarSign, Gift, Calendar, Eye, EyeOff } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import UserDisplayName from './UserDisplayName';

interface Goal {
  id: string;
  title: string;
  description: string;
  goal_type: string;
  target_value?: number;
  current_value: number;
  funding_target?: number;
  current_funding: number;
  currency: string;
  target_date?: string;
  is_completed: boolean;
  is_public: boolean;
  is_anonymous: boolean;
  approval_status: string;
  user_id: string;
  created_at: string;
  // Profile data
  profiles?: {
    display_name?: string;
    username?: string;
    avatar_url?: string;
    trust_score?: number;
    goals_completed?: number;
  };
  // Contribution stats
  _count?: {
    goal_contributions: number;
  };
}

interface GoalCardProps {
  goal: Goal;
  isOwner?: boolean;
  onContribute?: (goalId: string) => void;
  onEdit?: (goal: Goal) => void;
}

const GoalCard: React.FC<GoalCardProps> = ({ goal, isOwner = false, onContribute, onEdit }) => {
  const { toast } = useToast();
  const [isSupporting, setIsSupporting] = useState(false);

  const fundingProgress = goal.funding_target ? (goal.current_funding / goal.funding_target) * 100 : 0;
  const progressValue = goal.target_value ? (goal.current_value / goal.target_value) * 100 : fundingProgress;

  const getApprovalStatusBadge = () => {
    switch (goal.approval_status) {
      case 'approved':
        return <Badge variant="default" className="bg-green-500">✓ Approved</Badge>;
      case 'pending':
        return <Badge variant="secondary">⏳ Under Review</Badge>;
      case 'rejected':
        return <Badge variant="destructive">✗ Rejected</Badge>;
      case 'under_review':
        return <Badge variant="secondary">👀 Under Review</Badge>;
      default:
        return null;
    }
  };

  const getGoalTypeIcon = () => {
    switch (goal.goal_type) {
      case 'followers': return '👥';
      case 'posts': return '📝';
      case 'engagement': return '❤️';
      case 'financial': return '💰';
      case 'education': return '🎓';
      case 'health': return '💪';
      case 'creative': return '🎨';
      case 'business': return '💼';
      default: return '🎯';
    }
  };

  const handleSupport = async () => {
    if (!onContribute) return;
    
    setIsSupporting(true);
    try {
      onContribute(goal.id);
    } finally {
      setIsSupporting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: goal.currency || 'USD',
    }).format(amount);
  };

  const displayName = goal.is_anonymous ? 'Anonymous' : 
    (goal.profiles?.display_name || goal.profiles?.username || 'Unknown User');
  const username = goal.profiles?.username || 'user';

  const authorAvatar = goal.is_anonymous ? '' : goal.profiles?.avatar_url;

  return (
    <Card className="w-full max-w-md hover:shadow-lg transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {!goal.is_anonymous && (
              <Avatar className="h-10 w-10">
                <AvatarImage src={authorAvatar} />
                <AvatarFallback>{displayName[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
            )}
            <div className="flex-1">
              {!goal.is_anonymous && (
                <UserDisplayName
                  displayName={displayName}
                  username={username}
                  userId={goal.user_id}
                  isVerified={false}
                  verificationTier="none"
                  variant="compact"
                  size="sm"
                  showRank={false}
                />
              )}
              {goal.is_anonymous && (
                <span className="font-medium text-sm">{displayName}</span>
              )}
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                <span>{getGoalTypeIcon()}</span>
                <span>{goal.goal_type}</span>
                {goal.is_public ? <Eye size={12} /> : <EyeOff size={12} />}
                {goal.profiles?.trust_score && goal.profiles.trust_score > 50 && (
                  <Badge variant="outline" className="text-xs">
                    ⭐ {goal.profiles.trust_score}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          {getApprovalStatusBadge()}
        </div>
        
        <CardTitle className="text-lg">{goal.title}</CardTitle>
        {goal.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{goal.description}</p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Section */}
        <div className="space-y-2">
          {goal.funding_target ? (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Funding Progress</span>
                <span className="font-medium">
                  {formatCurrency(goal.current_funding)} of {formatCurrency(goal.funding_target)}
                </span>
              </div>
              <Progress value={fundingProgress} className="h-2" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{Math.round(fundingProgress)}% funded</span>
                <span>{goal._count?.goal_contributions || 0} supporters</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">
                  {goal.current_value} / {goal.target_value || 0}
                </span>
              </div>
              <Progress value={progressValue} className="h-2" />
            </>
          )}
        </div>

        {/* Time and Status */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          {goal.target_date && (
            <div className="flex items-center gap-1">
              <Calendar size={12} />
              <span>Due {formatDistanceToNow(new Date(goal.target_date), { addSuffix: true })}</span>
            </div>
          )}
          <span>Created {formatDistanceToNow(new Date(goal.created_at), { addSuffix: true })}</span>
        </div>

        {/* Action Buttons */}
        {!isOwner && goal.approval_status === 'approved' && (
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={handleSupport}
              disabled={isSupporting}
            >
              <Heart className="h-4 w-4 mr-1" />
              Support
            </Button>
            {goal.funding_target && (
              <Button
                size="sm"
                className="flex-1"
                onClick={handleSupport}
                disabled={isSupporting}
              >
                <DollarSign className="h-4 w-4 mr-1" />
                Contribute
              </Button>
            )}
          </div>
        )}

        {isOwner && (
          <div className="flex gap-2 pt-2">
            {goal.approval_status !== 'approved' && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => onEdit?.(goal)}
              >
                Edit Goal
              </Button>
            )}
            {goal.approval_status === 'approved' && (
              <Badge variant="outline" className="text-xs">
                {goal._count?.goal_contributions || 0} supporters
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GoalCard;