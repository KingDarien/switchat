-- Add featured_post_id to profiles so users can pin a post as Featured Media
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS featured_post_id UUID;

-- Add FK constraint to posts (set null on delete)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_featured_post_id_fkey'
  ) THEN
    ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_featured_post_id_fkey
    FOREIGN KEY (featured_post_id)
    REFERENCES public.posts(id)
    ON DELETE SET NULL;
  END IF;
END $$;

-- Helpful index
CREATE INDEX IF NOT EXISTS idx_profiles_featured_post_id
ON public.profiles (featured_post_id);
