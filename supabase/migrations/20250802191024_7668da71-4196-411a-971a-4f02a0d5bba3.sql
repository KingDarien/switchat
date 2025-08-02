-- Create the "God" account
INSERT INTO auth.users (
  id,
  email,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'god@divine.faith',
  now(),
  now(),
  now(),
  '{"username": "God", "display_name": "God"}'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- Create the God profile
INSERT INTO public.profiles (
  user_id,
  username,
  display_name,
  bio,
  is_verified,
  verification_tier,
  trust_score,
  user_role
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'God',
  'God',
  'Daily Scripture & Divine Wisdom 🙏',
  true,
  'diamond',
  100,
  'admin'
) ON CONFLICT (user_id) DO NOTHING;

-- Create table to track daily scripture posts
CREATE TABLE IF NOT EXISTS public.daily_scriptures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_date DATE NOT NULL UNIQUE,
  post_id UUID REFERENCES public.posts(id),
  scripture_reference TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.daily_scriptures ENABLE ROW LEVEL SECURITY;

-- Create policy for viewing scripture posts
CREATE POLICY "Scripture posts are viewable by everyone" 
ON public.daily_scriptures 
FOR SELECT 
USING (true);

-- Create policy for creating scripture posts (only by God account)
CREATE POLICY "Only God can create scripture posts" 
ON public.daily_scriptures 
FOR INSERT 
WITH CHECK (auth.uid() = '00000000-0000-0000-0000-000000000001'::uuid);

-- Enable pg_cron extension for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;