import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import GoalCard from '@/components/GoalCard';
import ContributionDialog from '@/components/ContributionDialog';
import { Search, Target, Filter } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
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

export default function GoalsDiscovery() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [goalTypeFilter, setGoalTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [isContributionDialogOpen, setIsContributionDialogOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      // First fetch goals
      const { data: goalsData, error: goalsError } = await supabase
        .from('user_goals')
        .select('*')
        .eq('is_public', true)
        .eq('approval_status', 'approved')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (goalsError) throw goalsError;

      if (!goalsData || goalsData.length === 0) {
        setGoals([]);
        return;
      }

      // Get unique user IDs
      const userIds = [...new Set(goalsData.map(goal => goal.user_id))];

      // Fetch profiles for these users
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, user_id, display_name, username, avatar_url, trust_score, is_verified, verification_tier, current_rank')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      // Fetch contribution counts
      const { data: contributionsData, error: contributionsError } = await supabase
        .from('goal_contributions')
        .select('goal_id')
        .in('goal_id', goalsData.map(goal => goal.id));

      if (contributionsError) throw contributionsError;

      // Combine data
      const goalsWithProfiles = goalsData.map(goal => ({
        ...goal,
        profiles: profilesData?.find(profile => profile.user_id === goal.user_id) || null,
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

  const filteredGoals = goals.filter(goal => {
    const matchesSearch = goal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         goal.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = goalTypeFilter === 'all' || goal.goal_type === goalTypeFilter;
    return matchesSearch && matchesType;
  });

  const sortedGoals = [...filteredGoals].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'oldest':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case 'progress':
        const aProgress = a.funding_target ? (a.current_funding / a.funding_target) : 0;
        const bProgress = b.funding_target ? (b.current_funding / b.funding_target) : 0;
        return bProgress - aProgress;
      case 'amount':
        return (b.funding_target || 0) - (a.funding_target || 0);
      default:
        return 0;
    }
  });

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-6 w-6" />
            Discover Goals
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-6 w-6" />
            Discover Goals ({sortedGoals.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search goals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="flex gap-2">
              <Select value={goalTypeFilter} onValueChange={setGoalTypeFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="community">Community</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="creative">Creative</SelectItem>
                  <SelectItem value="health">Health</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="environment">Environment</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                  <SelectItem value="progress">Most Progress</SelectItem>
                  <SelectItem value="amount">Highest Target</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {sortedGoals.length === 0 ? (
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No goals found</h3>
              <p className="text-muted-foreground">
                {searchTerm || goalTypeFilter !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'No public goals have been created yet'
                }
              </p>
            </div>
          ) : (
            <div className="grid gap-6">
              {sortedGoals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal as any}
                  isOwner={false}
                  onContribute={() => handleContribute(goal as any)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
}