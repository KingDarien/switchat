-- Ensure audio room inserts satisfy RLS by setting host_id = auth.uid() via trigger
-- This avoids client-side mismatches and fixes "new row violates row-level security" on insert

-- Recreate trigger safely
DROP TRIGGER IF EXISTS set_audio_room_host_before_insert ON public.audio_rooms;
CREATE TRIGGER set_audio_room_host_before_insert
BEFORE INSERT ON public.audio_rooms
FOR EACH ROW
EXECUTE FUNCTION public.set_audio_room_host();