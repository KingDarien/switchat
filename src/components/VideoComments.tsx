import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Send } from 'lucide-react';
import UserDisplayName from './UserDisplayName';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  username: string;
  display_name: string;
  avatar_url: string;
  current_rank: number | null;
  is_verified: boolean;
  verification_tier: string;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
}

interface CommentWithProfile extends Comment {
  profiles?: Profile;
}

interface VideoCommentsProps {
  postId: string;
  postAuthorId: string;
  isOpen: boolean;
  onClose: () => void;
}

const VideoComments = ({ postId, postAuthorId, isOpen, onClose }: VideoCommentsProps) => {
  const [comments, setComments] = useState<CommentWithProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchComments = async () => {
    setLoading(true);
    try {
      // Fetch comments
      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (commentsError) {
        console.error('Error fetching comments:', commentsError);
        return;
      }

      // Fetch profiles for comment authors
      const userIds = commentsData?.map(comment => comment.user_id) || [];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url, current_rank, is_verified, verification_tier')
        .in('user_id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      }

      // Combine comments with profiles
      const commentsWithProfiles = commentsData?.map(comment => ({
        ...comment,
        profiles: profilesData?.find(profile => profile.user_id === comment.user_id)
      })) || [];

      setComments(commentsWithProfiles);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          content: newComment.trim(),
          post_id: postId,
          user_id: user.id,
        });

      if (error) throw error;

      setNewComment('');
      fetchComments();
      
      toast({
        title: "Success!",
        description: "Your comment has been added.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Comment deleted successfully",
      });

      fetchComments();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete comment",
        variant: "destructive",
      });
    }
  };

  const canDeleteComment = (comment: CommentWithProfile) => {
    if (!user) return false;
    // User can delete their own comments or if they're the post author
    return user.id === comment.user_id || user.id === postAuthorId;
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  useEffect(() => {
    if (isOpen) {
      fetchComments();
    }
  }, [isOpen, postId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-end">
      <div className="bg-background w-full h-[70vh] rounded-t-3xl p-6 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Comments</h3>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse flex gap-3">
                  <div className="h-8 w-8 bg-muted rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/4"></div>
                    <div className="h-3 bg-muted rounded w-3/4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No comments yet. Be the first to comment!
            </div>
          ) : (
            comments.map((comment) => {
              const displayName = comment.profiles?.display_name || comment.profiles?.username || 'Anonymous';
              const username = comment.profiles?.username || 'user';
              
              return (
                <div key={comment.id} className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={comment.profiles?.avatar_url} />
                    <AvatarFallback className="text-xs">
                      {getInitials(displayName)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <UserDisplayName
                          displayName={displayName}
                          username={username}
                          rank={comment.profiles?.current_rank}
                          isVerified={comment.profiles?.is_verified}
                          verificationTier={comment.profiles?.verification_tier}
                          className="text-sm"
                        />
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      {canDeleteComment(comment) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteComment(comment.id)}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    <p className="text-sm">{comment.content}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <form onSubmit={handleSubmitComment} className="flex gap-2">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 min-h-[40px] max-h-[100px]"
          />
          <Button 
            type="submit" 
            disabled={submitting || !newComment.trim()}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default VideoComments;