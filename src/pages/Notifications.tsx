import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageCircle, UserPlus } from 'lucide-react';

interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow';
  created_at: string;
  from_user: {
    username: string;
    display_name: string;
    avatar_url: string;
  };
  post?: {
    id: string;
    content: string;
  };
}

const Notifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    // For now, we'll create mock notifications since we don't have a notifications table yet
    // In a real app, you'd query a notifications table
    setLoading(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="h-5 w-5 text-red-500" />;
      case 'comment':
        return <MessageCircle className="h-5 w-5 text-blue-500" />;
      case 'follow':
        return <UserPlus className="h-5 w-5 text-green-500" />;
      default:
        return null;
    }
  };

  const getNotificationText = (notification: Notification) => {
    const name = notification.from_user.display_name || notification.from_user.username;
    switch (notification.type) {
      case 'like':
        return `${name} liked your post`;
      case 'comment':
        return `${name} commented on your post`;
      case 'follow':
        return `${name} started following you`;
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-muted rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 pb-20 space-y-6">
      <h1 className="text-3xl font-bold">Notifications</h1>
      
      {notifications.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No notifications yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                When people interact with your posts, you'll see it here
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <Card key={notification.id} className="hover:bg-muted/50 transition-colors">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={notification.from_user.avatar_url} />
                    <AvatarFallback>
                      {notification.from_user.display_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getNotificationIcon(notification.type)}
                      <p className="text-sm">
                        {getNotificationText(notification)}
                      </p>
                    </div>
                    
                    {notification.post && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        "{notification.post.content}"
                      </p>
                    )}
                    
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;