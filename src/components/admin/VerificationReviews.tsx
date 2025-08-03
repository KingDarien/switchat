import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CheckCircle, XCircle, Clock, User, Trophy, Star, Shield, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface VerificationRequest {
  id: string;
  user_id: string;
  status: string;
  requested_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  denial_reason: string | null;
  created_at: string;
  updated_at: string;
  profiles: {
    display_name: string;
    username: string;
    avatar_url: string;
    trust_score: number;
    is_verified: boolean;
    verification_tier: string;
    goals_completed: number;
    current_rank: number;
    popularity_score: number;
    total_contributions_made: number;
  };
}

const VerificationReviews = () => {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchPendingRequests = async () => {
    try {
      // Fetch verification requests pending review
      const { data: requestsData, error: requestsError } = await supabase
        .from('verification_requests')
        .select('*')
        .eq('status', 'pending')
        .order('requested_at', { ascending: true });

      if (requestsError) throw requestsError;

      if (!requestsData || requestsData.length === 0) {
        setRequests([]);
        return;
      }

      // Get profiles for users requesting verification
      const userIds = [...new Set(requestsData.map(request => request.user_id))];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          user_id, display_name, username, avatar_url, trust_score, 
          is_verified, verification_tier, goals_completed, current_rank, 
          popularity_score, total_contributions_made
        `)
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      // Combine data
      const requestsWithProfiles = requestsData.map(request => ({
        ...request,
        profiles: profilesData?.find(profile => profile.user_id === request.user_id) || null
      }));

      setRequests(requestsWithProfiles);
    } catch (error: any) {
      console.error('Error fetching pending verification requests:', error);
      toast({
        title: "Error",
        description: "Failed to load verification requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationAction = async (requestId: string, action: 'approved' | 'denied', notes: string = '') => {
    if (!user) return;
    
    setProcessingRequestId(requestId);
    try {
      const request = requests.find(r => r.id === requestId);
      if (!request) throw new Error('Request not found');

      // Update verification request status
      const { error: updateError } = await supabase
        .from('verification_requests')
        .update({
          status: action,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
          denial_reason: action === 'denied' ? notes : null,
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // If approved, update user's verification status
      if (action === 'approved') {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            is_verified: true,
            verification_tier: 'gold', // Default tier for manual verification
            trust_score: Math.max(75, request.profiles?.trust_score || 0) // Boost trust score
          })
          .eq('user_id', request.user_id);

        if (profileError) throw profileError;
      }

      // Log admin action
      await supabase.rpc('log_admin_action', {
        action_type_param: `verification_${action}`,
        target_user_id_param: request.user_id,
        target_resource_type_param: 'verification_request',
        target_resource_id_param: requestId,
        reason_param: notes || `Verification ${action} by admin`
      });

      toast({
        title: "Success",
        description: `Verification request ${action === 'approved' ? 'approved' : 'denied'}`,
      });

      // Refresh requests list
      fetchPendingRequests();
      setSelectedRequest(null);
      setReviewNotes('');
    } catch (error: any) {
      console.error('Error updating verification request:', error);
      toast({
        title: "Error",
        description: "Failed to update verification request",
        variant: "destructive",
      });
    } finally {
      setProcessingRequestId(null);
    }
  };

  const getTierBadge = (tier: string) => {
    const tierConfig = {
      diamond: { icon: Trophy, color: 'bg-purple-500 text-white' },
      gold: { icon: Star, color: 'bg-yellow-500 text-white' },
      silver: { icon: Shield, color: 'bg-gray-400 text-white' },
      bronze: { icon: Shield, color: 'bg-orange-600 text-white' },
      none: { icon: User, color: 'bg-gray-500 text-white' }
    };
    
    const config = tierConfig[tier as keyof typeof tierConfig] || tierConfig.none;
    const Icon = config.icon;
    
    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {tier.charAt(0).toUpperCase() + tier.slice(1)}
      </Badge>
    );
  };

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Verification Reviews</h2>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          {requests.length} Pending Reviews
        </Badge>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="h-24 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : requests.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No verification requests pending review</p>
              <p className="text-sm text-muted-foreground mt-2">
                All verification requests have been processed
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {requests.map((request) => (
            <Card key={request.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={request.profiles?.avatar_url} />
                        <AvatarFallback>
                          {request.profiles?.display_name?.[0] || request.profiles?.username?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">
                          {request.profiles?.display_name || request.profiles?.username}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">@{request.profiles?.username}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-wrap">
                      {request.profiles?.is_verified ? getTierBadge(request.profiles.verification_tier) : (
                        <Badge variant="outline">Unverified</Badge>
                      )}
                      <Badge variant="secondary">
                        Rank #{request.profiles?.current_rank || 'Unranked'}
                      </Badge>
                    </div>
                  </div>
                  
                  <Badge variant="default">
                    <Clock className="h-3 w-3 mr-1" />
                    Pending
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Trust Score:</span>
                      <span className="font-medium">{request.profiles?.trust_score || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Goals Completed:</span>
                      <span className="font-medium">{request.profiles?.goals_completed || 0}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Popularity Score:</span>
                      <span className="font-medium">{request.profiles?.popularity_score || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Contributions:</span>
                      <span className="font-medium">${request.profiles?.total_contributions_made || 0}</span>
                    </div>
                  </div>
                </div>

                <div className="text-sm">
                  <span className="text-muted-foreground">Requested: </span>
                  <span>{new Date(request.requested_at).toLocaleDateString()}</span>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => setSelectedRequest(request)}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <MessageSquare className="h-4 w-4 mr-1" />
                    Review
                  </Button>
                  <Button
                    onClick={() => handleVerificationAction(request.id, 'approved')}
                    disabled={processingRequestId === request.id}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleVerificationAction(request.id, 'denied', 'Verification requirements not met')}
                    disabled={processingRequestId === request.id}
                    size="sm"
                    variant="destructive"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Deny
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Review Dialog */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Review Verification Request</CardTitle>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedRequest.profiles?.avatar_url} />
                  <AvatarFallback>
                    {selectedRequest.profiles?.display_name?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedRequest.profiles?.display_name || selectedRequest.profiles?.username}</p>
                  <p className="text-sm text-muted-foreground">@{selectedRequest.profiles?.username}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">User Statistics</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Trust Score:</span>
                      <span>{selectedRequest.profiles?.trust_score || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Current Rank:</span>
                      <span>#{selectedRequest.profiles?.current_rank || 'Unranked'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Goals Completed:</span>
                      <span>{selectedRequest.profiles?.goals_completed || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Popularity Score:</span>
                      <span>{selectedRequest.profiles?.popularity_score || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Contributions:</span>
                      <span>${selectedRequest.profiles?.total_contributions_made || 0}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Request Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Requested:</span>
                      <span>{new Date(selectedRequest.requested_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Current Status:</span>
                      <Badge variant="outline">{selectedRequest.profiles?.verification_tier || 'none'}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Is Verified:</span>
                      <span>{selectedRequest.profiles?.is_verified ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Review Notes</h4>
                <Textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add notes about this verification review (optional for approval, required for denial)..."
                  className="min-h-[100px]"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => {
                    setSelectedRequest(null);
                    setReviewNotes('');
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleVerificationAction(selectedRequest.id, 'approved', reviewNotes)}
                  disabled={processingRequestId === selectedRequest.id}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  Approve
                </Button>
                <Button
                  onClick={() => handleVerificationAction(selectedRequest.id, 'denied', reviewNotes || 'Verification requirements not met')}
                  disabled={processingRequestId === selectedRequest.id || (!reviewNotes.trim())}
                  variant="destructive"
                  className="flex-1"
                >
                  Deny
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default VerificationReviews;