-- Secure password_reset_requests table: restrict access to system functions only
-- Enable Row Level Security on password_reset_requests table
ALTER TABLE public.password_reset_requests ENABLE ROW LEVEL SECURITY;

-- Remove any existing policies (there are none currently, but this is defensive)
DROP POLICY IF EXISTS "Allow service role access" ON public.password_reset_requests;

-- Create a policy that denies all public access
-- The service role (used by edge functions) will bypass RLS automatically
-- This effectively makes the table accessible only to system functions
CREATE POLICY "Deny all public access to reset tokens"
ON public.password_reset_requests
FOR ALL
TO public
USING (false)
WITH CHECK (false);

-- Add a comment explaining the security model
COMMENT ON TABLE public.password_reset_requests IS 'Contains sensitive password reset tokens. Access restricted to service role only for security.';