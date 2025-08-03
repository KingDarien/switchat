-- First check what user roles are currently allowed
-- Drop the existing check constraint if it exists
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_role_check;

-- Add a new check constraint that includes super_admin
ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_role_check 
CHECK (user_role IN ('user', 'moderator', 'admin', 'super_admin'));

-- Now update DarienAdair's account to super_admin with protection
UPDATE public.profiles 
SET 
  user_role = 'super_admin',
  is_protected = true,
  security_level = 10
WHERE username = 'DarienAdair';