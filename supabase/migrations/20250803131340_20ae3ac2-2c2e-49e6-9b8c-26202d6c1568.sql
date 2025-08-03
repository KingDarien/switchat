-- Add security and management fields to profiles first
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_protected BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS banned_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS ban_reason TEXT,
ADD COLUMN IF NOT EXISTS banned_by UUID,
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS security_level INTEGER DEFAULT 1;

-- Drop the existing check constraint if it exists and add new one
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_role_check 
CHECK (user_role IN ('user', 'moderator', 'admin', 'super_admin'));

-- Now update DarienAdair's account to super_admin with protection
UPDATE public.profiles 
SET 
  user_role = 'super_admin',
  is_protected = true,
  security_level = 10
WHERE username = 'DarienAdair';