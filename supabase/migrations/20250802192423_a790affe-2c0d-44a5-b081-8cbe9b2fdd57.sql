-- Fix the update_user_rankings function to include proper WHERE clauses
CREATE OR REPLACE FUNCTION public.update_user_rankings()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
  
  -- Update verification tiers based on follower count with proper WHERE clause
  UPDATE public.profiles
  SET 
    verification_tier = CASE
      WHEN follower_count >= 5000 THEN 'diamond'
      WHEN follower_count >= 1000 THEN 'gold'
      WHEN follower_count >= 500 THEN 'silver'
      WHEN follower_count >= 100 THEN 'bronze'
      ELSE 'none'
    END,
    is_verified = follower_count >= 100
  FROM (
    SELECT 
      p.user_id,
      COALESCE(f.follower_count, 0) as follower_count
    FROM public.profiles p
    LEFT JOIN (
      SELECT following_id, COUNT(*) as follower_count
      FROM public.follows
      GROUP BY following_id
    ) f ON p.user_id = f.following_id
  ) follower_data
  WHERE profiles.user_id = follower_data.user_id;
END;
$function$