-- Create verification requests table
CREATE TABLE public.verification_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  denial_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, status) -- Only one pending request per user
);

-- Enable RLS on verification_requests
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

-- Policies for verification_requests
CREATE POLICY "Users can view their own verification requests" 
ON public.verification_requests 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create verification requests" 
ON public.verification_requests 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "DarienAdair can review verification requests" 
ON public.verification_requests 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND username = 'DarienAdair'
  )
);

-- Create user preferences table for banner settings
CREATE TABLE public.user_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  show_weather_banner BOOLEAN DEFAULT true,
  show_events_banner BOOLEAN DEFAULT true,
  show_birthday_banner BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on user_preferences
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Policies for user_preferences
CREATE POLICY "Users can manage their own preferences" 
ON public.user_preferences 
FOR ALL 
USING (auth.uid() = user_id);

-- Add birthday field to profiles table
ALTER TABLE public.profiles ADD COLUMN birthday DATE;

-- Create onboarding questions table
CREATE TABLE public.onboarding_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'multiple_choice',
  options JSONB,
  category TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on onboarding_questions
ALTER TABLE public.onboarding_questions ENABLE ROW LEVEL SECURITY;

-- Policy for onboarding_questions
CREATE POLICY "Questions are viewable by everyone" 
ON public.onboarding_questions 
FOR SELECT 
USING (is_active = true);

-- Create user responses table
CREATE TABLE public.user_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.onboarding_questions(id) ON DELETE CASCADE,
  response_value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, question_id)
);

-- Enable RLS on user_responses
ALTER TABLE public.user_responses ENABLE ROW LEVEL SECURITY;

-- Policies for user_responses
CREATE POLICY "Users can manage their own responses" 
ON public.user_responses 
FOR ALL 
USING (auth.uid() = user_id);

-- Create community tags table
CREATE TABLE public.community_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on community_tags
ALTER TABLE public.community_tags ENABLE ROW LEVEL SECURITY;

-- Policy for community_tags
CREATE POLICY "Community tags are viewable by everyone" 
ON public.community_tags 
FOR SELECT 
USING (true);

-- Create user community mappings
CREATE TABLE public.user_communities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.community_tags(id) ON DELETE CASCADE,
  score DECIMAL DEFAULT 1.0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, tag_id)
);

-- Enable RLS on user_communities
ALTER TABLE public.user_communities ENABLE ROW LEVEL SECURITY;

-- Policies for user_communities
CREATE POLICY "Users can view their own communities" 
ON public.user_communities 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Community mappings are viewable by everyone" 
ON public.user_communities 
FOR SELECT 
USING (true);

-- Create function to check verification cooldown
CREATE OR REPLACE FUNCTION public.can_request_verification(user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user has any pending requests
  IF EXISTS (
    SELECT 1 FROM public.verification_requests 
    WHERE user_id = user_id_param AND status = 'pending'
  ) THEN
    RETURN false;
  END IF;
  
  -- Check 30-day cooldown after denial
  IF EXISTS (
    SELECT 1 FROM public.verification_requests 
    WHERE user_id = user_id_param 
    AND status = 'denied' 
    AND reviewed_at > now() - INTERVAL '30 days'
  ) THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

-- Create trigger for updating verification requests timestamp
CREATE TRIGGER update_verification_requests_updated_at
BEFORE UPDATE ON public.verification_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updating user preferences timestamp
CREATE TRIGGER update_user_preferences_updated_at
BEFORE UPDATE ON public.user_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample onboarding questions
INSERT INTO public.onboarding_questions (question_text, question_type, options, category, order_index) VALUES
('What are your main interests?', 'multiple_choice', '["Technology", "Sports", "Arts & Creativity", "Business", "Health & Fitness", "Travel", "Music", "Gaming"]', 'interests', 1),
('What is your professional background?', 'multiple_choice', '["Student", "Tech/Software", "Healthcare", "Education", "Business/Finance", "Creative Arts", "Sports/Fitness", "Entrepreneur", "Other"]', 'professional', 2),
('What type of content do you prefer?', 'multiple_choice', '["Educational", "Entertainment", "Motivational", "News & Current Events", "Personal Stories", "How-to Guides", "Industry Insights"]', 'content', 3),
('What are your main goals?', 'multiple_choice', '["Career Growth", "Learning New Skills", "Building Network", "Starting a Business", "Health & Wellness", "Creative Projects", "Personal Development"]', 'goals', 4),
('How do you prefer to engage?', 'multiple_choice', '["Active Discussions", "Sharing Content", "Learning from Others", "Mentoring Others", "Collaborative Projects"]', 'engagement', 5);

-- Insert sample community tags
INSERT INTO public.community_tags (name, description, color) VALUES
('Tech Enthusiasts', 'People passionate about technology and innovation', '#3B82F6'),
('Fitness Community', 'Health and fitness focused individuals', '#10B981'),
('Creative Minds', 'Artists, designers, and creative professionals', '#8B5CF6'),
('Entrepreneurs', 'Business owners and startup enthusiasts', '#F59E0B'),
('Students', 'Learners and academic community', '#EF4444'),
('Professionals', 'Working professionals across industries', '#6B7280');