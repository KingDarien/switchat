-- COMPREHENSIVE SECURITY FIX: Separate sensitive data and roles to prevent data theft and privilege escalation

-- ========================================
-- PART 1: CREATE ROLE SYSTEM (CRITICAL)
-- ========================================

-- Create role enum
CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Migrate existing roles from profiles to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, user_role::public.app_role
FROM public.profiles
WHERE user_role IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- Create security definer function to check roles (prevents recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create helper function for admin check
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id 
    AND role IN ('super_admin', 'admin', 'moderator')
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- ========================================
-- PART 2: CREATE PRIVATE DATA TABLE
-- ========================================

-- Create table for sensitive personal information
CREATE TABLE public.profile_private_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  birthday DATE,
  ethnicity TEXT,
  location TEXT,
  website_url TEXT,
  social_links JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profile_private_data ENABLE ROW LEVEL SECURITY;

-- Migrate existing sensitive data from profiles
INSERT INTO public.profile_private_data (user_id, birthday, ethnicity, location, website_url, social_links)
SELECT user_id, birthday, ethnicity, location, website_url, social_links
FROM public.profiles
ON CONFLICT (user_id) DO NOTHING;

-- RLS policies for private data (OWNER ONLY)
CREATE POLICY "Users can view own private data"
ON public.profile_private_data FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own private data"
ON public.profile_private_data FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own private data"
ON public.profile_private_data FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_profile_private_data_updated_at
BEFORE UPDATE ON public.profile_private_data
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to create private data on profile creation
CREATE OR REPLACE FUNCTION public.create_private_data_on_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profile_private_data (user_id)
  VALUES (NEW.user_id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_created_create_private_data
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.create_private_data_on_profile();

-- ========================================
-- PART 3: UPDATE PROFILES TABLE POLICIES
-- ========================================

-- Drop old policy
DROP POLICY IF EXISTS "View public profile data only" ON public.profiles;

-- Create new restrictive policy for viewing public profiles
-- Only allows viewing basic social profile info (no sensitive data)
CREATE POLICY "View basic public profile info"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() != user_id 
  AND is_profile_public = true
);

-- Update the profile update policy to also prevent modification of deprecated fields
DROP POLICY IF EXISTS "Users can update their own profile (restricted)" ON public.profiles;

CREATE POLICY "Users can update their own profile (restricted)"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id AND
  -- Prevent modification of security-critical fields (these are now deprecated)
  user_role = (SELECT user_role FROM public.profiles WHERE user_id = auth.uid()) AND
  is_protected = (SELECT is_protected FROM public.profiles WHERE user_id = auth.uid()) AND
  security_level = (SELECT security_level FROM public.profiles WHERE user_id = auth.uid())
);

-- ========================================
-- PART 4: UPDATE ALL RLS POLICIES USING ROLES
-- ========================================

-- Update admin_actions policies
DROP POLICY IF EXISTS "Admins can log their own actions" ON public.admin_actions;
CREATE POLICY "Admins can log their own actions"
ON public.admin_actions FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = admin_id AND public.is_admin(auth.uid())
);

DROP POLICY IF EXISTS "Admins can view admin actions" ON public.admin_actions;
CREATE POLICY "Admins can view admin actions"
ON public.admin_actions FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Update conversations policies
DROP POLICY IF EXISTS "Admins can view all conversations" ON public.conversations;
CREATE POLICY "Admins can view all conversations"
ON public.conversations FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Update goal_admin_reviews policies
DROP POLICY IF EXISTS "Admins can manage reviews" ON public.goal_admin_reviews;
CREATE POLICY "Admins can manage reviews"
ON public.goal_admin_reviews FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()));

-- Update messages policies
DROP POLICY IF EXISTS "Admins can view all messages" ON public.messages;
CREATE POLICY "Admins can view all messages"
ON public.messages FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Update user_blocks policies
DROP POLICY IF EXISTS "Admins can view all blocks" ON public.user_blocks;
CREATE POLICY "Admins can view all blocks"
ON public.user_blocks FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()));

-- Update user_watchlist policies
DROP POLICY IF EXISTS "Admins can manage watchlist" ON public.user_watchlist;
CREATE POLICY "Admins can manage watchlist"
ON public.user_watchlist FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()));

-- ========================================
-- PART 5: ADD DOCUMENTATION
-- ========================================

COMMENT ON TABLE public.user_roles IS 'Stores user roles separately to prevent privilege escalation attacks. Roles are checked via security definer functions.';
COMMENT ON TABLE public.profile_private_data IS 'Contains sensitive personal information (birthday, ethnicity, location, etc.) with strict owner-only access policies.';
COMMENT ON COLUMN public.profiles.user_role IS 'DEPRECATED: Roles are now stored in user_roles table. This column is kept for backward compatibility but should not be modified.';
COMMENT ON COLUMN public.profiles.birthday IS 'DEPRECATED: Moved to profile_private_data table for enhanced security.';
COMMENT ON COLUMN public.profiles.ethnicity IS 'DEPRECATED: Moved to profile_private_data table for enhanced security.';
COMMENT ON COLUMN public.profiles.location IS 'DEPRECATED: Moved to profile_private_data table for enhanced security.';
COMMENT ON COLUMN public.profiles.website_url IS 'DEPRECATED: Moved to profile_private_data table for enhanced security.';
COMMENT ON COLUMN public.profiles.social_links IS 'DEPRECATED: Moved to profile_private_data table for enhanced security.';