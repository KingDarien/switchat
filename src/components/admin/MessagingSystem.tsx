import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { MessageCircle, Send, Users, Search, AlertTriangle } from 'lucide-react';

interface Conversation {
  id: string;
  participant_1_id: string;
  participant_2_id: string;
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
  participant_1_profile: {
    display_name: string;
    username: string;
    avatar_url: string;
  };
  participant_2_profile: {
    display_name: string;
    username: string;
    avatar_url: string;
  };
  last_message?: {
    content: string;
    sender_id: string;
    created_at: string;
  };
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_deleted: boolean;
  is_system_message: boolean;
  sender_profile: {
    display_name: string;
    username: string;
    avatar_url: string;
  };
}

const MessagingSystem = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .order('last_message_at', { ascending: false, nullsFirst: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        setConversations([]);
        return;
      }

      // Get profiles for participants
      const userIds = [...new Set([
        ...data.map(c => c.participant_1_id),
        ...data.map(c => c.participant_2_id)
      ])];
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, username, avatar_url')
        .in('user_id', userIds);

      // Get last messages for each conversation
      const conversationsWithMessages = await Promise.all(
        data.map(async (conversation) => {
          const { data: lastMessage } = await supabase
            .from('messages')
            .select('content, sender_id, created_at')
            .eq('conversation_id', conversation.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          const participant1Profile = profiles?.find(p => p.user_id === conversation.participant_1_id);
          const participant2Profile = profiles?.find(p => p.user_id === conversation.participant_2_id);

          return {
            ...conversation,
            participant_1_profile: participant1Profile || { display_name: '', username: '', avatar_url: '' },
            participant_2_profile: participant2Profile || { display_name: '', username: '', avatar_url: '' },
            last_message: lastMessage
          };
        })
      );

      setConversations(conversationsWithMessages);
    } catch (error: any) {
      console.error('Error fetching conversations:', error);
      toast({
        title: "Error",
        description: "Failed to load conversations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) {
        setMessages([]);
        return;
      }

      // Get profiles for message senders
      const senderIds = [...new Set(data.map(m => m.sender_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, username, avatar_url')
        .in('user_id', senderIds);

      const messagesWithProfiles = data.map(message => ({
        ...message,
        sender_profile: profiles?.find(p => p.user_id === message.sender_id) || {
          display_name: '',
          username: '',
          avatar_url: ''
        }
      }));

      setMessages(messagesWithProfiles);
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    }
  };

  const sendSystemMessage = async (conversationId: string, content: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content,
          is_system_message: true
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "System message sent",
      });

      fetchMessages(conversationId);
      setNewMessage('');
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const moderateMessage = async (messageId: string, action: 'delete' | 'flag') => {
    try {
      if (action === 'delete') {
        const { error } = await supabase
          .from('messages')
          .update({ is_deleted: true })
          .eq('id', messageId);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Message deleted",
        });
      }

      if (selectedConversation) {
        fetchMessages(selectedConversation.id);
      }
    } catch (error: any) {
      console.error('Error moderating message:', error);
      toast({
        title: "Error",
        description: "Failed to moderate message",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  const filteredConversations = conversations.filter(conversation =>
    conversation.participant_1_profile.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conversation.participant_1_profile.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conversation.participant_2_profile.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conversation.participant_2_profile.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participant_1_id === user?.id 
      ? conversation.participant_2_profile 
      : conversation.participant_1_profile;
  };

  return (
    <div className="flex h-[600px] gap-4">
      {/* Conversations List */}
      <Card className="w-1/3">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Conversations
          </CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[450px]">
            {loading ? (
              <div className="p-4 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-16 bg-muted rounded"></div>
                  </div>
                ))}
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2" />
                <p>No conversations found</p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredConversations.map((conversation) => {
                  const otherParticipant = getOtherParticipant(conversation);
                  return (
                    <div
                      key={conversation.id}
                      className={`p-4 cursor-pointer hover:bg-muted/50 border-b ${
                        selectedConversation?.id === conversation.id ? 'bg-muted' : ''
                      }`}
                      onClick={() => setSelectedConversation(conversation)}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={otherParticipant.avatar_url} />
                          <AvatarFallback>
                            {otherParticipant.display_name?.[0] || otherParticipant.username?.[0] || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {otherParticipant.display_name || otherParticipant.username}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {conversation.last_message ? conversation.last_message.content : 'No messages yet'}
                          </p>
                        </div>
                        {conversation.last_message_at && (
                          <p className="text-xs text-muted-foreground">
                            {new Date(conversation.last_message_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Messages */}
      <Card className="flex-1">
        <CardHeader>
          {selectedConversation ? (
            <CardTitle className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={getOtherParticipant(selectedConversation).avatar_url} />
                <AvatarFallback>
                  {getOtherParticipant(selectedConversation).display_name?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              {getOtherParticipant(selectedConversation).display_name || getOtherParticipant(selectedConversation).username}
              <Badge variant="secondary">Admin View</Badge>
            </CardTitle>
          ) : (
            <CardTitle>Select a conversation</CardTitle>
          )}
        </CardHeader>
        <CardContent className="flex flex-col h-[500px]">
          {selectedConversation ? (
            <>
              <ScrollArea className="flex-1 mb-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      {message.sender_id !== user?.id && (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={message.sender_profile.avatar_url} />
                          <AvatarFallback>
                            {message.sender_profile.display_name?.[0] || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className={`max-w-[70%] ${message.sender_id === user?.id ? 'order-first' : ''}`}>
                        <div
                          className={`p-3 rounded-lg ${
                            message.is_system_message
                              ? 'bg-blue-100 border border-blue-200'
                              : message.sender_id === user?.id
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          } ${message.is_deleted ? 'opacity-50' : ''}`}
                        >
                          {message.is_deleted ? (
                            <p className="italic text-muted-foreground">This message was deleted</p>
                          ) : (
                            <p className="text-sm">{message.content}</p>
                          )}
                          {message.is_system_message && (
                            <Badge variant="outline" className="mt-2 text-xs">System Message</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-muted-foreground">
                            {new Date(message.created_at).toLocaleTimeString()}
                          </p>
                          {!message.is_deleted && !message.is_system_message && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => moderateMessage(message.id, 'delete')}
                              className="h-6 px-2 text-xs"
                            >
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Delete
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="flex gap-2">
                <Textarea
                  placeholder="Send a system message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 min-h-[80px]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (newMessage.trim()) {
                        sendSystemMessage(selectedConversation.id, newMessage);
                      }
                    }
                  }}
                />
                <Button
                  onClick={() => sendSystemMessage(selectedConversation.id, newMessage)}
                  disabled={!newMessage.trim()}
                  className="self-end"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 mx-auto mb-4" />
                <p>Select a conversation to view messages</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MessagingSystem;