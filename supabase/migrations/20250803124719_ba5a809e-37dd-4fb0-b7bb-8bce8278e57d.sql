-- Update DarienAdair's role to admin
UPDATE public.profiles 
SET user_role = 'admin'
WHERE username = 'DarienAdair' OR display_name = 'DarienAdair';