-- Fix the infinite recursion in audio_rooms RLS policies
-- The issue is that the policy for SELECT is referencing the same table it's applied to

-- First, drop the problematic policy
DROP POLICY IF EXISTS "Audio rooms are viewable by everyone" ON public.audio_rooms;

-- Create a security definer function to check if user can view room
CREATE OR REPLACE FUNCTION public.can_view_audio_room(room_id_param uuid, user_id_param uuid)
RETURNS boolean AS $$
DECLARE
  room_record RECORD;
BEGIN
  -- Get room details
  SELECT is_active, is_private, host_id INTO room_record
  FROM public.audio_rooms 
  WHERE id = room_id_param;
  
  -- If room doesn't exist or is not active, return false
  IF NOT FOUND OR NOT room_record.is_active THEN
    RETURN false;
  END IF;
  
  -- If room is public, anyone can view
  IF NOT room_record.is_private THEN
    RETURN true;
  END IF;
  
  -- If room is private, check if user is host or participant
  IF room_record.host_id = user_id_param THEN
    RETURN true;
  END IF;
  
  -- Check if user is a participant
  RETURN EXISTS (
    SELECT 1 FROM public.room_participants 
    WHERE room_id = room_id_param AND user_id = user_id_param
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create new policy using the function
CREATE POLICY "Audio rooms are viewable by authorized users" ON public.audio_rooms
FOR SELECT USING (
  public.can_view_audio_room(id, auth.uid())
);