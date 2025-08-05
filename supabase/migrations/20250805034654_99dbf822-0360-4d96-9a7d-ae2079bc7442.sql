-- Fix infinite recursion in room_participants RLS policy
-- Drop the problematic policy and create a simpler one

DROP POLICY IF EXISTS "Room participants are viewable by room members" ON public.room_participants;

-- Create a simpler policy that doesn't cause recursion
CREATE POLICY "Room participants are viewable by everyone in public rooms" 
ON public.room_participants 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM audio_rooms 
    WHERE audio_rooms.id = room_participants.room_id 
    AND audio_rooms.is_private = false
  )
  OR 
  -- User can see participants if they are the room host
  EXISTS (
    SELECT 1 
    FROM audio_rooms 
    WHERE audio_rooms.id = room_participants.room_id 
    AND audio_rooms.host_id = auth.uid()
  )
  OR
  -- User can see participants if they are a participant themselves (using user_id directly)
  EXISTS (
    SELECT 1 
    FROM audio_rooms 
    WHERE audio_rooms.id = room_participants.room_id 
    AND audio_rooms.is_private = true
    AND room_participants.user_id = auth.uid()
  )
);