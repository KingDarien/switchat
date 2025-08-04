-- Create storage bucket for user music uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('music', 'music', true);

-- Create policies for music bucket
CREATE POLICY "Music files are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'music');

CREATE POLICY "Users can upload their own music" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'music' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own music" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'music' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own music" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'music' AND auth.uid()::text = (storage.foldername(name))[1]);