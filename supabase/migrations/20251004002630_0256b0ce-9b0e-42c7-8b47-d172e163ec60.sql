-- Create room_messages table for live room chat
CREATE TABLE public.room_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.audio_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_deleted BOOLEAN DEFAULT false
);

-- Enable RLS
ALTER TABLE public.room_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert messages if they're in the room
CREATE POLICY "Users can send messages in rooms they're in"
ON public.room_messages
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.room_participants
    WHERE room_id = room_messages.room_id
    AND user_id = auth.uid()
  )
);

-- Policy: Users can view messages in rooms they're in
CREATE POLICY "Users can view messages in rooms they're in"
ON public.room_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.room_participants
    WHERE room_id = room_messages.room_id
    AND user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.audio_rooms
    WHERE id = room_messages.room_id
    AND host_id = auth.uid()
  )
);

-- Policy: Users can delete their own messages
CREATE POLICY "Users can delete their own messages"
ON public.room_messages
FOR DELETE
USING (auth.uid() = user_id);

-- Policy: Room hosts can delete any message
CREATE POLICY "Room hosts can delete any message"
ON public.room_messages
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.audio_rooms
    WHERE id = room_messages.room_id
    AND host_id = auth.uid()
  )
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_messages;