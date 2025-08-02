-- First, create the niches table to store different user categories/industries
CREATE TABLE public.niches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add sample niches
INSERT INTO public.niches (name, description, icon) VALUES
('Tech & Startups', 'Technology entrepreneurs and startup founders', '💻'),
('Content Creator', 'YouTubers, bloggers, influencers, and digital creators', '🎥'),
('Business & Finance', 'Business professionals, consultants, and financial experts', '💼'),
('Health & Wellness', 'Fitness trainers, nutritionists, and wellness coaches', '🏃‍♀️'),
('Creative Arts', 'Artists, designers, musicians, and creative professionals', '🎨'),
('Education', 'Teachers, tutors, and educational content creators', '📚'),
('Real Estate', 'Real estate agents and property investors', '🏠'),
('Food & Culinary', 'Chefs, food bloggers, and culinary professionals', '👨‍🍳'),
('Travel & Lifestyle', 'Travel bloggers and lifestyle influencers', '✈️'),
('Sports & Gaming', 'Athletes, gamers, and sports professionals', '🏆');

-- Enhance the profiles table with new fields
ALTER TABLE public.profiles 
ADD COLUMN niche_id UUID REFERENCES public.niches(id),
ADD COLUMN popularity_score INTEGER DEFAULT 0,
ADD COLUMN current_rank INTEGER,
ADD COLUMN location TEXT,
ADD COLUMN website_url TEXT,
ADD COLUMN social_links JSONB DEFAULT '{}';

-- Create user_rankings table to track popularity history
CREATE TABLE public.user_rankings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  niche_id UUID REFERENCES public.niches(id),
  popularity_score INTEGER NOT NULL DEFAULT 0,
  rank_position INTEGER,
  calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create growth_tips table for niche-specific advice
CREATE TABLE public.growth_tips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  niche_id UUID NOT NULL REFERENCES public.niches(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  min_followers INTEGER DEFAULT 0,
  max_followers INTEGER,
  tip_type TEXT DEFAULT 'general', -- 'general', 'content', 'networking', 'business'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add sample growth tips
INSERT INTO public.growth_tips (niche_id, title, description, min_followers, max_followers, tip_type) 
SELECT n.id, 'Build Your Personal Brand', 'Start by clearly defining your unique value proposition and consistently sharing valuable content in your niche.', 0, 100, 'general'
FROM public.niches n WHERE n.name = 'Tech & Startups';

INSERT INTO public.growth_tips (niche_id, title, description, min_followers, max_followers, tip_type)
SELECT n.id, 'Engage with Your Community', 'Reply to comments, participate in discussions, and build genuine relationships with your audience.', 0, 500, 'networking'
FROM public.niches n WHERE n.name = 'Content Creator';

-- Create user_goals table for personal goal tracking
CREATE TABLE public.user_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_value INTEGER,
  current_value INTEGER DEFAULT 0,
  goal_type TEXT NOT NULL, -- 'followers', 'posts', 'engagement', 'custom'
  target_date DATE,
  is_completed BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create events table for event discovery
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL, -- 'networking', 'workshop', 'conference', 'social', 'business'
  location_name TEXT,
  address TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  max_attendees INTEGER,
  is_free BOOLEAN DEFAULT true,
  price DECIMAL(10, 2),
  image_url TEXT,
  tags TEXT[],
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create event_attendees table to track participation
CREATE TABLE public.event_attendees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'going', -- 'going', 'interested', 'not_going'
  registered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Enable RLS on all new tables
ALTER TABLE public.niches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.growth_tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_attendees ENABLE ROW LEVEL SECURITY;

-- RLS Policies for niches (public read)
CREATE POLICY "Niches are viewable by everyone" 
ON public.niches FOR SELECT USING (true);

-- RLS Policies for user_rankings (public read)
CREATE POLICY "Rankings are viewable by everyone" 
ON public.user_rankings FOR SELECT USING (true);

-- RLS Policies for growth_tips (public read)
CREATE POLICY "Growth tips are viewable by everyone" 
ON public.growth_tips FOR SELECT USING (true);

-- RLS Policies for user_goals
CREATE POLICY "Users can view their own goals" 
ON public.user_goals FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own goals" 
ON public.user_goals FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals" 
ON public.user_goals FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals" 
ON public.user_goals FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for events
CREATE POLICY "Events are viewable by everyone" 
ON public.events FOR SELECT USING (true);

CREATE POLICY "Users can create events" 
ON public.events FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can update their own events" 
ON public.events FOR UPDATE USING (auth.uid() = creator_id);

CREATE POLICY "Users can delete their own events" 
ON public.events FOR DELETE USING (auth.uid() = creator_id);

-- RLS Policies for event_attendees
CREATE POLICY "Event attendees are viewable by everyone" 
ON public.event_attendees FOR SELECT USING (true);

CREATE POLICY "Users can register for events" 
ON public.event_attendees FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own attendance" 
ON public.event_attendees FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own attendance" 
ON public.event_attendees FOR DELETE USING (auth.uid() = user_id);

-- Create triggers for updated_at columns
CREATE TRIGGER update_user_goals_updated_at
  BEFORE UPDATE ON public.user_goals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_profiles_niche_id ON public.profiles(niche_id);
CREATE INDEX idx_profiles_popularity_score ON public.profiles(popularity_score DESC);
CREATE INDEX idx_user_rankings_user_id ON public.user_rankings(user_id);
CREATE INDEX idx_user_rankings_niche_id ON public.user_rankings(niche_id);
CREATE INDEX idx_growth_tips_niche_id ON public.growth_tips(niche_id);
CREATE INDEX idx_user_goals_user_id ON public.user_goals(user_id);
CREATE INDEX idx_events_location ON public.events(latitude, longitude);
CREATE INDEX idx_events_start_date ON public.events(start_date);
CREATE INDEX idx_event_attendees_event_id ON public.event_attendees(event_id);
CREATE INDEX idx_event_attendees_user_id ON public.event_attendees(user_id);