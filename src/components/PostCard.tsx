import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Heart, MessageCircle, Share, Smile, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import Comments from './Comments';
import UserDisplayName from './UserDisplayName';
import PostEditDialog from './PostEditDialog';
import AnimatedReaction from './AnimatedReaction';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  user_id: string;
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
  const [profileData, setProfileData] = useState(post.profiles);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postContent, setPostContent] = useState(post.content);
  const [showReactionAnimation, setShowReactionAnimation] = useState(false);
  const [animatedEmoji, setAnimatedEmoji] = useState('');
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { toast } = useToast();

  useEffect(() => {
    fetchReactions();
    fetchComments();
    checkUserReaction();
  }, [post.id, user?.id]);

  // Listen for real-time profile updates
  useEffect(() => {
    if (!post.profiles?.user_id) return;

    const channel = supabase
      .channel('profile-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${post.profiles.user_id}`
        },
        (payload) => {
          setProfileData(payload.new as any);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    }
  }, [post.profiles?.user_id]);

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
          
          // Show animation for new reaction
          setAnimatedEmoji(selectedEmoji);
          setShowReactionAnimation(true);
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

  const handleUpdatePost = (newContent: string) => {
    setPostContent(newContent);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Post by ${profileData?.display_name || 'Unknown User'}`,
        text: postContent,
        url: window.location.href,
      });
    } else {
      // Fallback to copying to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const canManagePost = () => {
    return user?.id === post.user_id || profile?.user_role === 'super_admin';
  };

  const handleDeletePost = async () => {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', post.id);

      if (error) throw error;

      if (profile?.user_role === 'super_admin' && user?.id !== post.user_id) {
        await supabase.rpc('log_admin_action', {
          action_type_param: 'post_delete',
          target_user_id_param: post.user_id,
          target_resource_type_param: 'post',
          target_resource_id_param: post.id,
          reason_param: 'Admin deleted user post'
        });
      }

      toast({
        title: "Success",
        description: "Post deleted successfully.",
      });
      
      // The post will be removed from UI via real-time updates
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: "Error",
        description: "Failed to delete post. Please try again.",
        variant: "destructive",
      });
    }
    setDeleteDialogOpen(false);
  };

  const displayName = profileData?.display_name || profileData?.username || 'Anonymous';
  const username = profileData?.username || 'user';

  return (
    <Card className="animate-fade-in">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={profileData?.avatar_url} />
              <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <UserDisplayName
                displayName={displayName}
                username={username}
                userId={profileData?.user_id}
                rank={profileData?.current_rank}
                isVerified={profileData?.is_verified}
                verificationTier={profileData?.verification_tier}
              />
              <p className="text-sm text-muted-foreground mt-1">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
          {canManagePost() && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setDeleteDialogOpen(true)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-foreground">{postContent}</p>
        
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
                    className={`text-sm h-8 px-3 rounded-full transition-all duration-200 ${
                      userReaction === emoji 
                        ? 'bg-primary/10 text-primary border border-primary/20 scale-105 animate-pulse' 
                        : 'text-muted-foreground hover:text-primary hover:bg-primary/5 hover:scale-105'
                    }`}
                  >
                    <span className="text-base mr-1">{emoji}</span>
                    <span className="font-medium">{count}</span>
                  </Button>
                ))}
              </div>
            )}
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex items-center gap-2 text-muted-foreground"
            onClick={handleShare}
          >
            <Share className="h-4 w-4" />
          </Button>
        </div>
        
        <Comments
          postId={post.id}
          commentsCount={commentsCount}
          onCommentsCountChange={setCommentsCount}
          postAuthorId={post.user_id}
        />

        <PostEditDialog
          isOpen={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          post={{ id: post.id, content: postContent }}
          onUpdate={handleUpdatePost}
        />

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Post</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this post? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeletePost} className="bg-destructive hover:bg-destructive/90">
                Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reaction Animation */}
      <AnimatedReaction
        emoji={animatedEmoji}
        show={showReactionAnimation}
        onComplete={() => setShowReactionAnimation(false)}
      />
    </CardContent>
  </Card>
  );
};

export default PostCard;