-- Update DarienAdair's verification status as the creator
UPDATE public.profiles 
SET 
  is_verified = true,
  verification_tier = 'diamond',
  trust_score = 100
WHERE username ILIKE '%darien%' OR display_name ILIKE '%darien%';

-- Create a function to manually verify users
CREATE OR REPLACE FUNCTION public.verify_user(user_identifier TEXT, tier TEXT DEFAULT 'gold')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles 
  SET 
    is_verified = true,
    verification_tier = tier,
    trust_score = CASE 
      WHEN tier = 'diamond' THEN 100
      WHEN tier = 'gold' THEN 75
      WHEN tier = 'silver' THEN 50
      WHEN tier = 'bronze' THEN 25
      ELSE trust_score
    END
  WHERE username = user_identifier 
     OR display_name = user_identifier 
     OR user_id::text = user_identifier;
END;
$$;