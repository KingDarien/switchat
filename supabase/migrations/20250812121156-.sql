-- Secure profiles: restrict reads to authenticated users only
-- 1) Remove public-read policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- 2) Allow only authenticated users to read profiles
CREATE POLICY "Authenticated users can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Keep existing INSERT/UPDATE self policies unchanged