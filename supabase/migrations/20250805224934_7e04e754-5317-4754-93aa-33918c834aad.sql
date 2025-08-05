-- Drop existing policies on audio_rooms
DROP POLICY IF EXISTS "Users can create audio rooms" ON public.audio_rooms;
DROP POLICY IF EXISTS "Hosts can update their rooms" ON public.audio_rooms;
DROP POLICY IF EXISTS "Hosts can delete their rooms" ON public.audio_rooms;
DROP POLICY IF EXISTS "Audio rooms are viewable by authorized users" ON public.audio_rooms;

-- Create new INSERT policy for audio rooms with proper check
CREATE POLICY "Users can create audio rooms" 
ON public.audio_rooms 
FOR INSERT 
WITH CHECK (auth.uid() = host_id AND auth.uid() IS NOT NULL);

-- Create SELECT policy for audio rooms
CREATE POLICY "Audio rooms are viewable by authorized users" 
ON public.audio_rooms 
FOR SELECT 
USING (public.can_view_audio_room(id, auth.uid()));

-- Create UPDATE policy for audio rooms  
CREATE POLICY "Hosts can update their rooms" 
ON public.audio_rooms 
FOR UPDATE 
USING (auth.uid() = host_id) 
WITH CHECK (auth.uid() = host_id);

-- Create DELETE policy for audio rooms
CREATE POLICY "Hosts can delete their rooms" 
ON public.audio_rooms 
FOR DELETE 
USING (auth.uid() = host_id);