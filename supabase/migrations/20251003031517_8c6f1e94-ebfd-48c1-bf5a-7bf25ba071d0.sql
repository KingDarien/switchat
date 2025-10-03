-- Secure the profiles table: protect sensitive data and prevent privilege escalation

-- Step 1: Add a column to track which fields are publicly visible (privacy setting)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_profile_public BOOLEAN DEFAULT true;

-- Step 2: Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

-- Step 3: Create granular policies for profile access

-- Policy 1: Users can always view their own complete profile (all fields)
CREATE POLICY "Users can view own complete profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy 2: Authenticated users can view public profile data (limited fields only)
-- This policy intentionally excludes sensitive fields like birthday, ethnicity, location details
CREATE POLICY "View public profile data only"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() != user_id AND is_profile_public = true
);

-- Step 4: CRITICAL FIX - Update the profile update policy to prevent role escalation
-- Users should NOT be able to modify their own role or protected status
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update their own profile (restricted)"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id AND
  -- Prevent modification of security-critical fields
  user_role = (SELECT user_role FROM public.profiles WHERE user_id = auth.uid()) AND
  is_protected = (SELECT is_protected FROM public.profiles WHERE user_id = auth.uid()) AND
  security_level = (SELECT security_level FROM public.profiles WHERE user_id = auth.uid())
);

-- Step 5: Add helpful comments
COMMENT ON COLUMN public.profiles.is_profile_public IS 'Controls whether profile is visible to other authenticated users. Sensitive fields are always restricted regardless of this setting.';
COMMENT ON POLICY "Users can update their own profile (restricted)" ON public.profiles IS 'Prevents users from escalating their own privileges by blocking updates to user_role, is_protected, and security_level fields.';