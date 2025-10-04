import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Send, MessageCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface RoomMessage {
  id: string;
  room_id: string;
  user_id: string;
  content: string;
  created_at: string;
  is_deleted: boolean;
  profiles?: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
    is_verified: boolean;
  };
}

interface RoomChatProps {
  roomId: string;
  isVisible: boolean;
  isHost: boolean;
  onClose: () => void;
  onUnreadChange?: (count: number) => void;
}

export const RoomChat = ({ roomId, isVisible, isHost, onClose, onUnreadChange }: RoomChatProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!roomId || !user) return;

    fetchMessages();
    subscribeToMessages();
  }, [roomId, user]);

  useEffect(() => {
    if (isVisible) {
      setUnreadCount(0);
      onUnreadChange?.(0);
      scrollToBottom();
    }
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible && unreadCount > 0) {
      onUnreadChange?.(unreadCount);
    }
  }, [unreadCount, isVisible]);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("room_messages")
        .select("*")
        .eq("room_id", roomId)
        .eq("is_deleted", false)
        .order("created_at", { ascending: true })
        .limit(100);

      if (error) throw error;
      
      // Fetch profiles separately
      if (data) {
        const userIds = [...new Set(data.map(m => m.user_id))];
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("user_id, username, display_name, avatar_url, is_verified")
          .in("user_id", userIds);
        
        const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);
        const messagesWithProfiles = data.map(msg => ({
          ...msg,
          profiles: profilesMap.get(msg.user_id) || null,
        }));
        
        setMessages(messagesWithProfiles as RoomMessage[]);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`room-chat:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "room_messages",
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("username, display_name, avatar_url, is_verified")
            .eq("user_id", payload.new.user_id)
            .single();

          const newMessage = {
            ...payload.new,
            profiles: profileData,
          } as RoomMessage;

          setMessages((prev) => [...prev, newMessage]);
          
          if (!isVisible && payload.new.user_id !== user?.id) {
            setUnreadCount((prev) => prev + 1);
          }
          
          scrollToBottom();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "room_messages",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          setMessages((prev) => prev.filter((msg) => msg.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 100);
  };

  const sendMessage = async () => {
    if (!messageText.trim() || !user) return;

    try {
      const { error } = await supabase.from("room_messages").insert({
        room_id: roomId,
        user_id: user.id,
        content: messageText.trim(),
      });

      if (error) throw error;
      setMessageText("");
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast.error(error.message || "Failed to send message");
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from("room_messages")
        .delete()
        .eq("id", messageId);

      if (error) throw error;
    } catch (error: any) {
      console.error("Error deleting message:", error);
      toast.error("Failed to delete message");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 w-[350px] h-[500px] bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-lg flex flex-col z-50 animate-slide-in-right">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm">Room Chat</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-3" ref={scrollRef}>
        {loading ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            No messages yet. Start the conversation!
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => {
              const displayName = message.profiles?.display_name || message.profiles?.username || "Anonymous";
              const isOwnMessage = message.user_id === user?.id;

              return (
                <div
                  key={message.id}
                  className={`flex gap-2 ${isOwnMessage ? "flex-row-reverse" : ""}`}
                >
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarImage src={message.profiles?.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {displayName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className={`flex-1 ${isOwnMessage ? "text-right" : ""}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-xs">{displayName}</span>
                      {message.profiles?.is_verified && (
                        <span className="text-xs text-primary">✓</span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <div
                        className={`rounded-lg px-3 py-2 text-sm inline-block max-w-[240px] break-words ${
                          isOwnMessage
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        {message.content}
                      </div>
                      
                      {(isOwnMessage || isHost) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 opacity-0 hover:opacity-100 transition-opacity"
                          onClick={() => deleteMessage(message.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="p-3 border-t border-border">
        <div className="flex gap-2">
          <Textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type a message..."
            className="min-h-[60px] max-h-[120px] resize-none"
            maxLength={500}
          />
          <Button
            onClick={sendMessage}
            disabled={!messageText.trim()}
            size="sm"
            className="self-end"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {messageText.length}/500
        </p>
      </div>
    </div>
  );
};
