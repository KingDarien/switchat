-- ==========================================
-- SECURITY FIX: Profile PII Protection
-- ==========================================
-- This migration addresses critical security issues by:
-- 1. Migrating sensitive PII from profiles to profile_private_data
-- 2. Removing sensitive columns from profiles table
-- 3. Requiring authentication to view any profile data

-- Step 1: Ensure all users have a profile_private_data record
INSERT INTO public.profile_private_data (user_id, birthday, location, ethnicity, website_url, social_links)
SELECT 
  user_id,
  birthday,
  location,
  ethnicity,
  website_url,
  social_links
FROM public.profiles
WHERE user_id NOT IN (SELECT user_id FROM public.profile_private_data)
ON CONFLICT (user_id) DO NOTHING;

-- Step 2: Migrate any existing data from profiles to profile_private_data for users who already have records
UPDATE public.profile_private_data ppd
SET 
  birthday = COALESCE(ppd.birthday, p.birthday),
  location = COALESCE(ppd.location, p.location),
  ethnicity = COALESCE(ppd.ethnicity, p.ethnicity),
  website_url = COALESCE(ppd.website_url, p.website_url),
  social_links = COALESCE(ppd.social_links, p.social_links)
FROM public.profiles p
WHERE ppd.user_id = p.user_id
  AND (ppd.birthday IS NULL OR ppd.location IS NULL OR ppd.ethnicity IS NULL 
       OR ppd.website_url IS NULL OR ppd.social_links IS NULL);

-- Step 3: Drop sensitive columns from profiles table
ALTER TABLE public.profiles DROP COLUMN IF EXISTS birthday;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS location;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS ethnicity;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS website_url;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS social_links;

-- Step 4: Drop the overly permissive public profile policy
DROP POLICY IF EXISTS "View basic public profile info" ON public.profiles;

-- Step 5: Create new restrictive policy requiring authentication
CREATE POLICY "Authenticated users can view public profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  (auth.uid() <> user_id) AND (is_profile_public = true)
);

-- Step 6: Add admin view policy for profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  public.is_admin(auth.uid())
);

-- Step 7: Ensure profile_private_data has proper indexes for performance
CREATE INDEX IF NOT EXISTS idx_profile_private_data_user_id 
ON public.profile_private_data(user_id);

-- ==========================================
-- SECURITY ENHANCEMENT COMPLETE
-- ==========================================
-- Changes made:
-- ✓ All sensitive PII moved to profile_private_data table
-- ✓ Sensitive columns removed from profiles table
-- ✓ Authentication now required to view any profile data
-- ✓ Admins have full access for moderation
-- ✓ Users' own complete profiles always visible
-- ==========================================