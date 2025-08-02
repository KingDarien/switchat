-- Transform user_goals table for crowdfunding
ALTER TABLE public.user_goals 
ADD COLUMN funding_target DECIMAL(10,2),
ADD COLUMN current_funding DECIMAL(10,2) DEFAULT 0,
ADD COLUMN currency TEXT DEFAULT 'USD',
ADD COLUMN is_public BOOLEAN DEFAULT true,
ADD COLUMN is_anonymous BOOLEAN DEFAULT false,
ADD COLUMN approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected', 'under_review')),
ADD COLUMN admin_notes TEXT,
ADD COLUMN rejection_reason TEXT,
ADD COLUMN submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN funding_deadline DATE;

-- Create goal_contributions table
CREATE TABLE public.goal_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES public.user_goals(id) ON DELETE CASCADE,
  contributor_id UUID NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  stripe_payment_intent_id TEXT,
  contribution_type TEXT DEFAULT 'monetary' CHECK (contribution_type IN ('monetary', 'resource')),
  is_anonymous BOOLEAN DEFAULT false,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'refunded')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  refunded_at TIMESTAMP WITH TIME ZONE
);

-- Create goal_resources table for non-monetary support
CREATE TABLE public.goal_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES public.user_goals(id) ON DELETE CASCADE,
  contributor_id UUID NOT NULL,
  resource_type TEXT NOT NULL,
  resource_description TEXT NOT NULL,
  estimated_value DECIMAL(10,2),
  is_anonymous BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'offered' CHECK (status IN ('offered', 'accepted', 'declined', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create goal_admin_reviews table
CREATE TABLE public.goal_admin_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES public.user_goals(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL,
  review_type TEXT NOT NULL CHECK (review_type IN ('initial', 'appeal')),
  decision TEXT NOT NULL CHECK (decision IN ('approved', 'rejected', 'needs_info')),
  reason TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  appeal_text TEXT
);

-- Create user_watchlist table
CREATE TABLE public.user_watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  added_by_admin_id UUID NOT NULL,
  reason TEXT NOT NULL,
  risk_level TEXT DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  notes TEXT
);

-- Add user roles to profiles table
ALTER TABLE public.profiles 
ADD COLUMN user_role TEXT DEFAULT 'user' CHECK (user_role IN ('user', 'admin', 'moderator')),
ADD COLUMN trust_score INTEGER DEFAULT 0,
ADD COLUMN goals_completed INTEGER DEFAULT 0,
ADD COLUMN total_contributions_made DECIMAL(10,2) DEFAULT 0;

-- Enable RLS on new tables
ALTER TABLE public.goal_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_admin_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_watchlist ENABLE ROW LEVEL SECURITY;

-- RLS policies for goal_contributions
CREATE POLICY "Users can view contributions to public goals" ON public.goal_contributions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_goals 
      WHERE id = goal_id AND (is_public = true OR user_id = auth.uid())
    )
  );

CREATE POLICY "Users can create their own contributions" ON public.goal_contributions
  FOR INSERT WITH CHECK (auth.uid() = contributor_id);

CREATE POLICY "Goal owners can view all contributions" ON public.goal_contributions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_goals 
      WHERE id = goal_id AND user_id = auth.uid()
    )
  );

-- RLS policies for goal_resources
CREATE POLICY "Users can view resources for public goals" ON public.goal_resources
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_goals 
      WHERE id = goal_id AND (is_public = true OR user_id = auth.uid())
    )
  );

CREATE POLICY "Users can offer their own resources" ON public.goal_resources
  FOR INSERT WITH CHECK (auth.uid() = contributor_id);

CREATE POLICY "Goal owners can update resource status" ON public.goal_resources
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_goals 
      WHERE id = goal_id AND user_id = auth.uid()
    )
  );

-- RLS policies for admin_reviews (admins only)
CREATE POLICY "Admins can manage reviews" ON public.goal_admin_reviews
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND user_role IN ('admin', 'moderator')
    )
  );

-- RLS policies for watchlist (admins only)
CREATE POLICY "Admins can manage watchlist" ON public.user_watchlist
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND user_role IN ('admin', 'moderator')
    )
  );

-- Update user_goals policies to include approval status
DROP POLICY IF EXISTS "Users can view their own goals" ON public.user_goals;
CREATE POLICY "Users can view their own goals" ON public.user_goals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view approved public goals" ON public.user_goals
  FOR SELECT USING (is_public = true AND approval_status = 'approved');

-- Functions for updating funding and trust scores
CREATE OR REPLACE FUNCTION update_goal_funding()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.user_goals 
  SET current_funding = (
    SELECT COALESCE(SUM(amount), 0) 
    FROM public.goal_contributions 
    WHERE goal_id = NEW.goal_id AND status = 'completed'
  )
  WHERE id = NEW.goal_id;
  
  -- Update user's total contributions
  UPDATE public.profiles 
  SET total_contributions_made = (
    SELECT COALESCE(SUM(amount), 0) 
    FROM public.goal_contributions 
    WHERE contributor_id = NEW.contributor_id AND status = 'completed'
  )
  WHERE user_id = NEW.contributor_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_goal_funding_trigger
  AFTER INSERT OR UPDATE ON public.goal_contributions
  FOR EACH ROW
  EXECUTE FUNCTION update_goal_funding();

-- Function to update trust score when goals are completed
CREATE OR REPLACE FUNCTION update_trust_score()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_completed = true AND OLD.is_completed = false THEN
    UPDATE public.profiles 
    SET 
      goals_completed = goals_completed + 1,
      trust_score = trust_score + 10
    WHERE user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_trust_score_trigger
  AFTER UPDATE ON public.user_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_trust_score();