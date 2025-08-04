-- Add missing profile fields for enhanced user profiles
ALTER TABLE public.profiles 
ADD COLUMN ethnicity TEXT,
ADD COLUMN background_theme JSONB DEFAULT '{"type": "solid", "colors": ["#1a1a1a", "#2a2a2a"]}'::jsonb,
ADD COLUMN background_music_url TEXT,
ADD COLUMN background_music_title TEXT,
ADD COLUMN interests TEXT[];

-- Update user_communities table to allow user participation
ALTER TABLE public.user_communities 
DROP POLICY IF EXISTS "Community mappings are viewable by everyone",
DROP POLICY IF EXISTS "Users can view their own communities";

-- Create new policies for user_communities
CREATE POLICY "Community mappings are viewable by everyone" 
ON public.user_communities 
FOR SELECT 
USING (true);

CREATE POLICY "Users can join communities" 
ON public.user_communities 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave communities" 
ON public.user_communities 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their community participation" 
ON public.user_communities 
FOR UPDATE 
USING (auth.uid() = user_id);