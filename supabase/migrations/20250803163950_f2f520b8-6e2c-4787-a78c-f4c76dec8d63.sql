-- Fix search path for password reset functions
CREATE OR REPLACE FUNCTION public.can_request_password_reset(email_param TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  recent_attempts INTEGER;
BEGIN
  -- Count attempts in last 24 hours
  SELECT COUNT(*) INTO recent_attempts
  FROM public.password_reset_requests 
  WHERE email = email_param 
  AND created_at > now() - INTERVAL '24 hours';
  
  -- Allow max 3 attempts per 24 hours
  RETURN recent_attempts < 3;
END;
$$;

-- Fix search path for cleanup function
CREATE OR REPLACE FUNCTION public.cleanup_expired_reset_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  DELETE FROM public.password_reset_requests 
  WHERE expires_at < now() AND used_at IS NULL;
END;
$$;