-- Create conversations table for messaging system
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_1_id UUID NOT NULL,
  participant_2_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_message_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(participant_1_id, participant_2_id)
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_deleted BOOLEAN DEFAULT false,
  is_system_message BOOLEAN DEFAULT false
);

-- Create user blocks table
CREATE TABLE public.user_blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id UUID NOT NULL,
  blocked_id UUID NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

-- Create admin actions audit table
CREATE TABLE public.admin_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  target_user_id UUID,
  target_resource_type TEXT,
  target_resource_id UUID,
  details JSONB,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add security and management fields to profiles
ALTER TABLE public.profiles 
ADD COLUMN is_protected BOOLEAN DEFAULT false,
ADD COLUMN requires_approval BOOLEAN DEFAULT false,
ADD COLUMN banned_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN ban_reason TEXT,
ADD COLUMN banned_by UUID,
ADD COLUMN last_login_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN security_level INTEGER DEFAULT 1;

-- Update DarienAdair's account to super_admin with protection
UPDATE public.profiles 
SET 
  user_role = 'super_admin',
  is_protected = true,
  security_level = 10
WHERE username = 'DarienAdair';

-- Enable RLS on new tables
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations
CREATE POLICY "Users can view their own conversations" 
ON public.conversations 
FOR SELECT 
USING (auth.uid() = participant_1_id OR auth.uid() = participant_2_id);

CREATE POLICY "Users can create conversations" 
ON public.conversations 
FOR INSERT 
WITH CHECK (auth.uid() = participant_1_id OR auth.uid() = participant_2_id);

CREATE POLICY "Admins can view all conversations" 
ON public.conversations 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() 
  AND user_role IN ('super_admin', 'admin', 'moderator')
));

-- RLS Policies for messages
CREATE POLICY "Users can view messages in their conversations" 
ON public.messages 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM conversations 
  WHERE conversations.id = messages.conversation_id 
  AND (conversations.participant_1_id = auth.uid() OR conversations.participant_2_id = auth.uid())
));

CREATE POLICY "Users can send messages in their conversations" 
ON public.messages 
FOR INSERT 
WITH CHECK (auth.uid() = sender_id AND EXISTS (
  SELECT 1 FROM conversations 
  WHERE conversations.id = messages.conversation_id 
  AND (conversations.participant_1_id = auth.uid() OR conversations.participant_2_id = auth.uid())
));

CREATE POLICY "Admins can view all messages" 
ON public.messages 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() 
  AND user_role IN ('super_admin', 'admin', 'moderator')
));

-- RLS Policies for user blocks
CREATE POLICY "Users can view their own blocks" 
ON public.user_blocks 
FOR SELECT 
USING (auth.uid() = blocker_id);

CREATE POLICY "Users can create their own blocks" 
ON public.user_blocks 
FOR INSERT 
WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Admins can view all blocks" 
ON public.user_blocks 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() 
  AND user_role IN ('super_admin', 'admin', 'moderator')
));

-- RLS Policies for admin actions
CREATE POLICY "Admins can view admin actions" 
ON public.admin_actions 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() 
  AND user_role IN ('super_admin', 'admin', 'moderator')
));

CREATE POLICY "Admins can log their own actions" 
ON public.admin_actions 
FOR INSERT 
WITH CHECK (auth.uid() = admin_id AND EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() 
  AND user_role IN ('super_admin', 'admin', 'moderator')
));

-- Create function to log admin actions
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
SET search_path TO ''
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

-- Create function to check if user can perform admin action
CREATE OR REPLACE FUNCTION public.can_admin_action(target_user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
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

-- Create trigger to update conversation timestamps
CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
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

CREATE TRIGGER update_conversation_on_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_conversation_timestamp();