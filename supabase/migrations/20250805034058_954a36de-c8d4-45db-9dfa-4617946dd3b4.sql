-- Create audio rooms table for live conversations
CREATE TABLE public.audio_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  topic TEXT,
  host_id UUID NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_private BOOLEAN NOT NULL DEFAULT false,
  max_participants INTEGER DEFAULT 50,
  current_participants INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create voice memos table for audio posts
CREATE TABLE public.voice_memos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT,
  audio_url TEXT NOT NULL,
  duration INTEGER, -- duration in seconds
  transcript TEXT,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create room participants table
CREATE TABLE public.room_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'listener', -- 'host', 'speaker', 'listener'
  is_muted BOOLEAN NOT NULL DEFAULT false,
  hand_raised BOOLEAN NOT NULL DEFAULT false,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.audio_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_memos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_participants ENABLE ROW LEVEL SECURITY;

-- Audio rooms policies
CREATE POLICY "Audio rooms are viewable by everyone" 
ON public.audio_rooms 
FOR SELECT 
USING (is_active = true AND (is_private = false OR EXISTS (
  SELECT 1 FROM room_participants 
  WHERE room_id = audio_rooms.id AND user_id = auth.uid()
)));

CREATE POLICY "Users can create audio rooms" 
ON public.audio_rooms 
FOR INSERT 
WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Hosts can update their rooms" 
ON public.audio_rooms 
FOR UPDATE 
USING (auth.uid() = host_id);

CREATE POLICY "Hosts can delete their rooms" 
ON public.audio_rooms 
FOR DELETE 
USING (auth.uid() = host_id);

-- Voice memos policies
CREATE POLICY "Public voice memos are viewable by everyone" 
ON public.voice_memos 
FOR SELECT 
USING (is_public = true);

CREATE POLICY "Users can view their own voice memos" 
ON public.voice_memos 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own voice memos" 
ON public.voice_memos 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own voice memos" 
ON public.voice_memos 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own voice memos" 
ON public.voice_memos 
FOR DELETE 
USING (auth.uid() = user_id);

-- Room participants policies
CREATE POLICY "Room participants are viewable by room members" 
ON public.room_participants 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM audio_rooms 
  WHERE id = room_participants.room_id 
  AND (is_private = false OR EXISTS (
    SELECT 1 FROM room_participants rp2 
    WHERE rp2.room_id = audio_rooms.id AND rp2.user_id = auth.uid()
  ))
));

CREATE POLICY "Users can join rooms" 
ON public.room_participants 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own participation" 
ON public.room_participants 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can leave rooms" 
ON public.room_participants 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Room hosts can manage participants" 
ON public.room_participants 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM audio_rooms 
  WHERE id = room_participants.room_id AND host_id = auth.uid()
));

-- Create function to update room participant count
CREATE OR REPLACE FUNCTION update_room_participant_count()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER room_participant_count_trigger
  AFTER INSERT OR DELETE ON room_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_room_participant_count();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for timestamp updates
CREATE TRIGGER update_audio_rooms_updated_at
  BEFORE UPDATE ON audio_rooms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_voice_memos_updated_at
  BEFORE UPDATE ON voice_memos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();