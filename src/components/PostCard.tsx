import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageCircle, Share } from 'lucide-react';
import Comments from './Comments';
import UserDisplayName from './UserDisplayName';

interface Profile {
  username: string;
  display_name: string;
  avatar_url: string;
  current_rank: number | null;
  is_verified: boolean;
  verification_tier: string;
}

interface Post {
  id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  user_id: string;
  profiles?: Profile;
}

interface PostCardProps {
  post: Post;
  onLikeToggle?: () => void;
}

const PostCard = ({ post, onLikeToggle }: PostCardProps) => {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchLikes();
    fetchComments();
    checkIfLiked();
  }, [post.id, user?.id]);

  const fetchLikes = async () => {
    const { data, error } = await supabase
      .from('likes')
      .select('id')
      .eq('post_id', post.id);

    if (!error && data) {
      setLikesCount(data.length);
    }
  };

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from('comments')
      .select('id')
      .eq('post_id', post.id);

    if (!error && data) {
      setCommentsCount(data.length);
    }
  };

  const checkIfLiked = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('likes')
      .select('id')
      .eq('post_id', post.id)
      .eq('user_id', user.id)
      .single();

    if (!error && data) {
      setLiked(true);
    }
  };

  const toggleLike = async () => {
    if (!user) return;
    setLoading(true);

    try {
      if (liked) {
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id);

        if (!error) {
          setLiked(false);
          setLikesCount(prev => prev - 1);
          onLikeToggle?.();
        }
      } else {
        const { error } = await supabase
          .from('likes')
          .insert({
            post_id: post.id,
            user_id: user.id,
          });

        if (!error) {
          setLiked(true);
          setLikesCount(prev => prev + 1);
          onLikeToggle?.();
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const displayName = post.profiles?.display_name || post.profiles?.username || 'Anonymous';
  const username = post.profiles?.username || 'user';

  return (
    <Card className="animate-fade-in">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={post.profiles?.avatar_url} />
            <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <UserDisplayName
              displayName={displayName}
              username={username}
              rank={post.profiles?.current_rank}
              isVerified={post.profiles?.is_verified}
              verificationTier={post.profiles?.verification_tier}
            />
            <p className="text-sm text-muted-foreground mt-1">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-foreground">{post.content}</p>
        
        {post.image_url && (
          <div className="rounded-lg overflow-hidden">
            <img
              src={post.image_url}
              alt="Post content"
              className="w-full h-auto object-cover max-h-96"
            />
          </div>
        )}
        
        <div className="flex items-center gap-6 pt-2">
          <Button
            variant="ghost"
            size="sm"
            className={`flex items-center gap-2 ${liked ? 'text-red-500' : 'text-muted-foreground'}`}
            onClick={toggleLike}
            disabled={loading}
          >
            <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
            <span>{likesCount}</span>
          </Button>
          
          <Button variant="ghost" size="sm" className="flex items-center gap-2 text-muted-foreground">
            <Share className="h-4 w-4" />
          </Button>
        </div>
        
        <Comments 
          postId={post.id} 
          commentsCount={commentsCount}
          onCommentsCountChange={setCommentsCount}
        />
      </CardContent>
    </Card>
  );
};

export default PostCard;