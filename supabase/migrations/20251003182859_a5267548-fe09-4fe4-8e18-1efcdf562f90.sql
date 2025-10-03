-- Add scheduling fields to voice_memos table
ALTER TABLE public.voice_memos
ADD COLUMN IF NOT EXISTS scheduled_for timestamp with time zone,
ADD COLUMN IF NOT EXISTS is_scheduled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS published_at timestamp with time zone;

-- Create index for scheduled stories
CREATE INDEX IF NOT EXISTS idx_voice_memos_scheduled 
ON public.voice_memos(scheduled_for) 
WHERE is_scheduled = true AND scheduled_for IS NOT NULL;

-- Update RLS policy to only show published or user's own stories
DROP POLICY IF EXISTS "Public voice memos are viewable by everyone" ON public.voice_memos;

CREATE POLICY "Published voice memos are viewable by everyone"
ON public.voice_memos
FOR SELECT
USING (
  (is_public = true AND is_scheduled = false) 
  OR 
  (is_public = true AND is_scheduled = true AND scheduled_for <= now())
  OR
  (auth.uid() = user_id)
);