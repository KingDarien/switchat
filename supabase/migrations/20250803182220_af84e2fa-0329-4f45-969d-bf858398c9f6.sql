-- Automatically verify DarienAdair with the highest tier
UPDATE public.profiles 
SET 
  is_verified = true,
  verification_tier = 'diamond',
  trust_score = 100,
  current_rank = 1
WHERE username = 'DarienAdair';