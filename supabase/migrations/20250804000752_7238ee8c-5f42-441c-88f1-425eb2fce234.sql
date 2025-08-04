-- Update the handle_new_user function to ensure auto-follow works reliably
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
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
  -- Only if this is not DarienAdair's own account
  IF NEW.id != darien_user_id THEN
    BEGIN
      INSERT INTO public.follows (follower_id, following_id)
      VALUES (NEW.id, darien_user_id)
      ON CONFLICT DO NOTHING;
    EXCEPTION
      WHEN OTHERS THEN
        -- Log error but don't fail user creation
        NULL;
    END;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create function to update DarienAdair's follower goals when someone follows/unfollows
CREATE OR REPLACE FUNCTION public.update_darien_follower_goals()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  darien_user_id UUID := '00000000-0000-0000-0000-000000000000';
  follower_count INTEGER;
BEGIN
  -- Only update if this affects DarienAdair's followers
  IF (TG_OP = 'INSERT' AND NEW.following_id = darien_user_id) OR 
     (TG_OP = 'DELETE' AND OLD.following_id = darien_user_id) THEN
    
    -- Get current follower count for DarienAdair
    SELECT COUNT(*) INTO follower_count
    FROM public.follows
    WHERE following_id = darien_user_id;
    
    -- Update all of DarienAdair's active follower goals
    UPDATE public.user_goals 
    SET current_value = follower_count
    WHERE user_id = darien_user_id 
      AND goal_type = 'followers' 
      AND is_active = true
      AND approval_status = 'approved';
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for follow changes
CREATE TRIGGER update_darien_follower_goals_trigger
  AFTER INSERT OR DELETE ON public.follows
  FOR EACH ROW
  EXECUTE FUNCTION public.update_darien_follower_goals();

-- Create function to handle goal deletion and refunds
CREATE OR REPLACE FUNCTION public.process_goal_deletion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- When a goal is set to inactive (deleted), process refunds
  IF OLD.is_active = true AND NEW.is_active = false THEN
    -- Update all contributions for this goal to 'refunded' status
    UPDATE public.goal_contributions
    SET status = 'refunded', refunded_at = now()
    WHERE goal_id = NEW.id AND status = 'completed';
    
    -- Note: Actual payment refunds would need to be handled by payment processor
    -- This just marks them as refunded in the database
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for goal deletion
CREATE TRIGGER process_goal_deletion_trigger
  BEFORE UPDATE ON public.user_goals
  FOR EACH ROW
  EXECUTE FUNCTION public.process_goal_deletion();