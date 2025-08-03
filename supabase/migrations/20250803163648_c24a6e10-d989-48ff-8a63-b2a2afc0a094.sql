-- Create password reset requests table for security tracking
CREATE TABLE public.password_reset_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  ip_address INET,
  user_agent TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  is_suspicious BOOLEAN DEFAULT false,
  attempt_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on password_reset_requests
ALTER TABLE public.password_reset_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for password_reset_requests
CREATE POLICY "Users can view their own reset requests" 
ON public.password_reset_requests 
FOR SELECT 
USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "System can manage reset requests" 
ON public.password_reset_requests 
FOR ALL 
USING (true);

-- Create function to check reset rate limits
CREATE OR REPLACE FUNCTION public.can_request_password_reset(email_param TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Create function to clean expired reset tokens
CREATE OR REPLACE FUNCTION public.cleanup_expired_reset_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.password_reset_requests 
  WHERE expires_at < now() AND used_at IS NULL;
END;
$$;

-- Create index for performance
CREATE INDEX idx_password_reset_email ON public.password_reset_requests(email);
CREATE INDEX idx_password_reset_token ON public.password_reset_requests(token);
CREATE INDEX idx_password_reset_expires ON public.password_reset_requests(expires_at);