import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import GoalCard from '@/components/GoalCard';
import CreateGoalDialog from '@/components/CreateGoalDialog';
import ContributionDialog from '@/components/ContributionDialog';
import { Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';

interface Goal {
  id: string;
  title: string;
  description?: string;
  target_value?: number;
  current_value: number;
  goal_type: string;
  target_date?: string;
  funding_target?: number;
  current_funding: number;
  currency: string;
  approval_status: string;
  is_completed: boolean;
  is_active: boolean;
  is_public: boolean;
  is_anonymous: boolean;
  funding_deadline?: string;
  created_at: string;
  user_id: string;
  profiles?: {
    id: string;
    display_name?: string;
    username?: string;
    avatar_url?: string;
    trust_score?: number;
    is_verified?: boolean;
    verification_tier?: string;
    current_rank?: number;
  } | null;
  goal_contributions?: Array<{ count: number }>;
}

const UserGoals: React.FC = () => {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isContributionDialogOpen, setIsContributionDialogOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);

  useEffect(() => {
    if (user) {
      fetchGoals();
    }
  }, [user]);

  const fetchGoals = async () => {
    if (!user) return;

    try {
      // First fetch goals
      const { data: goalsData, error: goalsError } = await supabase
        .from('user_goals')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (goalsError) throw goalsError;

      if (!goalsData || goalsData.length === 0) {
        setGoals([]);
        return;
      }

      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, user_id, display_name, username, avatar_url, trust_score, is_verified, verification_tier, current_rank')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;

      // Fetch contribution counts for each goal
      const { data: contributionsData, error: contributionsError } = await supabase
        .from('goal_contributions')
        .select('goal_id')
        .in('goal_id', goalsData.map(goal => goal.id));

      if (contributionsError) throw contributionsError;

      // Combine data
      const goalsWithProfiles = goalsData.map(goal => ({
        ...goal,
        profiles: profileData,
        goal_contributions: [{ count: contributionsData?.filter(c => c.goal_id === goal.id).length || 0 }]
      }));

      setGoals(goalsWithProfiles);
    } catch (error: any) {
      console.error('Error fetching goals:', error);
      toast({
        title: "Error",
        description: "Failed to fetch goals",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleContribute = (goal: Goal) => {
    setSelectedGoal(goal);
    setIsContributionDialogOpen(true);
  };

  const handleEdit = (goal: Goal) => {
    if (goal.approval_status === 'approved') {
      toast({
        title: "Cannot Edit",
        description: "Approved goals cannot be edited. You can only delete them.",
        variant: "destructive",
      });
      return;
    }
    
    // TODO: Implement goal editing for non-approved goals
    toast({
      title: "Coming Soon",
      description: "Goal editing functionality will be available soon",
    });
  };

  const handleDelete = async (goalId: string) => {
    if (!confirm("Are you sure you want to delete this goal? This action cannot be undone. All contributors will be automatically refunded.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from('user_goals')
        .update({ is_active: false })
        .eq('id', goalId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Goal deleted successfully. Any contributions will be refunded automatically.",
      });

      fetchGoals();
    } catch (error: any) {
      console.error('Error deleting goal:', error);
      toast({
        title: "Error",
        description: "Failed to delete goal",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-6 w-6" />
            Your Goals
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-20 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-6 w-6" />
            Your Goals
          </CardTitle>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Goal
          </Button>
        </CardHeader>
        <CardContent>
          {goals.length === 0 ? (
            <div className="text-center py-8">
              <Plus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No goals yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first goal to start your crowdfunding journey!
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Goal
              </Button>
            </div>
          ) : (
            <div className="grid gap-6">
              {goals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal as any}
                  isOwner={true}
                  onContribute={() => handleContribute(goal as any)}
                  onEdit={() => handleEdit(goal as any)}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CreateGoalDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={fetchGoals}
      />

      {selectedGoal && (
        <ContributionDialog
          goal={selectedGoal as any}
          open={isContributionDialogOpen}
          onOpenChange={setIsContributionDialogOpen}
          onSuccess={fetchGoals as any}
        />
      )}
    </div>
  );
};

export default UserGoals;