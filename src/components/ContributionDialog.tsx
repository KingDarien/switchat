import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { DollarSign, Gift, Heart } from 'lucide-react';

interface Goal {
  id: string;
  title: string;
  description: string;
  funding_target?: number;
  current_funding: number;
  currency: string;
  user_id: string;
  profiles?: {
    display_name?: string;
    username?: string;
  };
}

interface ContributionDialogProps {
  goal: Goal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const ContributionDialog: React.FC<ContributionDialogProps> = ({
  goal,
  open,
  onOpenChange,
  onSuccess
}) => {
  const { toast } = useToast();
  const [contributionType, setContributionType] = useState<'monetary' | 'resource'>('monetary');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [resourceType, setResourceType] = useState('');
  const [resourceDescription, setResourceDescription] = useState('');
  const [estimatedValue, setEstimatedValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!goal) return null;

  const handleMonetaryContribution = async () => {
    setIsSubmitting(true);
    try {
      const contributionAmount = parseFloat(amount);
      if (!contributionAmount || contributionAmount <= 0) {
        toast({
          title: "Invalid Amount",
          description: "Please enter a valid contribution amount.",
          variant: "destructive",
        });
        return;
      }

      // For now, we'll create a pending contribution
      // In production, this would integrate with Stripe
      const { error } = await supabase
        .from('goal_contributions')
        .insert({
          goal_id: goal.id,
          contributor_id: (await supabase.auth.getUser()).data.user?.id,
          amount: contributionAmount,
          currency: goal.currency,
          contribution_type: 'monetary',
          is_anonymous: isAnonymous,
          message: message.trim() || null,
          status: 'pending' // In production, this would be managed by Stripe webhook
        });

      if (error) throw error;

      toast({
        title: "Contribution Submitted",
        description: "Your monetary contribution has been submitted for processing.",
      });

      onSuccess();
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting monetary contribution:', error);
      toast({
        title: "Error",
        description: "Failed to submit contribution. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResourceContribution = async () => {
    setIsSubmitting(true);
    try {
      if (!resourceType.trim() || !resourceDescription.trim()) {
        toast({
          title: "Missing Information",
          description: "Please provide resource type and description.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('goal_resources')
        .insert({
          goal_id: goal.id,
          contributor_id: (await supabase.auth.getUser()).data.user?.id,
          resource_type: resourceType.trim(),
          resource_description: resourceDescription.trim(),
          estimated_value: estimatedValue ? parseFloat(estimatedValue) : null,
          is_anonymous: isAnonymous,
          status: 'offered'
        });

      if (error) throw error;

      toast({
        title: "Resource Offered",
        description: "Your resource contribution has been offered to the goal creator.",
      });

      onSuccess();
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting resource contribution:', error);
      toast({
        title: "Error",
        description: "Failed to submit resource contribution. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setAmount('');
    setMessage('');
    setResourceType('');
    setResourceDescription('');
    setEstimatedValue('');
    setIsAnonymous(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: goal.currency || 'USD',
    }).format(amount);
  };

  const fundingProgress = goal.funding_target ? 
    (goal.current_funding / goal.funding_target) * 100 : 0;
  const remainingAmount = goal.funding_target ? 
    Math.max(0, goal.funding_target - goal.current_funding) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Support "{goal.title}"</DialogTitle>
        </DialogHeader>

        {/* Goal Summary */}
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{goal.title}</CardTitle>
              <Badge variant="outline">
                by {goal.profiles?.display_name || goal.profiles?.username || 'Anonymous'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {goal.funding_target && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span className="font-medium">
                    {formatCurrency(goal.current_funding)} / {formatCurrency(goal.funding_target)}
                  </span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(100, fundingProgress)}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(remainingAmount)} still needed
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Tabs value={contributionType} onValueChange={(value) => setContributionType(value as 'monetary' | 'resource')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="monetary" className="flex items-center gap-2">
              <DollarSign size={16} />
              Monetary
            </TabsTrigger>
            <TabsTrigger value="resource" className="flex items-center gap-2">
              <Gift size={16} />
              Resources
            </TabsTrigger>
          </TabsList>

          <TabsContent value="monetary" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign size={20} />
                  Make a Financial Contribution
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount ({goal.currency})</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="0.01"
                    step="0.01"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message (Optional)</Label>
                  <Textarea
                    id="message"
                    placeholder="Leave an encouraging message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="anonymous-monetary"
                    checked={isAnonymous}
                    onCheckedChange={setIsAnonymous}
                  />
                  <Label htmlFor="anonymous-monetary">Contribute anonymously</Label>
                </div>

                <Button 
                  onClick={handleMonetaryContribution}
                  disabled={isSubmitting || !amount}
                  className="w-full"
                >
                  {isSubmitting ? 'Processing...' : `Contribute ${amount ? formatCurrency(parseFloat(amount) || 0) : ''}`}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resource" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Gift size={20} />
                  Offer Resources or Services
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="resourceType">Resource Type</Label>
                  <Input
                    id="resourceType"
                    placeholder="e.g., Design Services, Equipment, Skills..."
                    value={resourceType}
                    onChange={(e) => setResourceType(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="resourceDescription">Description</Label>
                  <Textarea
                    id="resourceDescription"
                    placeholder="Describe what you're offering and how it can help..."
                    value={resourceDescription}
                    onChange={(e) => setResourceDescription(e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estimatedValue">Estimated Value (Optional)</Label>
                  <Input
                    id="estimatedValue"
                    type="number"
                    placeholder="0.00"
                    value={estimatedValue}
                    onChange={(e) => setEstimatedValue(e.target.value)}
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="anonymous-resource"
                    checked={isAnonymous}
                    onCheckedChange={setIsAnonymous}
                  />
                  <Label htmlFor="anonymous-resource">Offer anonymously</Label>
                </div>

                <Button 
                  onClick={handleResourceContribution}
                  disabled={isSubmitting || !resourceType.trim() || !resourceDescription.trim()}
                  className="w-full"
                >
                  {isSubmitting ? 'Submitting...' : 'Offer Resource'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-4 p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <Heart className="h-4 w-4" />
            How Contributions Work
          </h4>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• Monetary contributions are held securely until goal approval</li>
            <li>• Goals must be approved by admins before funds are released</li>
            <li>• If a goal is rejected, all funds are automatically refunded</li>
            <li>• Resource contributions connect you directly with goal creators</li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContributionDialog;