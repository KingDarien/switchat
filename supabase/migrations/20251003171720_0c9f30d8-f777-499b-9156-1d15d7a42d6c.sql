-- Add admin override policies for posts management
-- Admins can delete any post
CREATE POLICY "Admins can delete any post"
ON public.posts
FOR DELETE
TO authenticated
USING (is_admin(auth.uid()));

-- Admins can update any post
CREATE POLICY "Admins can update any post"
ON public.posts
FOR UPDATE
TO authenticated
USING (is_admin(auth.uid()));

-- Add admin override policies for comments management
CREATE POLICY "Admins can delete any comment"
ON public.comments
FOR DELETE
TO authenticated
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update any comment"
ON public.comments
FOR UPDATE
TO authenticated
USING (is_admin(auth.uid()));

-- Ensure DarienAdair has super_admin role
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'super_admin'::app_role
FROM public.profiles
WHERE username = 'DarienAdair'
ON CONFLICT (user_id, role) DO NOTHING;