
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CheckCircle, XCircle, Clock, User, Target, DollarSign, Calendar, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/Navbar';

interface Goal {
  id: string;
  title: string;
  description: string;
  goal_type: string;
  target_value: number;
  current_value: number;
  funding_target: number;
  current_funding: number;
  currency: string;
  target_date: string;
  funding_deadline: string;
  approval_status: string;
  created_at: string;
  submitted_at: string;
  user_id: string;
  is_anonymous: boolean;
  admin_notes: string;
  rejection_reason: string;
  profiles: {
    display_name: string;
    username: string;
    avatar_url: string;
    trust_score: number;
    is_verified: boolean;
    verification_tier: string;
    goals_completed: number;
  };
}

const Messages = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [processingGoalId, setProcessingGoalId] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchPendingGoals = async () => {
    try {
      // Fetch goals pending review
      const { data: goalsData, error: goalsError } = await supabase
        .from('user_goals')
        .select('*')
        .in('approval_status', ['pending', 'under_review'])
        .eq('is_active', true)
        .order('submitted_at', { ascending: true });

      if (goalsError) throw goalsError;

      if (!goalsData || goalsData.length === 0) {
        setGoals([]);
        return;
      }

      // Get profiles for goal creators
      const userIds = [...new Set(goalsData.map(goal => goal.user_id))];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, display_name, username, avatar_url, trust_score, is_verified, verification_tier, goals_completed')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      // Combine data
      const goalsWithProfiles = goalsData.map(goal => ({
        ...goal,
        profiles: profilesData?.find(profile => profile.user_id === goal.user_id) || null
      }));

      setGoals(goalsWithProfiles);
    } catch (error: any) {
      console.error('Error fetching pending goals:', error);
      toast({
        title: "Error",
        description: "Failed to load pending goals",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoalAction = async (goalId: string, action: 'approved' | 'rejected' | 'under_review', notes: string = '') => {
    if (!user) return;
    
    setProcessingGoalId(goalId);
    try {
      // Update goal status
      const updateData: any = {
        approval_status: action,
        admin_notes: notes,
      };

      if (action === 'approved') {
        updateData.approved_at = new Date().toISOString();
      } else if (action === 'rejected') {
        updateData.rejection_reason = notes;
      }

      const { error: updateError } = await supabase
        .from('user_goals')
        .update(updateData)
        .eq('id', goalId);

      if (updateError) throw updateError;

      // Create admin review record
      const { error: reviewError } = await supabase
        .from('goal_admin_reviews')
        .insert({
          goal_id: goalId,
          reviewer_id: user.id,
          decision: action,
          reason: notes,
          review_type: action === 'approved' ? 'approval' : action === 'rejected' ? 'rejection' : 'request_changes'
        });

      if (reviewError) throw reviewError;

      toast({
        title: "Success",
        description: `Goal ${action === 'approved' ? 'approved' : action === 'rejected' ? 'rejected' : 'marked for review'}`,
      });

      // Refresh goals list
      fetchPendingGoals();
      setSelectedGoal(null);
      setAdminNotes('');
    } catch (error: any) {
      console.error('Error updating goal:', error);
      toast({
        title: "Error",
        description: "Failed to update goal status",
        variant: "destructive",
      });
    } finally {
      setProcessingGoalId(null);
    }
  };

  useEffect(() => {
    fetchPendingGoals();
  }, []);

  // Check if user is admin
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('profiles')
        .select('user_role')
        .eq('user_id', user.id)
        .single();
      
      setIsAdmin(data?.user_role === 'admin' || data?.user_role === 'moderator');
    };
    
    checkAdminStatus();
  }, [user]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-4xl mx-auto p-4 pb-20 space-y-6">
          <h1 className="text-3xl font-bold">Admin Access Required</h1>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <XCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">You don't have permission to access this page</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-6xl mx-auto p-4 pb-20 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Goal Review Center</h1>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {goals.length} Pending Reviews
          </Badge>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="pt-6">
                  <div className="h-20 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : goals.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No goals pending review</p>
                <p className="text-sm text-muted-foreground mt-2">
                  All submitted goals have been reviewed
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {goals.map((goal) => (
              <Card key={goal.id} className="relative">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-xl">{goal.title}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={goal.profiles?.avatar_url} />
                          <AvatarFallback>
                            {goal.profiles?.display_name?.[0] || goal.profiles?.username?.[0] || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{goal.profiles?.display_name || goal.profiles?.username}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>Trust Score: {goal.profiles?.trust_score || 0}</span>
                            {goal.profiles?.is_verified && (
                              <Badge variant="secondary" className="text-xs">Verified</Badge>
                            )}
                            <span>Goals Completed: {goal.profiles?.goals_completed || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <Badge variant={goal.approval_status === 'pending' ? 'default' : 'secondary'}>
                      <Clock className="h-3 w-3 mr-1" />
                      {goal.approval_status === 'pending' ? 'New' : 'Under Review'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-3">{goal.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      <span>{goal.goal_type}</span>
                    </div>
                    {goal.funding_target && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span>${goal.funding_target.toLocaleString()}</span>
                      </div>
                    )}
                    {goal.target_date && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{new Date(goal.target_date).toLocaleDateString()}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>Submitted {new Date(goal.submitted_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {goal.admin_notes && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium mb-1">Previous Notes:</p>
                      <p className="text-xs text-muted-foreground">{goal.admin_notes}</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={() => setSelectedGoal(goal)}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Review
                    </Button>
                    <Button
                      onClick={() => handleGoalAction(goal.id, 'approved')}
                      disabled={processingGoalId === goal.id}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      onClick={() => handleGoalAction(goal.id, 'rejected', 'Goal rejected by admin')}
                      disabled={processingGoalId === goal.id}
                      size="sm"
                      variant="destructive"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Review Dialog */}
        {selectedGoal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>Review Goal: {selectedGoal.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Goal Details</h4>
                  <p className="text-sm text-muted-foreground">{selectedGoal.description}</p>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Admin Notes</h4>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add notes about this goal review..."
                    className="min-h-[100px]"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={() => {
                      setSelectedGoal(null);
                      setAdminNotes('');
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => handleGoalAction(selectedGoal.id, 'under_review', adminNotes)}
                    disabled={processingGoalId === selectedGoal.id}
                    variant="secondary"
                    className="flex-1"
                  >
                    Request Changes
                  </Button>
                  <Button
                    onClick={() => handleGoalAction(selectedGoal.id, 'approved', adminNotes)}
                    disabled={processingGoalId === selectedGoal.id}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleGoalAction(selectedGoal.id, 'rejected', adminNotes)}
                    disabled={processingGoalId === selectedGoal.id}
                    variant="destructive"
                    className="flex-1"
                  >
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
