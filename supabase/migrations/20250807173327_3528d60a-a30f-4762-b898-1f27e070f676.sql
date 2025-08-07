-- Update the correct DarienAdair's total contributions to $7384.50
UPDATE public.profiles 
SET total_contributions_made = 7384.50
WHERE user_id = '8bfbf31d-21ec-49cf-adcd-d44bf3efe3e9';

-- Also ensure this is the only DarienAdair account and set proper admin privileges
UPDATE public.profiles 
SET user_role = 'super_admin', is_protected = true
WHERE user_id = '8bfbf31d-21ec-49cf-adcd-d44bf3efe3e9';