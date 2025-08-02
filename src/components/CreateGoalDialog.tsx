import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CalendarIcon, DollarSign, Target, Info } from 'lucide-react';
import { format } from 'date-fns';

interface CreateGoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const goalTypes = [
  { value: 'followers', label: 'Followers', icon: '👥', description: 'Grow your follower count' },
  { value: 'posts', label: 'Posts', icon: '📝', description: 'Content creation goals' },
  { value: 'engagement', label: 'Engagement', icon: '❤️', description: 'Likes, comments, shares' },
  { value: 'financial', label: 'Financial', icon: '💰', description: 'Fundraising goals' },
  { value: 'education', label: 'Education', icon: '🎓', description: 'Learning and courses' },
  { value: 'health', label: 'Health', icon: '💪', description: 'Fitness and wellness' },
  { value: 'creative', label: 'Creative', icon: '🎨', description: 'Art, music, writing' },
  { value: 'business', label: 'Business', icon: '💼', description: 'Startup and business goals' },
  { value: 'community', label: 'Community', icon: '🤝', description: 'Community building' },
  { value: 'other', label: 'Other', icon: '🎯', description: 'Custom goals' }
];

const CreateGoalDialog: React.FC<CreateGoalDialogProps> = ({ open, onOpenChange, onSuccess }) => {
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [goalType, setGoalType] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [fundingTarget, setFundingTarget] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [targetDate, setTargetDate] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [requiresFunding, setRequiresFunding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedGoalType = goalTypes.find(type => type.value === goalType);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !goalType) {
      toast({
        title: "Missing Information",
        description: "Please provide a title and select a goal type.",
        variant: "destructive",
      });
      return;
    }

    if (requiresFunding && (!fundingTarget || parseFloat(fundingTarget) <= 0)) {
      toast({
        title: "Invalid Funding Target",
        description: "Please provide a valid funding target amount.",
        variant: "destructive",
      });
      return;
    }

    if (!requiresFunding && (!targetValue || parseInt(targetValue) <= 0)) {
      toast({
        title: "Invalid Target Value",
        description: "Please provide a valid target value.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const goalData = {
        user_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        goal_type: goalType,
        target_value: requiresFunding ? null : parseInt(targetValue) || null,
        funding_target: requiresFunding ? parseFloat(fundingTarget) : null,
        currency: requiresFunding ? currency : 'USD',
        target_date: targetDate || null,
        is_public: isPublic,
        is_anonymous: isAnonymous,
        approval_status: 'pending',
        submitted_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('user_goals')
        .insert(goalData);

      if (error) throw error;

      toast({
        title: "Goal Created",
        description: "Your goal has been submitted for admin review.",
      });

      resetForm();
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating goal:', error);
      toast({
        title: "Error",
        description: "Failed to create goal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setGoalType('');
    setTargetValue('');
    setFundingTarget('');
    setCurrency('USD');
    setTargetDate('');
    setIsPublic(true);
    setIsAnonymous(false);
    setRequiresFunding(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Goal</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Goal Title *</Label>
                <Input
                  id="title"
                  placeholder="What do you want to achieve?"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your goal in detail..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="goalType">Goal Type *</Label>
                <Select value={goalType} onValueChange={setGoalType} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select goal type" />
                  </SelectTrigger>
                  <SelectContent>
                    {goalTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <span>{type.icon}</span>
                          <div>
                            <div className="font-medium">{type.label}</div>
                            <div className="text-xs text-muted-foreground">{type.description}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedGoalType && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{selectedGoalType.icon}</span>
                    <span className="font-medium">{selectedGoalType.label}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{selectedGoalType.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Goal Targets */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target size={20} />
                Goal Targets
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="requiresFunding"
                  checked={requiresFunding}
                  onCheckedChange={setRequiresFunding}
                />
                <Label htmlFor="requiresFunding">This goal requires financial support</Label>
              </div>

              {requiresFunding ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fundingTarget">Funding Target *</Label>
                    <div className="flex gap-2">
                      <Select value={currency} onValueChange={setCurrency}>
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                          <SelectItem value="CAD">CAD</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        id="fundingTarget"
                        type="number"
                        placeholder="0.00"
                        value={fundingTarget}
                        onChange={(e) => setFundingTarget(e.target.value)}
                        min="0.01"
                        step="0.01"
                        className="flex-1"
                        required={requiresFunding}
                      />
                    </div>
                  </div>
                  
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <DollarSign className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-blue-900">Crowdfunding Goal</p>
                        <p className="text-blue-700">
                          Your supporters can contribute money to help you reach this goal. 
                          Funds will be held securely until admin approval.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="targetValue">Target Value *</Label>
                  <Input
                    id="targetValue"
                    type="number"
                    placeholder="e.g., 1000 for 1000 followers"
                    value={targetValue}
                    onChange={(e) => setTargetValue(e.target.value)}
                    min="1"
                    required={!requiresFunding}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="targetDate">Target Date (Optional)</Label>
                <Input
                  id="targetDate"
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  min={format(new Date(), 'yyyy-MM-dd')}
                />
              </div>
            </CardContent>
          </Card>

          {/* Privacy Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Privacy Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="isPublic"
                  checked={isPublic}
                  onCheckedChange={setIsPublic}
                />
                <Label htmlFor="isPublic">Make this goal public</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Public goals can be discovered and supported by anyone. Private goals are only visible to you.
              </p>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isAnonymous"
                  checked={isAnonymous}
                  onCheckedChange={setIsAnonymous}
                />
                <Label htmlFor="isAnonymous">Create anonymously</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Anonymous goals hide your identity from supporters and the public.
              </p>
            </CardContent>
          </Card>

          {/* Review Process Info */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-900">Review Process</p>
                <p className="text-amber-700">
                  All goals are reviewed by our admin team to ensure they meet our community guidelines. 
                  You'll be notified once your goal is approved or if any changes are needed.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Creating...' : 'Create Goal'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateGoalDialog;