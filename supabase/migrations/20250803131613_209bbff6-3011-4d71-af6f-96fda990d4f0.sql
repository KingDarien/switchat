-- Create function to log admin actions with proper security
CREATE OR REPLACE FUNCTION public.log_admin_action(
  action_type_param TEXT,
  target_user_id_param UUID DEFAULT NULL,
  target_resource_type_param TEXT DEFAULT NULL,
  target_resource_id_param UUID DEFAULT NULL,
  details_param JSONB DEFAULT NULL,
  reason_param TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  action_id UUID;
BEGIN
  INSERT INTO public.admin_actions (
    admin_id, action_type, target_user_id, target_resource_type, 
    target_resource_id, details, reason
  ) VALUES (
    auth.uid(), action_type_param, target_user_id_param, target_resource_type_param,
    target_resource_id_param, details_param, reason_param
  ) RETURNING id INTO action_id;
  
  RETURN action_id;
END;
$$;

-- Create function to check if user can perform admin action with proper security
CREATE OR REPLACE FUNCTION public.can_admin_action(target_user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_user_role TEXT;
  target_user_role TEXT;
  current_user_protected BOOLEAN;
  target_user_protected BOOLEAN;
BEGIN
  -- Get current user role and protection status
  SELECT user_role, is_protected INTO current_user_role, current_user_protected
  FROM public.profiles 
  WHERE user_id = auth.uid();
  
  -- Get target user role and protection status
  SELECT user_role, is_protected INTO target_user_role, target_user_protected
  FROM public.profiles 
  WHERE user_id = target_user_id_param;
  
  -- Super admin can do anything
  IF current_user_role = 'super_admin' THEN
    RETURN true;
  END IF;
  
  -- Cannot target protected users (like DarienAdair)
  IF target_user_protected = true THEN
    RETURN false;
  END IF;
  
  -- Admin can target users and moderators but not other admins
  IF current_user_role = 'admin' THEN
    RETURN target_user_role IN ('user', 'moderator');
  END IF;
  
  -- Moderator can only target regular users
  IF current_user_role = 'moderator' THEN
    RETURN target_user_role = 'user';
  END IF;
  
  RETURN false;
END;
$$;

-- Create trigger to update conversation timestamps with proper security
CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.conversations 
  SET 
    last_message_at = NEW.created_at,
    updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS update_conversation_on_message ON public.messages;
CREATE TRIGGER update_conversation_on_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_conversation_timestamp();