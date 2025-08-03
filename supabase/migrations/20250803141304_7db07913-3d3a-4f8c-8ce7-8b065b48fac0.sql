-- Add video support to posts table
ALTER TABLE public.posts 
ADD COLUMN video_url TEXT,
ADD COLUMN post_type TEXT NOT NULL DEFAULT 'text',
ADD COLUMN duration INTEGER;

-- Update existing posts to have post_type based on content
UPDATE public.posts 
SET post_type = CASE 
  WHEN image_url IS NOT NULL THEN 'image'
  ELSE 'text'
END;

-- Create index for better performance when filtering by post_type
CREATE INDEX idx_posts_post_type ON public.posts(post_type);

-- Create storage bucket for videos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('videos', 'videos', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for video uploads
CREATE POLICY "Video uploads are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'videos');

CREATE POLICY "Users can upload their own videos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own videos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);