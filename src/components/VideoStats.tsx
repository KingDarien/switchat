import { useEffect, useState } from 'react';
import { Eye, Heart, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface VideoStatsProps {
  postId: string;
  likeCount: number;
}

const VideoStats = ({ postId, likeCount }: VideoStatsProps) => {
  const [viewCount, setViewCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch view count
        const { count: views } = await supabase
          .from('video_views')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', postId);

        // Fetch comment count
        const { count: comments } = await supabase
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', postId);

        setViewCount(views || 0);
        setCommentCount(comments || 0);
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, [postId]);

  const formatCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  return (
    <div className="flex flex-col gap-3">
      {viewCount > 0 && (
        <div className="flex flex-col items-center gap-1">
          <Eye className="w-6 h-6 text-white" />
          <span className="text-xs text-white font-medium">
            {formatCount(viewCount)}
          </span>
        </div>
      )}
      
      {likeCount > 0 && (
        <div className="flex flex-col items-center gap-1">
          <Heart className="w-6 h-6 text-white" />
          <span className="text-xs text-white font-medium">
            {formatCount(likeCount)}
          </span>
        </div>
      )}
      
      {commentCount > 0 && (
        <div className="flex flex-col items-center gap-1">
          <MessageCircle className="w-6 h-6 text-white" />
          <span className="text-xs text-white font-medium">
            {formatCount(commentCount)}
          </span>
        </div>
      )}
    </div>
  );
};

export default VideoStats;
