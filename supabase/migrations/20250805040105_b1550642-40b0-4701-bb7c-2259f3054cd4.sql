-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  from_user_id UUID,
  post_id UUID,
  comment_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_read BOOLEAN NOT NULL DEFAULT false,
  title TEXT,
  message TEXT
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create function to generate notifications
CREATE OR REPLACE FUNCTION public.create_notification(
  target_user_id UUID,
  notification_type TEXT,
  from_user_id UUID DEFAULT NULL,
  post_id UUID DEFAULT NULL,
  comment_id UUID DEFAULT NULL,
  title TEXT DEFAULT NULL,
  message TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  notification_id UUID;
BEGIN
  -- Don't create notifications for self-actions
  IF target_user_id = from_user_id THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.notifications (
    user_id, type, from_user_id, post_id, comment_id, title, message
  ) VALUES (
    target_user_id, notification_type, from_user_id, post_id, comment_id, title, message
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- Create trigger functions for automatic notifications

-- Like notifications
CREATE OR REPLACE FUNCTION public.notify_on_like()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  post_owner_id UUID;
  from_user_name TEXT;
BEGIN
  -- Get post owner
  SELECT user_id INTO post_owner_id
  FROM public.posts
  WHERE id = NEW.post_id;
  
  -- Get the name of the user who liked
  SELECT COALESCE(display_name, username) INTO from_user_name
  FROM public.profiles
  WHERE user_id = NEW.user_id;
  
  -- Create notification
  PERFORM public.create_notification(
    post_owner_id,
    'like',
    NEW.user_id,
    NEW.post_id,
    NULL,
    'New Like',
    from_user_name || ' liked your post'
  );
  
  RETURN NEW;
END;
$$;

-- Comment notifications
CREATE OR REPLACE FUNCTION public.notify_on_comment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  post_owner_id UUID;
  from_user_name TEXT;
BEGIN
  -- Get post owner
  SELECT user_id INTO post_owner_id
  FROM public.posts
  WHERE id = NEW.post_id;
  
  -- Get the name of the user who commented
  SELECT COALESCE(display_name, username) INTO from_user_name
  FROM public.profiles
  WHERE user_id = NEW.user_id;
  
  -- Create notification
  PERFORM public.create_notification(
    post_owner_id,
    'comment',
    NEW.user_id,
    NEW.post_id,
    NEW.id,
    'New Comment',
    from_user_name || ' commented on your post'
  );
  
  RETURN NEW;
END;
$$;

-- Follow notifications
CREATE OR REPLACE FUNCTION public.notify_on_follow()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  from_user_name TEXT;
BEGIN
  -- Get the name of the user who followed
  SELECT COALESCE(display_name, username) INTO from_user_name
  FROM public.profiles
  WHERE user_id = NEW.follower_id;
  
  -- Create notification
  PERFORM public.create_notification(
    NEW.following_id,
    'follow',
    NEW.follower_id,
    NULL,
    NULL,
    'New Follower',
    from_user_name || ' started following you'
  );
  
  RETURN NEW;
END;
$$;

-- Create triggers
CREATE TRIGGER trigger_notify_on_like
  AFTER INSERT ON public.likes
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_like();

CREATE TRIGGER trigger_notify_on_comment
  AFTER INSERT ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_comment();

CREATE TRIGGER trigger_notify_on_follow
  AFTER INSERT ON public.follows
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_follow();

-- Enable realtime for notifications
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;