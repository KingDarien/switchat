import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import CommentForm from './CommentForm';
import UserDisplayName from './UserDisplayName';
import { useAuth } from '@/hooks/useAuth';
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

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
}

interface CommentWithProfile extends Comment {
  profiles?: Profile;
}

interface CommentsProps {
  postId: string;
  commentsCount: number;
  onCommentsCountChange: (count: number) => void;
  postAuthorId?: string;
}

const Comments = ({ postId, commentsCount, onCommentsCountChange, postAuthorId }: CommentsProps) => {
  const [comments, setComments] = useState<CommentWithProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [profileUpdates, setProfileUpdates] = useState<{[key: string]: any}>({});
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
      onCommentsCountChange(commentsWithProfiles.length);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchComments();
    }
  }, [isOpen, postId]);

  // Listen for real-time profile updates
  useEffect(() => {
    if (!isOpen || comments.length === 0) return;

    const uniqueUserIds = Array.from(new Set(comments.map(c => c.profiles?.user_id).filter(Boolean)));
    if (uniqueUserIds.length === 0) return;

    const channel = supabase
      .channel('comment-profile-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles'
        },
        (payload) => {
          if (uniqueUserIds.includes(payload.new.user_id)) {
            setProfileUpdates(prev => ({
              ...prev,
              [payload.new.user_id]: payload.new
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    }
  }, [isOpen, comments]);

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
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

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-2 text-muted-foreground">
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          <span>{commentsCount} {commentsCount === 1 ? 'comment' : 'comments'}</span>
        </Button>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="space-y-4 mt-4">
        <CommentForm postId={postId} onCommentAdded={fetchComments} />
        
        {loading ? (
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="animate-pulse flex gap-3">
                <div className="h-8 w-8 bg-muted rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/4"></div>
                  <div className="h-3 bg-muted rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => {
              const updatedProfile = profileUpdates[comment.profiles?.user_id] || comment.profiles;
              const displayName = updatedProfile?.display_name || updatedProfile?.username || 'Anonymous';
              const username = updatedProfile?.username || 'user';
              
              return (
                <div key={comment.id} className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={updatedProfile?.avatar_url} />
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
                          userId={updatedProfile?.user_id}
                          rank={updatedProfile?.current_rank}
                          isVerified={updatedProfile?.is_verified}
                          verificationTier={updatedProfile?.verification_tier}
                          variant="compact"
                          size="sm"
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
            })}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
};

export default Comments;