import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Search, Shield, UserX, UserCheck, Ban, Crown, Settings, Eye } from 'lucide-react';

interface UserProfile {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  bio: string;
  user_role: string;
  trust_score: number;
  is_verified: boolean;
  verification_tier: string;
  goals_completed: number;
  total_contributions_made: number;
  is_protected: boolean;
  banned_at: string | null;
  ban_reason: string | null;
  banned_by: string | null;
  created_at: string;
  last_login_at: string | null;
}

const PeopleManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [currentUserRole, setCurrentUserRole] = useState<string>('');
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchUsers = async () => {
    try {
      let query = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (filterRole !== 'all') {
        query = query.eq('user_role', filterRole);
      }

      const { data, error } = await query;

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getCurrentUserRole = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('user_role')
      .eq('user_id', user.id)
      .single();
    
    setCurrentUserRole(data?.user_role || '');
  };

  const canPerformAction = (targetUser: UserProfile) => {
    if (currentUserRole === 'super_admin') return true;
    if (targetUser.is_protected) return false;
    if (currentUserRole === 'admin') {
      return targetUser.user_role !== 'admin' && targetUser.user_role !== 'super_admin';
    }
    if (currentUserRole === 'moderator') {
      return targetUser.user_role === 'user';
    }
    return false;
  };

  const logAdminAction = async (actionType: string, targetUserId: string, reason: string) => {
    try {
      await supabase.rpc('log_admin_action', {
        action_type_param: actionType,
        target_user_id_param: targetUserId,
        reason_param: reason
      });
    } catch (error) {
      console.error('Error logging admin action:', error);
    }
  };

  const handleBanUser = async (userId: string, reason: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          banned_at: new Date().toISOString(),
          ban_reason: reason,
          banned_by: user?.id
        })
        .eq('user_id', userId);

      if (error) throw error;

      await logAdminAction('ban_user', userId, reason);
      
      toast({
        title: "Success",
        description: "User has been banned",
      });
      
      fetchUsers();
      setSelectedUser(null);
      setActionReason('');
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to ban user",
        variant: "destructive",
      });
    }
  };

  const handleUnbanUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          banned_at: null,
          ban_reason: null,
          banned_by: null
        })
        .eq('user_id', userId);

      if (error) throw error;

      await logAdminAction('unban_user', userId, 'User unbanned');
      
      toast({
        title: "Success",
        description: "User has been unbanned",
      });
      
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to unban user",
        variant: "destructive",
      });
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ user_role: newRole })
        .eq('user_id', userId);

      if (error) throw error;

      await logAdminAction('role_change', userId, `Role changed to ${newRole}`);
      
      toast({
        title: "Success",
        description: `User role updated to ${newRole}`,
      });
      
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    getCurrentUserRole();
    fetchUsers();
  }, [user, filterRole]);

  const filteredUsers = users.filter(user =>
    user.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white';
      case 'admin': return 'bg-red-500 text-white';
      case 'moderator': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users by name or username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="user">Users</SelectItem>
            <SelectItem value="moderator">Moderators</SelectItem>
            <SelectItem value="admin">Admins</SelectItem>
            <SelectItem value="super_admin">Super Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="h-20 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {filteredUsers.map((userProfile) => (
            <Card key={userProfile.user_id} className={`relative ${userProfile.banned_at ? 'border-destructive bg-destructive/5' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={userProfile.avatar_url} />
                      <AvatarFallback>
                        {userProfile.display_name?.[0] || userProfile.username?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base">{userProfile.display_name || userProfile.username}</CardTitle>
                      <p className="text-sm text-muted-foreground">@{userProfile.username}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Badge className={getRoleBadgeColor(userProfile.user_role)}>
                      {userProfile.is_protected && <Crown className="h-3 w-3 mr-1" />}
                      {userProfile.user_role.replace('_', ' ')}
                    </Badge>
                    {userProfile.is_verified && (
                      <Badge variant="secondary" className="text-xs">
                        <Shield className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {userProfile.bio && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{userProfile.bio}</p>
                )}
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>Trust Score: {userProfile.trust_score}</div>
                  <div>Goals: {userProfile.goals_completed}</div>
                  <div>Contributions: ${userProfile.total_contributions_made?.toFixed(2) || '0.00'}</div>
                  <div>Joined: {new Date(userProfile.created_at).toLocaleDateString()}</div>
                </div>

                {userProfile.banned_at && (
                  <div className="p-2 bg-destructive/10 border border-destructive/20 rounded text-xs">
                    <p className="font-medium text-destructive">Banned</p>
                    <p className="text-muted-foreground">{userProfile.ban_reason}</p>
                    <p className="text-muted-foreground">
                      {new Date(userProfile.banned_at).toLocaleDateString()}
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setSelectedUser(userProfile)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>User Management: {userProfile.display_name}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="font-medium">Username</p>
                            <p className="text-muted-foreground">{userProfile.username}</p>
                          </div>
                          <div>
                            <p className="font-medium">Display Name</p>
                            <p className="text-muted-foreground">{userProfile.display_name}</p>
                          </div>
                          <div>
                            <p className="font-medium">Role</p>
                            <p className="text-muted-foreground">{userProfile.user_role}</p>
                          </div>
                          <div>
                            <p className="font-medium">Trust Score</p>
                            <p className="text-muted-foreground">{userProfile.trust_score}</p>
                          </div>
                        </div>

                        {canPerformAction(userProfile) && (
                          <div className="space-y-4 border-t pt-4">
                            <h4 className="font-medium">Admin Actions</h4>
                            
                            {currentUserRole === 'super_admin' && (
                              <div className="space-y-2">
                                <p className="text-sm font-medium">Change Role</p>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleRoleChange(userProfile.user_id, 'user')}
                                    disabled={userProfile.user_role === 'user'}
                                  >
                                    User
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleRoleChange(userProfile.user_id, 'moderator')}
                                    disabled={userProfile.user_role === 'moderator'}
                                  >
                                    Moderator
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleRoleChange(userProfile.user_id, 'admin')}
                                    disabled={userProfile.user_role === 'admin'}
                                  >
                                    Admin
                                  </Button>
                                </div>
                              </div>
                            )}

                            <div className="space-y-2">
                              <Textarea
                                placeholder="Reason for action..."
                                value={actionReason}
                                onChange={(e) => setActionReason(e.target.value)}
                              />
                              <div className="flex gap-2">
                                {userProfile.banned_at ? (
                                  <Button
                                    size="sm"
                                    onClick={() => handleUnbanUser(userProfile.user_id)}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <UserCheck className="h-4 w-4 mr-1" />
                                    Unban
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleBanUser(userProfile.user_id, actionReason)}
                                    disabled={!actionReason.trim()}
                                  >
                                    <Ban className="h-4 w-4 mr-1" />
                                    Ban User
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default PeopleManagement;