-- Create video_views table for tracking video views
CREATE TABLE IF NOT EXISTS public.video_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  watch_duration INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create saved_videos table for bookmarking videos
CREATE TABLE IF NOT EXISTS public.saved_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Enable RLS
ALTER TABLE public.video_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_videos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for video_views
CREATE POLICY "Users can view their own video views"
  ON public.video_views FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own video views"
  ON public.video_views FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Video owners can view all views on their videos"
  ON public.video_views FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.posts
      WHERE posts.id = video_views.post_id
      AND posts.user_id = auth.uid()
    )
  );

-- RLS Policies for saved_videos
CREATE POLICY "Users can view their own saved videos"
  ON public.saved_videos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can save videos"
  ON public.saved_videos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave videos"
  ON public.saved_videos FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_video_views_post_id ON public.video_views(post_id);
CREATE INDEX IF NOT EXISTS idx_video_views_user_id ON public.video_views(user_id);
CREATE INDEX IF NOT EXISTS idx_video_views_viewed_at ON public.video_views(viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_saved_videos_post_id ON public.saved_videos(post_id);
CREATE INDEX IF NOT EXISTS idx_saved_videos_user_id ON public.saved_videos(user_id);