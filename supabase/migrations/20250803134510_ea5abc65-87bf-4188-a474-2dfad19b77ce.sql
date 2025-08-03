-- Add emoji column to likes table for reactions
ALTER TABLE public.likes ADD COLUMN emoji TEXT DEFAULT '👍';

-- Update existing likes to use thumbs up emoji
UPDATE public.likes SET emoji = '👍' WHERE emoji IS NULL;

-- Make emoji column not null
ALTER TABLE public.likes ALTER COLUMN emoji SET NOT NULL;

-- Drop the unique constraint and create a new one that includes emoji
ALTER TABLE public.likes DROP CONSTRAINT IF EXISTS likes_user_id_post_id_key;
ALTER TABLE public.likes ADD CONSTRAINT likes_user_post_emoji_unique UNIQUE (user_id, post_id, emoji);

-- Update handle_new_user function to auto-follow DarienAdair
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  darien_user_id UUID := '00000000-0000-0000-0000-000000000000';
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (user_id, username, display_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'display_name'
  );
  
  -- Auto-follow DarienAdair (handle potential errors gracefully)
  BEGIN
    INSERT INTO public.follows (follower_id, following_id)
    VALUES (NEW.id, darien_user_id)
    ON CONFLICT DO NOTHING;
  EXCEPTION
    WHEN OTHERS THEN
      -- Log error but don't fail user creation
      NULL;
  END;
  
  RETURN NEW;
END;
$$;