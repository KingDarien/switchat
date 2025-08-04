-- Fix storage policies for file uploads
-- Drop existing policies that might be causing issues
DROP POLICY IF EXISTS "Users can upload to posts bucket" ON storage.objects;
DROP POLICY IF EXISTS "Users can view posts bucket files" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to videos bucket" ON storage.objects;
DROP POLICY IF EXISTS "Users can view videos bucket files" ON storage.objects;

-- Create proper storage policies for posts bucket
CREATE POLICY "Anyone can view files in posts bucket" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'posts');

CREATE POLICY "Authenticated users can upload to posts bucket" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'posts' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own files in posts bucket" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'posts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own files in posts bucket" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'posts' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create proper storage policies for videos bucket  
CREATE POLICY "Anyone can view files in videos bucket" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'videos');

CREATE POLICY "Authenticated users can upload to videos bucket" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'videos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own files in videos bucket" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own files in videos bucket" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);