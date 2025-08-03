import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Question {
  id: string;
  question_text: string;
  question_type: string;
  options: any;
  category: string;
  order_index: number;
}

interface OnboardingQuestionnaireProps {
  onComplete: () => void;
}

const OnboardingQuestionnaire: React.FC<OnboardingQuestionnaireProps> = ({ onComplete }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const fetchQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('onboarding_questions')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (error) throw error;
      const formattedQuestions = (data || []).map(q => ({
        ...q,
        options: Array.isArray(q.options) ? q.options : JSON.parse(q.options as string)
      }));
      setQuestions(formattedQuestions);
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = (questionId: string, response: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: response
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      submitResponses();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const submitResponses = async () => {
    try {
      setSubmitting(true);
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      // Save responses
      const responseData = Object.entries(responses).map(([questionId, response]) => ({
        user_id: user.user.id,
        question_id: questionId,
        response_value: response
      }));

      const { error: responseError } = await supabase
        .from('user_responses')
        .insert(responseData);

      if (responseError) throw responseError;

      // Generate community tags based on responses
      await generateCommunityTags(user.user.id);

      toast({
        title: "Welcome to the community!",
        description: "Your profile has been set up based on your responses.",
      });

      onComplete();
    } catch (error: any) {
      console.error('Error submitting responses:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save your responses",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const generateCommunityTags = async (userId: string) => {
    try {
      // Simple algorithm to assign community tags based on responses
      const communityMappings: Array<{ tag_name: string; score: number }> = [];

      // Analyze responses to determine community fit
      Object.values(responses).forEach(response => {
        switch (response.toLowerCase()) {
          case 'technology':
          case 'tech/software':
            communityMappings.push({ tag_name: 'Tech Enthusiasts', score: 1.0 });
            break;
          case 'health & fitness':
          case 'sports/fitness':
            communityMappings.push({ tag_name: 'Fitness Community', score: 1.0 });
            break;
          case 'arts & creativity':
          case 'creative arts':
            communityMappings.push({ tag_name: 'Creative Minds', score: 1.0 });
            break;
          case 'business':
          case 'business/finance':
          case 'starting a business':
            communityMappings.push({ tag_name: 'Entrepreneurs', score: 1.0 });
            break;
          case 'student':
          case 'learning new skills':
            communityMappings.push({ tag_name: 'Students', score: 1.0 });
            break;
          default:
            communityMappings.push({ tag_name: 'Professionals', score: 0.5 });
        }
      });

      // Get unique tags with highest scores
      const uniqueTags = communityMappings.reduce((acc, curr) => {
        const existing = acc.find(item => item.tag_name === curr.tag_name);
        if (existing) {
          existing.score = Math.max(existing.score, curr.score);
        } else {
          acc.push(curr);
        }
        return acc;
      }, [] as Array<{ tag_name: string; score: number }>);

      // Fetch tag IDs and create user community mappings
      for (const mapping of uniqueTags) {
        const { data: tag } = await supabase
          .from('community_tags')
          .select('id')
          .eq('name', mapping.tag_name)
          .single();

        if (tag) {
          await supabase
            .from('user_communities')
            .upsert({
              user_id: userId,
              tag_id: tag.id,
              score: mapping.score
            });
        }
      }
    } catch (error) {
      console.error('Error generating community tags:', error);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  if (loading) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-10 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (questions.length === 0) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">No questions available at this time.</p>
          <Button onClick={onComplete} className="w-full mt-4">Continue</Button>
        </CardContent>
      </Card>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const currentResponse = responses[currentQuestion.id] || '';

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Let's get to know you better</CardTitle>
        <CardDescription>
          Answer a few questions to help us connect you with the right community
        </CardDescription>
        <Progress value={progress} className="w-full" />
        <div className="text-sm text-muted-foreground">
          Question {currentQuestionIndex + 1} of {questions.length}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-4">{currentQuestion.question_text}</h3>
          
          <div className="grid gap-2">
            {currentQuestion.options.map((option) => (
              <label
                key={option}
                className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                  currentResponse === option
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-muted/50'
                }`}
              >
                <input
                  type="radio"
                  name={currentQuestion.id}
                  value={option}
                  checked={currentResponse === option}
                  onChange={(e) => handleResponse(currentQuestion.id, e.target.value)}
                  className="sr-only"
                />
                <span className="text-sm">{option}</span>
              </label>
            ))}
          </div>
        </div>
        
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </Button>
          
          <Button
            onClick={handleNext}
            disabled={!currentResponse || submitting}
          >
            {submitting
              ? 'Finishing...'
              : currentQuestionIndex === questions.length - 1
              ? 'Complete'
              : 'Next'
            }
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default OnboardingQuestionnaire;