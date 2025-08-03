import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, XCircle, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface VerificationStatus {
  canRequest: boolean;
  hasRequest: boolean;
  requestStatus?: 'pending' | 'approved' | 'denied';
  denialReason?: string;
  reviewedAt?: string;
}

const VerificationRequest: React.FC = () => {
  const [status, setStatus] = useState<VerificationStatus>({ canRequest: false, hasRequest: false });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const fetchVerificationStatus = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      // Check if user can request verification
      const { data: canRequest } = await supabase.rpc('can_request_verification', {
        user_id_param: user.user.id
      });

      // Get existing verification request
      const { data: requests } = await supabase
        .from('verification_requests')
        .select('*')
        .eq('user_id', user.user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      const latestRequest = requests?.[0];

      setStatus({
        canRequest: canRequest || false,
        hasRequest: !!latestRequest,
        requestStatus: latestRequest?.status as 'pending' | 'approved' | 'denied' | undefined,
        denialReason: latestRequest?.denial_reason,
        reviewedAt: latestRequest?.reviewed_at
      });
    } catch (error) {
      console.error('Error fetching verification status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestVerification = async () => {
    try {
      setSubmitting(true);
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { error } = await supabase
        .from('verification_requests')
        .insert({
          user_id: user.user.id
        });

      if (error) throw error;

      toast({
        title: "Verification request submitted",
        description: "Your request has been sent for review. You'll be notified once it's processed.",
      });

      fetchVerificationStatus();
    } catch (error: any) {
      console.error('Error submitting verification request:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit verification request",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    fetchVerificationStatus();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = () => {
    switch (status.requestStatus) {
      case 'pending':
        return (
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" />
            Pending Review
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="default" className="gap-1 bg-green-100 text-green-800 border-green-300">
            <CheckCircle className="h-3 w-3" />
            Approved
          </Badge>
        );
      case 'denied':
        return (
          <Badge variant="outline" className="gap-1 border-red-300 text-red-600">
            <XCircle className="h-3 w-3" />
            Denied
          </Badge>
        );
      default:
        return null;
    }
  };

  const getDaysUntilResubmission = () => {
    if (status.requestStatus !== 'denied' || !status.reviewedAt) return 0;
    
    const reviewDate = new Date(status.reviewedAt);
    const thirtyDaysLater = new Date(reviewDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const daysLeft = Math.ceil((thirtyDaysLater.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
    
    return Math.max(0, daysLeft);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Verification Request
        </CardTitle>
        <CardDescription>
          Get verified to show your authenticity to the community
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {status.hasRequest && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Status:</span>
              {getStatusBadge()}
            </div>
            
            {status.requestStatus === 'denied' && status.denialReason && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">
                  <strong>Reason for denial:</strong> {status.denialReason}
                </p>
                {getDaysUntilResubmission() > 0 && (
                  <p className="text-sm text-red-600 mt-2">
                    You can resubmit in {getDaysUntilResubmission()} days
                  </p>
                )}
              </div>
            )}
            
            {status.requestStatus === 'pending' && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">
                  Your verification request is being reviewed by our team. This process typically takes 1-3 business days.
                </p>
              </div>
            )}
          </div>
        )}

        {status.canRequest && (
          <Button 
            onClick={handleRequestVerification}
            disabled={submitting}
            className="w-full"
          >
            {submitting ? 'Submitting...' : 'Request Verification'}
          </Button>
        )}

        {!status.canRequest && !status.hasRequest && (
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
            <p className="text-sm text-gray-600">
              You cannot submit a verification request at this time. Please try again later.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VerificationRequest;