-- Robust fix for audio_rooms insert RLS/session issues
-- 1) Ensure host_id defaults to the current auth user
ALTER TABLE public.audio_rooms
  ALTER COLUMN host_id SET DEFAULT auth.uid();

-- 2) Relax INSERT policy so RLS doesn't require host_id provided by client
DROP POLICY IF EXISTS "Users can create audio rooms" ON public.audio_rooms;
CREATE POLICY "Authenticated users can create audio rooms"
ON public.audio_rooms
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 3) Attach trigger to always set host to the current user at insert time
DROP TRIGGER IF EXISTS set_audio_room_host_trigger ON public.audio_rooms;
CREATE TRIGGER set_audio_room_host_trigger
BEFORE INSERT ON public.audio_rooms
FOR EACH ROW
EXECUTE FUNCTION public.set_audio_room_host();