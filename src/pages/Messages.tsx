import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { XCircle, Users, MessageCircle, ClipboardList, Shield, Crown, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/Navbar';
import PeopleManagement from '@/components/admin/PeopleManagement';
import MessagingSystem from '@/components/admin/MessagingSystem';
import GoalReviews from '@/components/admin/GoalReviews';
import VerificationReviews from '@/components/admin/VerificationReviews';

const Messages = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [pendingGoalsCount, setPendingGoalsCount] = useState(0);
  const [pendingVerificationCount, setPendingVerificationCount] = useState(0);
  const { user } = useAuth();

  const fetchPendingCounts = async () => {
    if (!user) return;
    
    try {
      // Fetch pending goals count
      const { count: goalsCount } = await supabase
        .from('user_goals')
        .select('*', { count: 'exact', head: true })
        .in('approval_status', ['pending', 'under_review'])
        .eq('is_active', true);

      // Fetch pending verification requests count
      const { count: verificationCount } = await supabase
        .from('verification_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      setPendingGoalsCount(goalsCount || 0);
      setPendingVerificationCount(verificationCount || 0);
    } catch (error) {
      console.error('Error fetching pending counts:', error);
    }
  };

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('profiles')
        .select('user_role')
        .eq('user_id', user.id)
        .single();
      
      const userRole = data?.user_role || '';
      setCurrentUserRole(userRole);
      setIsAdmin(['admin', 'moderator', 'super_admin'].includes(userRole));
      setLoading(false);
      
      // Fetch pending counts for admin users
      if (['admin', 'moderator', 'super_admin'].includes(userRole)) {
        fetchPendingCounts();
      }
    };
    
    checkAdminStatus();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-4xl mx-auto p-4 pb-20 space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-64 mb-4"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

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

  const getRoleIcon = () => {
    switch (currentUserRole) {
      case 'super_admin':
        return <Crown className="h-5 w-5 text-purple-500" />;
      case 'admin':
        return <Shield className="h-5 w-5 text-red-500" />;
      case 'moderator':
        return <Shield className="h-5 w-5 text-blue-500" />;
      default:
        return <Shield className="h-5 w-5" />;
    }
  };

  const getRoleColor = () => {
    switch (currentUserRole) {
      case 'super_admin':
        return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white';
      case 'admin':
        return 'bg-red-500 text-white';
      case 'moderator':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-7xl mx-auto p-4 pb-20 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">Admin Center</h1>
            <Badge className={getRoleColor()}>
              {getRoleIcon()}
              <span className="ml-1 capitalize">{currentUserRole.replace('_', ' ')}</span>
            </Badge>
          </div>
          {currentUserRole === 'super_admin' && (
            <Badge variant="outline" className="border-purple-500 text-purple-500">
              <Crown className="h-4 w-4 mr-1" />
              Supreme Authority
            </Badge>
          )}
        </div>

        <Tabs defaultValue="people" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="people" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              People
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Messages
            </TabsTrigger>
            <TabsTrigger value="reviews" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Reviews
            </TabsTrigger>
          </TabsList>

          <TabsContent value="people" className="space-y-6">
            <PeopleManagement />
          </TabsContent>

          <TabsContent value="messages" className="space-y-6">
            <MessagingSystem />
          </TabsContent>

          <TabsContent value="reviews" className="space-y-6">
            <Tabs defaultValue="goals" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="goals" className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4" />
                  Goal Reviews
                  {pendingGoalsCount > 0 && (
                    <Badge variant="destructive" className="ml-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center">
                      {pendingGoalsCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="verifications" className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Verification Reviews
                  {pendingVerificationCount > 0 && (
                    <Badge variant="destructive" className="ml-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center">
                      {pendingVerificationCount}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="goals">
                <GoalReviews />
              </TabsContent>

              <TabsContent value="verifications">
                <VerificationReviews />
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Messages;