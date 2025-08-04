import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Heart, MessageCircle, Share, Smile } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
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
  const [reactions, setReactions] = useState<{ [emoji: string]: number }>({});
  const [userReaction, setUserReaction] = useState<string | null>(null);
  const [commentsCount, setCommentsCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchReactions();
    fetchComments();
    checkUserReaction();
  }, [post.id, user?.id]);

  const fetchReactions = async () => {
    const { data, error } = await supabase
      .from('likes')
      .select('emoji')
      .eq('post_id', post.id);

    if (!error && data) {
      // Count reactions by emoji
      const reactionCounts: { [emoji: string]: number } = {};
      data.forEach(like => {
        reactionCounts[like.emoji] = (reactionCounts[like.emoji] || 0) + 1;
      });
      setReactions(reactionCounts);
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

  const checkUserReaction = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('likes')
      .select('emoji')
      .eq('post_id', post.id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!error && data) {
      setUserReaction(data.emoji);
    }
  };

  const handleEmojiSelect = async (emojiData: any) => {
    if (!user) return;
    
    const selectedEmoji = emojiData.emoji;
    setLoading(true);
    setEmojiPickerOpen(false);

    try {
      // If user already has this reaction, remove it
      if (userReaction === selectedEmoji) {
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id)
          .eq('emoji', selectedEmoji);

        if (!error) {
          setUserReaction(null);
          setReactions(prev => {
            const newReactions = { ...prev };
            newReactions[selectedEmoji] = Math.max(0, (newReactions[selectedEmoji] || 0) - 1);
            if (newReactions[selectedEmoji] === 0) {
              delete newReactions[selectedEmoji];
            }
            return newReactions;
          });
          onLikeToggle?.();
        }
      } else {
        // Remove existing reaction if any
        if (userReaction) {
          await supabase
            .from('likes')
            .delete()
            .eq('post_id', post.id)
            .eq('user_id', user.id)
            .eq('emoji', userReaction);
        }

        // Add new reaction
        const { error } = await supabase
          .from('likes')
          .insert({
            post_id: post.id,
            user_id: user.id,
            emoji: selectedEmoji
          });

        if (!error) {
          setReactions(prev => {
            const newReactions = { ...prev };
            
            // Decrease old reaction count
            if (userReaction) {
              newReactions[userReaction] = Math.max(0, (newReactions[userReaction] || 0) - 1);
              if (newReactions[userReaction] === 0) {
                delete newReactions[userReaction];
              }
            }
            
            // Increase new reaction count
            newReactions[selectedEmoji] = (newReactions[selectedEmoji] || 0) + 1;
            
            return newReactions;
          });
          
          setUserReaction(selectedEmoji);
          onLikeToggle?.();
        }
      }
    } catch (error) {
      console.error('Error handling reaction:', error);
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
          <div className="flex items-center gap-2">
            <Popover open={emojiPickerOpen} onOpenChange={setEmojiPickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={loading}
                  className="text-muted-foreground hover:text-primary"
                >
                  <Smile className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" side="top">
                <EmojiPicker
                  onEmojiClick={handleEmojiSelect}
                  width={280}
                  height={350}
                />
              </PopoverContent>
            </Popover>
            
            {/* Display reactions */}
            {Object.keys(reactions).length > 0 && (
              <div className="flex items-center gap-1 flex-wrap">
                {Object.entries(reactions).map(([emoji, count]) => (
                  <Button
                    key={emoji}
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEmojiSelect({ emoji })}
                    className={`text-xs h-6 px-2 ${
                      userReaction === emoji 
                        ? 'bg-primary/10 text-primary border border-primary/20' 
                        : 'text-muted-foreground hover:text-primary'
                    }`}
                  >
                    {emoji} {count}
                  </Button>
                ))}
              </div>
            )}
          </div>
          
          <Button variant="ghost" size="sm" className="flex items-center gap-2 text-muted-foreground">
            <Share className="h-4 w-4" />
          </Button>
        </div>
        
        <Comments 
          postId={post.id} 
          commentsCount={commentsCount}
          onCommentsCountChange={setCommentsCount}
          postAuthorId={post.user_id}
        />
      </CardContent>
    </Card>
  );
};

export default PostCard;