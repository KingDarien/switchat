-- Fix security warnings by adding SECURITY DEFINER SET search_path to functions

-- Fix update_goal_funding function
CREATE OR REPLACE FUNCTION update_goal_funding()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.user_goals 
  SET current_funding = (
    SELECT COALESCE(SUM(amount), 0) 
    FROM public.goal_contributions 
    WHERE goal_id = NEW.goal_id AND status = 'completed'
  )
  WHERE id = NEW.goal_id;
  
  -- Update user's total contributions
  UPDATE public.profiles 
  SET total_contributions_made = (
    SELECT COALESCE(SUM(amount), 0) 
    FROM public.goal_contributions 
    WHERE contributor_id = NEW.contributor_id AND status = 'completed'
  )
  WHERE user_id = NEW.contributor_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Fix update_trust_score function
CREATE OR REPLACE FUNCTION update_trust_score()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_completed = true AND OLD.is_completed = false THEN
    UPDATE public.profiles 
    SET 
      goals_completed = goals_completed + 1,
      trust_score = trust_score + 10
    WHERE user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Fix calculate_popularity_score function
CREATE OR REPLACE FUNCTION public.calculate_popularity_score(user_id_param uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  follower_count integer := 0;
  following_count integer := 0;
  posts_count integer := 0;
  likes_count integer := 0;
  comments_count integer := 0;
  score integer := 0;
BEGIN
  -- Get follower count (most important for ranking)
  SELECT COUNT(*) INTO follower_count
  FROM public.follows
  WHERE following_id = user_id_param;
  
  -- Get following count
  SELECT COUNT(*) INTO following_count
  FROM public.follows
  WHERE follower_id = user_id_param;
  
  -- Get posts count
  SELECT COUNT(*) INTO posts_count
  FROM public.posts
  WHERE user_id = user_id_param;
  
  -- Get total likes received
  SELECT COUNT(*) INTO likes_count
  FROM public.likes l
  JOIN public.posts p ON l.post_id = p.id
  WHERE p.user_id = user_id_param;
  
  -- Get total comments made
  SELECT COUNT(*) INTO comments_count
  FROM public.comments
  WHERE user_id = user_id_param;
  
  -- Calculate score with followers as primary factor
  score := (follower_count * 10) + (likes_count * 2) + (posts_count * 1) + (comments_count * 1) + (following_count * 1);
  
  RETURN score;
END;
$$;

-- Fix update_user_rankings function
CREATE OR REPLACE FUNCTION public.update_user_rankings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Update rankings for all users based on follower count
  WITH ranked_users AS (
    SELECT 
      p.user_id,
      p.niche_id,
      COALESCE(follower_counts.count, 0) as follower_count,
      public.calculate_popularity_score(p.user_id) as score,
      ROW_NUMBER() OVER (ORDER BY COALESCE(follower_counts.count, 0) DESC, public.calculate_popularity_score(p.user_id) DESC) as rank_position
    FROM public.profiles p
    LEFT JOIN (
      SELECT following_id, COUNT(*) as count
      FROM public.follows
      GROUP BY following_id
    ) follower_counts ON p.user_id = follower_counts.following_id
  )
  UPDATE public.profiles
  SET 
    popularity_score = ranked_users.score,
    current_rank = ranked_users.rank_position
  FROM ranked_users
  WHERE profiles.user_id = ranked_users.user_id;
  
  -- Update verification tiers based on follower count
  UPDATE public.profiles
  SET 
    verification_tier = CASE
      WHEN (SELECT COUNT(*) FROM public.follows WHERE following_id = profiles.user_id) >= 5000 THEN 'diamond'
      WHEN (SELECT COUNT(*) FROM public.follows WHERE following_id = profiles.user_id) >= 1000 THEN 'gold'
      WHEN (SELECT COUNT(*) FROM public.follows WHERE following_id = profiles.user_id) >= 500 THEN 'silver'
      WHEN (SELECT COUNT(*) FROM public.follows WHERE following_id = profiles.user_id) >= 100 THEN 'bronze'
      ELSE 'none'
    END,
    is_verified = (SELECT COUNT(*) FROM public.follows WHERE following_id = profiles.user_id) >= 100;
END;
$$;

-- Fix handle_follow_change function
CREATE OR REPLACE FUNCTION public.handle_follow_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Update rankings after follow changes
  PERFORM public.update_user_rankings();
  RETURN COALESCE(NEW, OLD);
END;
$$;