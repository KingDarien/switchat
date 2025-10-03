-- ==========================================
-- FIX: Database Function Security (Search Path)
-- ==========================================
-- Adding search_path to functions that are missing it

-- Fix: update_conversation_timestamp
CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE public.conversations 
  SET 
    last_message_at = NEW.created_at,
    updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$function$;

-- Fix: can_request_verification
CREATE OR REPLACE FUNCTION public.can_request_verification(user_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Check if user has any pending requests
  IF EXISTS (
    SELECT 1 FROM public.verification_requests 
    WHERE user_id = user_id_param AND status = 'pending'
  ) THEN
    RETURN false;
  END IF;
  
  -- Check 30-day cooldown after denial
  IF EXISTS (
    SELECT 1 FROM public.verification_requests 
    WHERE user_id = user_id_param 
    AND status = 'denied' 
    AND reviewed_at > now() - INTERVAL '30 days'
  ) THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$function$;

-- ==========================================
-- FUNCTION SECURITY COMPLETE
-- ==========================================