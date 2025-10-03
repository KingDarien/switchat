-- Fix search_path security warnings for functions without set search_path

-- Fix update_room_participant_count function
CREATE OR REPLACE FUNCTION public.update_room_participant_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE audio_rooms 
    SET current_participants = current_participants + 1
    WHERE id = NEW.room_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE audio_rooms 
    SET current_participants = current_participants - 1
    WHERE id = OLD.room_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

-- Fix set_audio_room_host function
CREATE OR REPLACE FUNCTION public.set_audio_room_host()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.host_id := auth.uid();
  RETURN NEW;
END;
$function$;

-- Fix can_view_audio_room function
CREATE OR REPLACE FUNCTION public.can_view_audio_room(room_id_param UUID, user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE 
  room_record RECORD;
BEGIN
  SELECT is_active, is_private, host_id INTO room_record
  FROM public.audio_rooms WHERE id = room_id_param;
  
  IF NOT FOUND OR NOT room_record.is_active THEN 
    RETURN FALSE; 
  END IF;
  
  IF NOT room_record.is_private THEN 
    RETURN TRUE; 
  END IF;
  
  IF room_record.host_id = user_id_param THEN 
    RETURN TRUE; 
  END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM public.room_participants 
    WHERE room_id = room_id_param AND user_id = user_id_param
  );
END;
$function$;

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Fix verify_user function
CREATE OR REPLACE FUNCTION public.verify_user(user_identifier TEXT, tier TEXT DEFAULT 'gold')
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE public.profiles 
  SET 
    is_verified = TRUE,
    verification_tier = tier,
    trust_score = CASE 
      WHEN tier = 'diamond' THEN 100
      WHEN tier = 'gold' THEN 75
      WHEN tier = 'silver' THEN 50
      WHEN tier = 'bronze' THEN 25
      ELSE trust_score
    END
  WHERE username = user_identifier 
     OR display_name = user_identifier 
     OR user_id::text = user_identifier;
END;
$function$;