-- Update DarienAdair's verification status to diamond tier
UPDATE public.profiles 
SET 
  is_verified = true,
  verification_tier = 'diamond',
  trust_score = 100
WHERE username = 'DarienAdair' OR user_id = '8bfbf31d-21ec-49cf-adcd-d44bf3efe3e9';

-- Also update any user with rank 1 to be verified
UPDATE public.profiles 
SET 
  is_verified = true,
  verification_tier = 'diamond',
  trust_score = 100
WHERE current_rank = 1;