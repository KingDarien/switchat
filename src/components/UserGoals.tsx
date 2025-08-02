import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Target, Plus, CheckCircle, Calendar, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Goal {
  id: string;
  title: string;
  description: string;
  target_value: number;
  current_value: number;
  goal_type: string;
  target_date: string;
  is_completed: boolean;
  is_active: boolean;
  created_at: string;
}

const UserGoals = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    target_value: '',
    goal_type: 'followers',
    target_date: ''
  });

  useEffect(() => {
    if (user) {
      fetchGoals();
    }
  }, [user]);

  const fetchGoals = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_goals')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGoals(data || []);
    } catch (error) {
      console.error('Error fetching goals:', error);
      toast({
        title: "Error",
        description: "Failed to load your goals",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createGoal = async () => {
    if (!user || !newGoal.title || !newGoal.target_value) return;

    try {
      const { error } = await supabase
        .from('user_goals')
        .insert({
          user_id: user.id,
          title: newGoal.title,
          description: newGoal.description,
          target_value: parseInt(newGoal.target_value),
          goal_type: newGoal.goal_type,
          target_date: newGoal.target_date || null
        });

      if (error) throw error;

      toast({
        title: "Goal Created!",
        description: "Your new goal has been added successfully."
      });

      setNewGoal({
        title: '',
        description: '',
        target_value: '',
        goal_type: 'followers',
        target_date: ''
      });
      setIsDialogOpen(false);
      fetchGoals();
    } catch (error) {
      console.error('Error creating goal:', error);
      toast({
        title: "Error",
        description: "Failed to create goal",
        variant: "destructive"
      });
    }
  };

  const updateGoalProgress = async (goalId: string, newValue: number) => {
    try {
      const { error } = await supabase
        .from('user_goals')
        .update({ 
          current_value: newValue,
          is_completed: newValue >= goals.find(g => g.id === goalId)?.target_value || false
        })
        .eq('id', goalId);

      if (error) throw error;
      fetchGoals();
    } catch (error) {
      console.error('Error updating goal:', error);
      toast({
        title: "Error",
        description: "Failed to update goal progress",
        variant: "destructive"
      });
    }
  };

  const deleteGoal = async (goalId: string) => {
    try {
      const { error } = await supabase
        .from('user_goals')
        .update({ is_active: false })
        .eq('id', goalId);

      if (error) throw error;
      
      toast({
        title: "Goal Removed",
        description: "Goal has been successfully removed."
      });
      fetchGoals();
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast({
        title: "Error",
        description: "Failed to remove goal",
        variant: "destructive"
      });
    }
  };

  const getGoalTypeDisplay = (type: string) => {
    const types = {
      followers: { label: 'Followers', icon: '👥' },
      posts: { label: 'Posts', icon: '📝' },
      engagement: { label: 'Engagement', icon: '❤️' },
      custom: { label: 'Custom', icon: '🎯' }
    };
    return types[type as keyof typeof types] || types.custom;
  };

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const isOverdue = (targetDate: string) => {
    if (!targetDate) return false;
    return new Date(targetDate) < new Date();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Your Goals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-2 bg-muted rounded w-full mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Your Goals
        </CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Goal</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Goal Title</Label>
                <Input
                  id="title"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({...newGoal, title: e.target.value})}
                  placeholder="e.g., Reach 1,000 followers"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newGoal.description}
                  onChange={(e) => setNewGoal({...newGoal, description: e.target.value})}
                  placeholder="Describe your goal and how you plan to achieve it"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="goal_type">Goal Type</Label>
                  <Select value={newGoal.goal_type} onValueChange={(value) => setNewGoal({...newGoal, goal_type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="followers">👥 Followers</SelectItem>
                      <SelectItem value="posts">📝 Posts</SelectItem>
                      <SelectItem value="engagement">❤️ Engagement</SelectItem>
                      <SelectItem value="custom">🎯 Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="target_value">Target Value</Label>
                  <Input
                    id="target_value"
                    type="number"
                    value={newGoal.target_value}
                    onChange={(e) => setNewGoal({...newGoal, target_value: e.target.value})}
                    placeholder="1000"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="target_date">Target Date (optional)</Label>
                <Input
                  id="target_date"
                  type="date"
                  value={newGoal.target_date}
                  onChange={(e) => setNewGoal({...newGoal, target_date: e.target.value})}
                />
              </div>
              <Button onClick={createGoal} className="w-full">
                Create Goal
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {goals.map((goal) => {
            const typeDisplay = getGoalTypeDisplay(goal.goal_type);
            const progress = getProgressPercentage(goal.current_value, goal.target_value);
            const overdue = isOverdue(goal.target_date);
            
            return (
              <div key={goal.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{goal.title}</h3>
                      {goal.is_completed && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {goal.description}
                    </p>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary">
                        <span className="mr-1">{typeDisplay.icon}</span>
                        {typeDisplay.label}
                      </Badge>
                      {goal.target_date && (
                        <Badge variant={overdue ? "destructive" : "outline"}>
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(goal.target_date).toLocaleDateString()}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteGoal(goal.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span className="font-medium">
                      {goal.current_value} / {goal.target_value}
                    </span>
                  </div>
                  <Progress value={progress} />
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">
                      {progress.toFixed(1)}% complete
                    </span>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={goal.current_value}
                        onChange={(e) => updateGoalProgress(goal.id, parseInt(e.target.value) || 0)}
                        className="w-20 h-8 text-xs"
                        min="0"
                        max={goal.target_value}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {goals.length === 0 && (
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No goals yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Set your first goal to start tracking your progress!
              </p>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Goal
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default UserGoals;