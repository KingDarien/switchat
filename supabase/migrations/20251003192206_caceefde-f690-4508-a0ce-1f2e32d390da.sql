-- Create room_reactions table to track likes and dislikes
CREATE TABLE public.room_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.audio_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'dislike')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- Enable RLS on room_reactions
ALTER TABLE public.room_reactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for room_reactions
CREATE POLICY "Users can view all room reactions"
ON public.room_reactions
FOR SELECT
USING (true);

CREATE POLICY "Users can insert their own reactions"
ON public.room_reactions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reactions"
ON public.room_reactions
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reactions"
ON public.room_reactions
FOR DELETE
USING (auth.uid() = user_id);

-- Add reaction count columns to audio_rooms
ALTER TABLE public.audio_rooms
ADD COLUMN like_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN dislike_count INTEGER NOT NULL DEFAULT 0;

-- Function to update room reaction counts
CREATE OR REPLACE FUNCTION public.update_room_reaction_counts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.reaction_type = 'like' THEN
      UPDATE audio_rooms SET like_count = like_count + 1 WHERE id = NEW.room_id;
    ELSE
      UPDATE audio_rooms SET dislike_count = dislike_count + 1 WHERE id = NEW.room_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.reaction_type = 'like' AND NEW.reaction_type = 'dislike' THEN
      UPDATE audio_rooms SET like_count = like_count - 1, dislike_count = dislike_count + 1 WHERE id = NEW.room_id;
    ELSIF OLD.reaction_type = 'dislike' AND NEW.reaction_type = 'like' THEN
      UPDATE audio_rooms SET like_count = like_count + 1, dislike_count = dislike_count - 1 WHERE id = NEW.room_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.reaction_type = 'like' THEN
      UPDATE audio_rooms SET like_count = like_count - 1 WHERE id = OLD.room_id;
    ELSE
      UPDATE audio_rooms SET dislike_count = dislike_count - 1 WHERE id = OLD.room_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Triggers for automatic count updates
CREATE TRIGGER update_room_reaction_counts_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.room_reactions
FOR EACH ROW
EXECUTE FUNCTION public.update_room_reaction_counts();

-- Enable realtime for room_reactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_reactions;