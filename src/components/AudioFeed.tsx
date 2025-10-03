
import { useState, useEffect } from 'react';
import CreateRoomDialog from './CreateRoomDialog';
import VoiceStoryDialog from './VoiceStoryDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Mic, MicOff, Play, Pause, Volume2, Users, Plus, Hand, MoreVertical, Volume } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { toast as sonnerToast } from 'sonner';
import { cn } from '@/lib/utils';
import { useLiveKit } from '@/hooks/useLiveKit';
import AudioWaveform from './AudioWaveform';

interface AudioRoom {
  id: string;
  title: string;
  description: string;
  topic: string;
  host_id: string;
  current_participants: number;
  max_participants: number;
  is_active: boolean;
  created_at: string;
}

interface VoiceMemo {
  id: string;
  user_id: string;
  title: string;
  audio_url: string;
  duration: number;
  transcript: string;
  created_at: string;
  profiles: {
    username: string;
    display_name: string;
    avatar_url: string;
    is_verified: boolean;
  };
}

interface RoomParticipant {
  id: string;
  role: string; // Will be 'host' | 'speaker' | 'listener' but coming from DB as string
  is_muted: boolean;
  hand_raised: boolean;
  profiles: {
    username: string;
    display_name: string;
    avatar_url: string;
  };
}

const AudioFeed = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [audioRooms, setAudioRooms] = useState<AudioRoom[]>([]);
  const [voiceMemos, setVoiceMemos] = useState<VoiceMemo[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [roomParticipants, setRoomParticipants] = useState<RoomParticipant[]>([]);
  const [isInRoom, setIsInRoom] = useState(false);
  const [userRole, setUserRole] = useState<'listener' | 'speaker'>('listener');
  const [isMuted, setIsMuted] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [playingMemo, setPlayingMemo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showCreateStory, setShowCreateStory] = useState(false);

  // LiveKit integration
  const livekit = useLiveKit();
  const [needsAudioStart, setNeedsAudioStart] = useState(false);

  useEffect(() => {
    fetchAudioRooms();
    fetchVoiceMemos();

    // Subscribe to real-time updates for new audio rooms
    const roomsChannel = supabase
      .channel('audio-rooms-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'audio_rooms'
        },
        (payload) => {
          console.log('New room created:', payload.new);
          const newRoom = payload.new as AudioRoom;
          setAudioRooms(prev => [newRoom, ...prev]);
          
          // Show toast notification if room created by someone else
          if (newRoom.host_id !== user?.id) {
            sonnerToast.success('New audio room available!', {
              description: newRoom.title
            });
          }
        }
      )
      .subscribe();

    // Subscribe to real-time updates for new voice memos
    const memosChannel = supabase
      .channel('voice-memos-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'voice_memos'
        },
        async (payload) => {
          const newMemo = payload.new as any;
          // Fetch profile for the new memo
          const { data: profile } = await supabase
            .from('profiles')
            .select('user_id, username, display_name, avatar_url, is_verified')
            .eq('user_id', newMemo.user_id)
            .single();

          const memoWithProfile = {
            ...newMemo,
            profiles: profile || {
              username: '',
              display_name: '',
              avatar_url: '',
              is_verified: false
            }
          };

          setVoiceMemos(prev => [memoWithProfile, ...prev]);
          
          // Show toast notification if story created by someone else
          if (newMemo.user_id !== user?.id) {
            sonnerToast.success('New voice story available!', {
              description: profile?.display_name || 'New story'
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(roomsChannel);
      supabase.removeChannel(memosChannel);
    };
  }, []);

  const fetchAudioRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('audio_rooms')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAudioRooms(data || []);
    } catch (error) {
      console.error('Error fetching audio rooms:', error);
    }
  };

  const fetchVoiceMemos = async () => {
    try {
      const { data: memos, error } = await supabase
        .from('voice_memos')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      // Fetch profiles for memos
      if (memos && memos.length > 0) {
        const userIds = memos.map(m => m.user_id);
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, username, display_name, avatar_url, is_verified')
          .in('user_id', userIds);

        if (profilesError) throw profilesError;

        // Combine data
        const memosWithProfiles = memos.map(memo => ({
          ...memo,
          profiles: profiles?.find(p => p.user_id === memo.user_id) || {
            username: '',
            display_name: '',
            avatar_url: '',
            is_verified: false
          }
        }));

        setVoiceMemos(memosWithProfiles as VoiceMemo[]);
      } else {
        setVoiceMemos([]);
      }
    } catch (error) {
      console.error('Error fetching voice memos:', error);
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = async (roomId: string) => {
    try {
      const { error } = await supabase
        .from('room_participants')
        .insert({
          room_id: roomId,
          user_id: user?.id,
          role: 'listener'
        });

      if (error) throw error;

      setSelectedRoom(roomId);
      setIsInRoom(true);
      setUserRole('listener');
      fetchRoomParticipants(roomId);
      
      // Request LiveKit token and connect as listener
      const { data: tokenData, error: tokenError } = await supabase.functions.invoke('livekit-token', {
        body: { roomId, asSpeaker: false }
      });

      if (tokenError || !tokenData?.token || !tokenData?.wsUrl) {
        console.error('Error getting LiveKit token:', tokenError);
        toast({
          title: "Joined room",
          description: "You're now listening (audio may be limited).",
        });
        return;
      }

      try {
        await livekit.connect(tokenData.wsUrl, tokenData.token, false);
        // Attempt to start audio; if blocked, show helper button
        try {
          await livekit.startAudio();
          setNeedsAudioStart(false);
        } catch {
          setNeedsAudioStart(true);
        }
      } catch (lkErr) {
        console.error('LiveKit connect error:', lkErr);
        toast({
          title: "Joined room",
          description: "Connected without live audio due to a connection issue.",
        });
      }

      toast({
        title: "Joined room",
        description: "You're now listening to the conversation",
      });
    } catch (error) {
      console.error('Error joining room:', error);
      toast({
        title: "Error",
        description: "Failed to join room",
        variant: "destructive",
      });
    }
  };

  const leaveRoom = async () => {
    if (!selectedRoom) return;

    try {
      const { error } = await supabase
        .from('room_participants')
        .delete()
        .match({ room_id: selectedRoom, user_id: user?.id });

      if (error) throw error;

      // Disconnect from LiveKit
      await livekit.leave();

      setSelectedRoom(null);
      setIsInRoom(false);
      setUserRole('listener');
      setRoomParticipants([]);
      setNeedsAudioStart(false);
      
      toast({
        title: "Left room",
        description: "You've left the conversation",
      });
    } catch (error) {
      console.error('Error leaving room:', error);
    }
  };

  const fetchRoomParticipants = async (roomId: string) => {
    try {
      const { data: participants, error } = await supabase
        .from('room_participants')
        .select('*')
        .eq('room_id', roomId);

      if (error) throw error;

      if (participants && participants.length > 0) {
        const userIds = participants.map(p => p.user_id);
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, username, display_name, avatar_url')
          .in('user_id', userIds);

        if (profilesError) throw profilesError;

        // Combine data
        const participantsWithProfiles = participants.map(participant => ({
          ...participant,
          profiles: profiles?.find(p => p.user_id === participant.user_id) || {
            username: '',
            display_name: '',
            avatar_url: ''
          }
        }));

        setRoomParticipants(participantsWithProfiles as RoomParticipant[]);
      } else {
        setRoomParticipants([]);
      }
    } catch (error) {
      console.error('Error fetching room participants:', error);
    }
  };

  const toggleMute = async () => {
    if (!selectedRoom) return;

    try {
      const { error } = await supabase
        .from('room_participants')
        .update({ is_muted: !isMuted })
        .match({ room_id: selectedRoom, user_id: user?.id });

      if (error) throw error;
      setIsMuted(!isMuted);

      // Also toggle LiveKit mic if user is a speaker
      if (userRole === 'speaker') {
        await livekit.setMute(!isMuted);
      }
    } catch (error) {
      console.error('Error toggling mute:', error);
    }
  };

  const toggleHandRaise = async () => {
    if (!selectedRoom) return;

    try {
      const { error } = await supabase
        .from('room_participants')
        .update({ hand_raised: !handRaised })
        .match({ room_id: selectedRoom, user_id: user?.id });

      if (error) throw error;
      setHandRaised(!handRaised);
    } catch (error) {
      console.error('Error toggling hand raise:', error);
    }
  };

  const playVoiceMemo = (memoId: string) => {
    if (playingMemo === memoId) {
      setPlayingMemo(null);
    } else {
      setPlayingMemo(memoId);
      // Here you would implement actual audio playback
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="text-muted-foreground">Loading audio content...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-background via-background to-muted/20 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b bg-background/95 backdrop-blur-md shadow-sm">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              🎙️ Audio Space
            </h1>
            <p className="text-sm text-muted-foreground">Live conversations & voice stories</p>
          </div>
          <Button 
            size="lg" 
            className="gap-2 shadow-lg hover:shadow-xl bg-gradient-to-r from-primary to-accent hover:scale-105 transition-all font-semibold" 
            onClick={() => setShowCreateRoom(true)}
          >
            <Plus className="h-5 w-5" />
            Start Live Room
          </Button>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)] max-w-7xl mx-auto">
        {/* Left Panel - Rooms & Memos */}
        <div className="w-full lg:w-80 border-r bg-background/50 flex flex-col overflow-hidden">
          {/* Live Rooms */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                Live Rooms
              </h3>
              <Button 
                size="sm" 
                variant="outline"
                className="h-8 gap-1.5 hover:bg-primary hover:text-primary-foreground transition-all"
                onClick={() => setShowCreateRoom(true)}
              >
                <Plus className="h-3.5 w-3.5" />
                New
              </Button>
            </div>
            <ScrollArea className="h-48">
              <div className="space-y-2">
                {audioRooms.map((room) => (
                  <Card 
                    key={room.id} 
                    className={cn(
                      "cursor-pointer transition-all duration-200 hover:bg-accent/50 hover:shadow-md hover:scale-[1.02]",
                      selectedRoom === room.id && "border-primary bg-primary/10 shadow-lg"
                    )}
                    onClick={() => !isInRoom ? joinRoom(room.id) : null}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{room.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{room.topic}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              <Users className="h-3 w-3 mr-1" />
                              {room.current_participants}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>

          <Separator />

          {/* Voice Memos */}
          <div className="flex-1 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Voice Stories</h3>
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-7 gap-1"
                onClick={() => setShowCreateStory(true)}
              >
                <Mic className="h-3 w-3" />
                Record
              </Button>
            </div>
            <ScrollArea className="h-full">
              <div className="space-y-3">
                {voiceMemos.map((memo) => (
                  <Card key={memo.id} className="hover:bg-accent/30 hover:shadow-md transition-all duration-200 hover:scale-[1.01] cursor-pointer">
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={memo.profiles?.avatar_url} />
                          <AvatarFallback>
                            {memo.profiles?.display_name?.[0] || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <p className="font-medium text-sm truncate">
                              {memo.profiles?.display_name || memo.profiles?.username}
                            </p>
                            {memo.profiles?.is_verified && (
                              <div className="w-3 h-3 bg-primary rounded-full flex items-center justify-center">
                                <div className="w-1 h-1 bg-white rounded-full"></div>
                              </div>
                            )}
                          </div>
                          {memo.title && (
                            <p className="text-xs text-muted-foreground truncate">{memo.title}</p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={() => playVoiceMemo(memo.id)}
                            >
                              {playingMemo === memo.id ? (
                                <Pause className="h-3 w-3" />
                              ) : (
                                <Play className="h-3 w-3" />
                              )}
                            </Button>
                            <AudioWaveform isPlaying={playingMemo === memo.id} />
                            <span className="text-xs text-muted-foreground">
                              {formatDuration(memo.duration)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Right Panel - Room View */}
        <div className="flex-1 flex flex-col">
          {isInRoom && selectedRoom ? (
            <>
              {/* Room Header */}
              <div className="p-4 border-b bg-background/50">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold">
                      {audioRooms.find(r => r.id === selectedRoom)?.title}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {audioRooms.find(r => r.id === selectedRoom)?.topic}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={leaveRoom}>
                    Leave Room
                  </Button>
                </div>
              </div>

              {/* Speaker Grid */}
              <div className="flex-1 p-6">
                <div className="h-full flex flex-col items-center justify-center">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
                    {roomParticipants
                      .filter(p => p.role === 'host' || p.role === 'speaker')
                      .map((participant) => (
                        <div key={participant.id} className="flex flex-col items-center">
                          <div className="relative">
                            <Avatar className="h-16 w-16 ring-4 ring-primary/20">
                              <AvatarImage src={participant.profiles?.avatar_url} />
                              <AvatarFallback>
                                {participant.profiles?.display_name?.[0] || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            {participant.is_muted && (
                              <div className="absolute -bottom-1 -right-1 bg-red-500 rounded-full p-1">
                                <MicOff className="h-2 w-2 text-white" />
                              </div>
                            )}
                            {participant.role === 'host' && (
                              <Badge className="absolute -top-2 -right-2 text-xs">Host</Badge>
                            )}
                          </div>
                          <p className="text-sm font-medium mt-2 text-center">
                            {participant.profiles?.display_name || participant.profiles?.username}
                          </p>
                        </div>
                      ))}
                  </div>

                  {/* Listeners Count */}
                  <div className="text-center mb-6">
                    <p className="text-sm text-muted-foreground">
                      {roomParticipants.filter(p => p.role === 'listener').length} listeners
                    </p>
                  </div>
                </div>
              </div>

              {/* Room Controls */}
              <div className="p-4 border-t bg-background/50">
                <div className="flex items-center justify-center gap-4">
                  {userRole === 'speaker' && (
                    <Button
                      size="lg"
                      variant={isMuted ? "destructive" : "default"}
                      onClick={toggleMute}
                      className="rounded-full w-12 h-12"
                    >
                      {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                    </Button>
                  )}

                  <Button
                    size="lg"
                    variant={handRaised ? "default" : "outline"}
                    onClick={toggleHandRaise}
                    className="rounded-full w-12 h-12"
                  >
                    <Hand className="h-5 w-5" />
                  </Button>

                  <Button size="lg" variant="outline" className="rounded-full w-12 h-12">
                    <Volume2 className="h-5 w-5" />
                  </Button>

                  {needsAudioStart && (
                    <Button
                      size="lg"
                      className="rounded-full"
                      onClick={async () => {
                        try {
                          await livekit.startAudio();
                          setNeedsAudioStart(false);
                          toast({
                            title: "Audio enabled",
                            description: "You should now hear the conversation.",
                          });
                        } catch (e) {
                          toast({
                            title: "Action required",
                            description: "Please allow audio playback in your browser.",
                          });
                        }
                      }}
                    >
                      Enable Audio
                    </Button>
                  )}
                </div>
              </div>
            </>
          ) : (
            /* Welcome Screen */
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-md">
                <div className="mb-6">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mic className="h-10 w-10 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Welcome to Audio Space</h2>
                  <p className="text-muted-foreground">
                    Join live conversations or listen to voice stories from the community
                  </p>
                </div>
                
                <div className="space-y-3">
                  <Button className="w-full gap-2" onClick={() => setShowCreateRoom(true)}>
                    <Plus className="h-4 w-4" />
                    Start a Room
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Or select a live room from the sidebar to join
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <CreateRoomDialog 
        open={showCreateRoom} 
        onOpenChange={setShowCreateRoom}
        onRoomCreated={fetchAudioRooms}
      />

      <VoiceStoryDialog
        open={showCreateStory}
        onOpenChange={setShowCreateStory}
        onStoryCreated={fetchVoiceMemos}
      />
    </div>
  );
};

export default AudioFeed;
