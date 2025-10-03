
import { useState, useEffect, useRef } from 'react';
import CreateRoomDialog from './CreateRoomDialog';
import VoiceStoryDialog from './VoiceStoryDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Mic, MicOff, Play, Pause, Volume2, Users, Plus, Hand, MoreVertical, Volume, Trash2, UserCog, ThumbsUp, ThumbsDown, Share2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
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
  like_count?: number;
  dislike_count?: number;
  user_reaction?: 'like' | 'dislike' | null;
}

interface VoiceMemo {
  id: string;
  user_id: string;
  title: string;
  audio_url: string;
  duration: number;
  transcript: string;
  is_public: boolean;
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
  user_id: string;
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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<string | null>(null);
  const [selectedNewHost, setSelectedNewHost] = useState<string | null>(null);
  const [storyToDelete, setStoryToDelete] = useState<string | null>(null);
  const [showDeleteStoryDialog, setShowDeleteStoryDialog] = useState(false);
  const [showEditStoryDialog, setShowEditStoryDialog] = useState(false);
  const [showScheduleStoryDialog, setShowScheduleStoryDialog] = useState(false);
  const [selectedStory, setSelectedStory] = useState<VoiceMemo | null>(null);
  const [userReactions, setUserReactions] = useState<Record<string, 'like' | 'dislike'>>({});

  // Audio playback for voice memos
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // LiveKit integration
  const livekit = useLiveKit();
  const [needsAudioStart, setNeedsAudioStart] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<AudioRoom | null>(null);

  useEffect(() => {
    fetchAudioRooms();
    fetchVoiceMemos();
    if (user?.id) {
      fetchUserReactions();
    }

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

    // Subscribe to room participants changes
    const participantsChannel = selectedRoom ? supabase
      .channel(`room-participants-${selectedRoom}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_participants',
          filter: `room_id=eq.${selectedRoom}`
        },
        async (payload) => {
          if (selectedRoom) {
            fetchRoomParticipants(selectedRoom);
            
            // If current user's role was changed, update local state and reconnect
            if (payload.eventType === 'UPDATE' && payload.new && 
                (payload.new as any).user_id === user?.id) {
              const newRole = (payload.new as any).role;
              
              if (newRole === 'speaker' && userRole === 'listener') {
                // Promoted to speaker - reconnect with mic permissions
                setUserRole('speaker');
                sonnerToast.success('You\'ve been promoted to speaker!', {
                  description: 'You can now unmute your microphone'
                });
                
                // Reconnect to LiveKit with speaker permissions
                try {
                  await livekit.leave();
                  const { data: tokenData } = await supabase.functions.invoke('livekit-token', {
                    body: { roomId: selectedRoom, asSpeaker: true }
                  });
                  if (tokenData?.token && tokenData?.wsUrl) {
                    await livekit.connect(tokenData.wsUrl, tokenData.token, true);
                  }
                } catch (error) {
                  console.error('Error reconnecting as speaker:', error);
                }
              } else if (newRole === 'listener' && userRole === 'speaker') {
                // Demoted to listener
                setUserRole('listener');
                setIsMuted(true);
                sonnerToast.info('You\'ve been moved to listener');
                
                // Reconnect without mic permissions
                try {
                  await livekit.leave();
                  const { data: tokenData } = await supabase.functions.invoke('livekit-token', {
                    body: { roomId: selectedRoom, asSpeaker: false }
                  });
                  if (tokenData?.token && tokenData?.wsUrl) {
                    await livekit.connect(tokenData.wsUrl, tokenData.token, false);
                  }
                } catch (error) {
                  console.error('Error reconnecting as listener:', error);
                }
              }
            }
          }
        }
      )
      .subscribe() : null;

    // Subscribe to real-time updates for room reactions
    const reactionsChannel = supabase
      .channel('room-reactions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_reactions'
        },
        (payload) => {
          // Refetch rooms to get updated counts
          fetchAudioRooms();
          // Update user reactions if it's current user's reaction
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const reaction = payload.new as any;
            if (reaction.user_id === user?.id) {
              setUserReactions(prev => ({
                ...prev,
                [reaction.room_id]: reaction.reaction_type
              }));
            }
          } else if (payload.eventType === 'DELETE') {
            const reaction = payload.old as any;
            if (reaction.user_id === user?.id) {
              setUserReactions(prev => {
                const updated = { ...prev };
                delete updated[reaction.room_id];
                return updated;
              });
            }
          }
        }
      )
      .subscribe();

    // Cleanup function to ensure user leaves room when component unmounts
    return () => {
      supabase.removeChannel(roomsChannel);
      supabase.removeChannel(memosChannel);
      supabase.removeChannel(reactionsChannel);
      if (participantsChannel) {
        supabase.removeChannel(participantsChannel);
      }
      
      // Leave room if user is in one when component unmounts
      if (selectedRoom && user?.id) {
        supabase
          .from('room_participants')
          .delete()
          .match({ room_id: selectedRoom, user_id: user.id })
          .then(() => {
            livekit.leave();
          });
      }
    };
  }, [selectedRoom, user?.id]);

  const fetchAudioRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('audio_rooms')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Merge with user reactions
      const roomsWithReactions = (data || []).map(room => ({
        ...room,
        user_reaction: userReactions[room.id] || null
      }));
      
      setAudioRooms(roomsWithReactions);
    } catch (error) {
      console.error('Error fetching audio rooms:', error);
    }
  };

  const fetchUserReactions = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('room_reactions')
        .select('room_id, reaction_type')
        .eq('user_id', user.id);

      if (error) throw error;
      
      const reactions: Record<string, 'like' | 'dislike'> = {};
      data?.forEach(r => {
        reactions[r.room_id] = r.reaction_type as 'like' | 'dislike';
      });
      
      setUserReactions(reactions);
    } catch (error) {
      console.error('Error fetching user reactions:', error);
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
      // First check if user is already in the room
      const { data: existingParticipant } = await supabase
        .from('room_participants')
        .select('*')
        .match({ room_id: roomId, user_id: user?.id })
        .maybeSingle();

      // Get room details to check if user is the host
      const { data: room } = await supabase
        .from('audio_rooms')
        .select('host_id')
        .eq('id', roomId)
        .single();

      const isHost = room?.host_id === user?.id;
      let participantRole: 'speaker' | 'listener' = isHost ? 'speaker' : 'listener';

      // If not already a participant, insert new record with appropriate role
      if (!existingParticipant) {
        const { error } = await supabase
          .from('room_participants')
          .insert({
            room_id: roomId,
            user_id: user?.id,
            role: participantRole
          });

        if (error) throw error;
      } else {
        // If already a participant, use their existing role
        participantRole = existingParticipant.role as 'speaker' | 'listener';
      }

      setSelectedRoom(roomId);
      setIsInRoom(true);
      setUserRole(participantRole);
      setCurrentRoom(audioRooms.find(r => r.id === roomId) || null);
      fetchRoomParticipants(roomId);
      
      // Request LiveKit token and connect with appropriate permissions
      const { data: tokenData, error: tokenError } = await supabase.functions.invoke('livekit-token', {
        body: { roomId, asSpeaker: participantRole === 'speaker' }
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
        await livekit.connect(tokenData.wsUrl, tokenData.token, participantRole === 'speaker');
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
        title: isHost ? "Room started" : "Joined room",
        description: isHost ? "You're now live as the host" : "You're now listening to the conversation",
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
      setCurrentRoom(null);
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

  const handleRoomLike = async (roomId: string) => {
    if (!user?.id) {
      toast({
        title: "Sign in required",
        description: "Please sign in to like rooms",
        variant: "destructive",
      });
      return;
    }

    const currentReaction = userReactions[roomId];
    
    try {
      if (currentReaction === 'like') {
        // Remove like
        await supabase
          .from('room_reactions')
          .delete()
          .match({ room_id: roomId, user_id: user.id });
      } else if (currentReaction === 'dislike') {
        // Change from dislike to like
        await supabase
          .from('room_reactions')
          .update({ reaction_type: 'like' })
          .match({ room_id: roomId, user_id: user.id });
      } else {
        // Add new like
        await supabase
          .from('room_reactions')
          .insert({ room_id: roomId, user_id: user.id, reaction_type: 'like' });
      }
    } catch (error) {
      console.error('Error liking room:', error);
      toast({
        title: "Error",
        description: "Failed to like room",
        variant: "destructive",
      });
    }
  };

  const handleRoomDislike = async (roomId: string) => {
    if (!user?.id) {
      toast({
        title: "Sign in required",
        description: "Please sign in to dislike rooms",
        variant: "destructive",
      });
      return;
    }

    const currentReaction = userReactions[roomId];
    
    try {
      if (currentReaction === 'dislike') {
        // Remove dislike
        await supabase
          .from('room_reactions')
          .delete()
          .match({ room_id: roomId, user_id: user.id });
      } else if (currentReaction === 'like') {
        // Change from like to dislike
        await supabase
          .from('room_reactions')
          .update({ reaction_type: 'dislike' })
          .match({ room_id: roomId, user_id: user.id });
      } else {
        // Add new dislike
        await supabase
          .from('room_reactions')
          .insert({ room_id: roomId, user_id: user.id, reaction_type: 'dislike' });
      }
    } catch (error) {
      console.error('Error disliking room:', error);
      toast({
        title: "Error",
        description: "Failed to dislike room",
        variant: "destructive",
      });
    }
  };

  const handleRoomShare = async (roomId: string, roomTitle: string) => {
    const shareUrl = `${window.location.origin}/?room=${roomId}`;
    const shareData = {
      title: `Join "${roomTitle}" on SWITCHAT`,
      text: `Listen to this live audio room: ${roomTitle}`,
      url: shareUrl,
    };

    try {
      // Try Web Share API first (mobile/modern browsers)
      if (navigator.share) {
        await navigator.share(shareData);
        sonnerToast.success('Room shared!');
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(shareUrl);
        sonnerToast.success('Room link copied to clipboard!', {
          description: shareUrl
        });
      }
    } catch (error) {
      // User cancelled share or clipboard failed
      if ((error as Error).name !== 'AbortError') {
        console.error('Error sharing room:', error);
        sonnerToast.error('Failed to share room');
      }
    }
  };

  const playVoiceMemo = async (memoId: string) => {
    const memo = voiceMemos.find(m => m.id === memoId);
    if (!memo?.audio_url) {
      toast({
        title: "Error",
        description: "Audio file not found",
        variant: "destructive",
      });
      return;
    }

    // If clicking the same memo that's playing, pause it
    if (playingMemo === memoId && audioRef.current) {
      audioRef.current.pause();
      setPlayingMemo(null);
      return;
    }

    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    // Create new audio element and play
    try {
      const audio = new Audio();
      
      // Set crossOrigin to anonymous to handle CORS
      audio.crossOrigin = "anonymous";
      
      // Preload the audio
      audio.preload = "auto";
      
      audioRef.current = audio;

      audio.onended = () => {
        setPlayingMemo(null);
        audioRef.current = null;
      };

      audio.onerror = (e) => {
        console.error('Audio error:', e);
        toast({
          title: "Error",
          description: "Failed to play audio. The format may not be supported.",
          variant: "destructive",
        });
        setPlayingMemo(null);
        audioRef.current = null;
      };

      audio.onloadeddata = () => {
        console.log('Audio loaded successfully');
      };

      // Set the source after setting up event listeners
      audio.src = memo.audio_url;
      
      // Try to load and play
      await audio.load();
      await audio.play();
      setPlayingMemo(memoId);
    } catch (error) {
      console.error('Error playing audio:', error);
      toast({
        title: "Error",
        description: "Failed to play audio. Try re-recording.",
        variant: "destructive",
      });
      setPlayingMemo(null);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const deleteVoiceStory = async (storyId: string) => {
    try {
      const { error } = await supabase
        .from('voice_memos')
        .delete()
        .eq('id', storyId);

      if (error) throw error;

      setVoiceMemos(prev => prev.filter(s => s.id !== storyId));
      if (playingMemo === storyId) {
        audioRef.current?.pause();
        setPlayingMemo(null);
      }
      
      sonnerToast.success('Voice story deleted successfully');
    } catch (error) {
      console.error('Error deleting voice story:', error);
      sonnerToast.error('Failed to delete voice story');
    }
  };

  const updateVoiceStory = async (storyId: string, updates: { title?: string; is_public?: boolean }) => {
    try {
      const { error } = await supabase
        .from('voice_memos')
        .update(updates)
        .eq('id', storyId);

      if (error) throw error;

      setVoiceMemos(prev => prev.map(s => 
        s.id === storyId ? { ...s, ...updates } : s
      ));
      
      sonnerToast.success('Voice story updated successfully');
      setShowEditStoryDialog(false);
    } catch (error) {
      console.error('Error updating voice story:', error);
      sonnerToast.error('Failed to update voice story');
    }
  };

  const scheduleVoiceStory = async (storyId: string, scheduledFor: Date) => {
    try {
      const { error } = await supabase
        .from('voice_memos')
        .update({
          is_scheduled: true,
          scheduled_for: scheduledFor.toISOString(),
          is_public: false
        })
        .eq('id', storyId);

      if (error) throw error;

      setVoiceMemos(prev => prev.filter(s => s.id !== storyId));
      
      sonnerToast.success('Voice story scheduled successfully');
      setShowScheduleStoryDialog(false);
    } catch (error) {
      console.error('Error scheduling voice story:', error);
      sonnerToast.error('Failed to schedule voice story');
    }
  };

  const deleteRoom = async (roomId: string) => {
    try {
      const { error } = await supabase
        .from('audio_rooms')
        .delete()
        .eq('id', roomId);

      if (error) throw error;

      setAudioRooms(prev => prev.filter(r => r.id !== roomId));
      if (selectedRoom === roomId) {
        await leaveRoom();
      }
      
      sonnerToast.success('Room deleted successfully');
    } catch (error) {
      console.error('Error deleting room:', error);
      sonnerToast.error('Failed to delete room');
    }
  };

  const transferOwnership = async (roomId: string, newHostId: string) => {
    try {
      const { error } = await supabase
        .from('audio_rooms')
        .update({ host_id: newHostId })
        .eq('id', roomId);

      if (error) throw error;

      // Update the participant role
      await supabase
        .from('room_participants')
        .update({ role: 'host' })
        .match({ room_id: roomId, user_id: newHostId });

      await supabase
        .from('room_participants')
        .update({ role: 'speaker' })
        .match({ room_id: roomId, user_id: user?.id });

      sonnerToast.success('Ownership transferred successfully');
      fetchAudioRooms();
      fetchRoomParticipants(roomId);
    } catch (error) {
      console.error('Error transferring ownership:', error);
      sonnerToast.error('Failed to transfer ownership');
    }
  };

  const muteParticipant = async (participantId: string, userId: string) => {
    if (!selectedRoom || currentRoom?.host_id !== user?.id) return;
    
    try {
      const { error } = await supabase
        .from('room_participants')
        .update({ is_muted: true })
        .eq('id', participantId);

      if (error) throw error;
      
      await fetchRoomParticipants(selectedRoom);
      sonnerToast.success('Participant muted');
    } catch (error) {
      console.error('Error muting participant:', error);
      sonnerToast.error('Failed to mute participant');
    }
  };

  const removeParticipant = async (participantId: string, userId: string) => {
    if (!selectedRoom || currentRoom?.host_id !== user?.id) return;
    
    try {
      const { error } = await supabase
        .from('room_participants')
        .delete()
        .eq('id', participantId);

      if (error) throw error;
      
      await fetchRoomParticipants(selectedRoom);
      sonnerToast.success('Participant removed from room');
    } catch (error) {
      console.error('Error removing participant:', error);
      sonnerToast.error('Failed to remove participant');
    }
  };

  const promoteToSpeaker = async (participantId: string, userId: string) => {
    if (!selectedRoom || currentRoom?.host_id !== user?.id) return;
    
    try {
      const { error } = await supabase
        .from('room_participants')
        .update({ role: 'speaker', is_muted: false })
        .eq('id', participantId);

      if (error) throw error;
      
      await fetchRoomParticipants(selectedRoom);
      sonnerToast.success('Participant promoted to speaker');
    } catch (error) {
      console.error('Error promoting participant:', error);
      sonnerToast.error('Failed to promote participant');
    }
  };

  const demoteToListener = async (participantId: string, userId: string) => {
    if (!selectedRoom || currentRoom?.host_id !== user?.id) return;
    
    try {
      const { error } = await supabase
        .from('room_participants')
        .update({ role: 'listener', is_muted: true })
        .eq('id', participantId);

      if (error) throw error;
      
      await fetchRoomParticipants(selectedRoom);
      sonnerToast.success('Participant demoted to listener');
    } catch (error) {
      console.error('Error demoting participant:', error);
      sonnerToast.error('Failed to demote participant');
    }
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
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)] max-w-7xl mx-auto">
        {/* Left Panel - Rooms & Memos */}
        <div className="w-full lg:w-80 border-r bg-background/50 flex flex-col overflow-hidden">
          {/* Live Rooms */}
          <div className="p-4 bg-accent/30">
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
                Start Live Room
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
                          {/* Reaction and Share Buttons */}
                          <div className="flex items-center gap-3 mt-2" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleRoomLike(room.id)}
                              className={cn(
                                "flex items-center gap-1 text-xs transition-all duration-200 hover:scale-110",
                                userReactions[room.id] === 'like' ? "text-green-500" : "text-muted-foreground hover:text-green-500"
                              )}
                            >
                              <ThumbsUp className={cn("h-3.5 w-3.5", userReactions[room.id] === 'like' && "fill-current")} />
                              <span>{room.like_count || 0}</span>
                            </button>
                            <button
                              onClick={() => handleRoomDislike(room.id)}
                              className={cn(
                                "flex items-center gap-1 text-xs transition-all duration-200 hover:scale-110",
                                userReactions[room.id] === 'dislike' ? "text-red-500" : "text-muted-foreground hover:text-red-500"
                              )}
                            >
                              <ThumbsDown className={cn("h-3.5 w-3.5", userReactions[room.id] === 'dislike' && "fill-current")} />
                              <span>{room.dislike_count || 0}</span>
                            </button>
                            <button
                              onClick={() => handleRoomShare(room.id, room.title)}
                              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-all duration-200 hover:scale-110"
                            >
                              <Share2 className="h-3.5 w-3.5" />
                            </button>
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
          <div className="flex-1 p-4 bg-cyan-200/60 dark:bg-cyan-900/30">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Voice Stories</h3>
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-7 gap-1"
                onClick={() => setShowCreateStory(true)}
              >
                <Mic className="h-3 w-3" />
                Start Voice Story
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
                        
                        {/* Creator Controls */}
                        {memo.user_id === user?.id && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <MoreVertical className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem 
                                onClick={() => {
                                  setSelectedStory(memo);
                                  setShowEditStoryDialog(true);
                                }}
                              >
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => {
                                  setSelectedStory(memo);
                                  setShowScheduleStoryDialog(true);
                                }}
                              >
                                Schedule
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => {
                                  setStoryToDelete(memo.id);
                                  setShowDeleteStoryDialog(true);
                                }}
                                className="text-destructive focus:text-destructive"
                              >
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
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
                  <div className="flex items-center gap-2">
                    {audioRooms.find(r => r.id === selectedRoom)?.host_id === user?.id && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => {
                              setShowTransferDialog(true);
                            }}
                          >
                            <UserCog className="h-4 w-4 mr-2" />
                            Transfer Ownership
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => {
                              setRoomToDelete(selectedRoom);
                              setShowDeleteDialog(true);
                            }}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Room
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                    <Button variant="outline" size="sm" onClick={leaveRoom}>
                      Leave Room
                    </Button>
                  </div>
                </div>
              </div>

              {/* Speaker Grid */}
              <div className="flex-1 p-6 overflow-y-auto">
                <div className="max-w-5xl mx-auto">
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-muted-foreground mb-4">Speakers</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {roomParticipants
                        .filter(p => p.role === 'host' || p.role === 'speaker')
                        .map((participant) => {
                          const isSpeaking = livekit.activeSpeakers.includes(participant.user_id);
                          const isHost = currentRoom?.host_id === user?.id;
                          
                          return (
                            <div key={participant.id} className="flex flex-col items-center group">
                              <div className="relative">
                                <Avatar className={cn(
                                  "h-20 w-20 ring-4 transition-all duration-300",
                                  isSpeaking 
                                    ? "ring-green-500 ring-offset-4 ring-offset-background scale-110" 
                                    : "ring-primary/20"
                                )}>
                                  <AvatarImage src={participant.profiles?.avatar_url} />
                                  <AvatarFallback>
                                    {participant.profiles?.display_name?.[0] || 'U'}
                                  </AvatarFallback>
                                </Avatar>
                                
                                {isSpeaking && (
                                  <div className="absolute inset-0 rounded-full bg-green-500/20 animate-pulse" />
                                )}
                                
                                {participant.is_muted && (
                                  <div className="absolute -bottom-1 -right-1 bg-red-500 rounded-full p-1.5 shadow-lg">
                                    <MicOff className="h-3 w-3 text-white" />
                                  </div>
                                )}
                                
                                {participant.hand_raised && (
                                  <div className="absolute -top-1 -left-1 bg-yellow-500 rounded-full p-1.5 shadow-lg animate-bounce">
                                    <Hand className="h-3 w-3 text-white" />
                                  </div>
                                )}
                                
                                {participant.role === 'host' && (
                                  <Badge className="absolute -top-2 -right-2 text-xs bg-primary">Host</Badge>
                                )}

                                {/* Host Controls */}
                                {isHost && participant.user_id !== user?.id && (
                                  <div className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 w-7 p-0 hover:bg-white/20"
                                      onClick={() => muteParticipant(participant.id, participant.user_id)}
                                      title="Mute participant"
                                    >
                                      <Volume className="h-4 w-4 text-white" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 w-7 p-0 hover:bg-white/20"
                                      onClick={() => demoteToListener(participant.id, participant.user_id)}
                                      title="Demote to listener"
                                    >
                                      <UserCog className="h-4 w-4 text-white" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 w-7 p-0 hover:bg-white/20"
                                      onClick={() => removeParticipant(participant.id, participant.user_id)}
                                      title="Remove from room"
                                    >
                                      <Trash2 className="h-4 w-4 text-white" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                              <p className="text-sm font-medium mt-2 text-center">
                                {participant.profiles?.display_name || participant.profiles?.username}
                              </p>
                              {isSpeaking && (
                                <Badge variant="secondary" className="text-xs mt-1 bg-green-500/20 text-green-700 dark:text-green-400">
                                  Speaking
                                </Badge>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  {/* Listeners */}
                  {roomParticipants.filter(p => p.role === 'listener').length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground mb-4">
                        Listeners ({roomParticipants.filter(p => p.role === 'listener').length})
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {roomParticipants
                          .filter(p => p.role === 'listener')
                          .map((participant) => {
                            const isHost = currentRoom?.host_id === user?.id;
                            
                            return (
                              <div key={participant.id} className="relative group">
                                <Avatar className="h-10 w-10 ring-2 ring-muted">
                                  <AvatarImage src={participant.profiles?.avatar_url} />
                                  <AvatarFallback className="text-xs">
                                    {participant.profiles?.display_name?.[0] || 'U'}
                                  </AvatarFallback>
                                </Avatar>
                                
                                {participant.hand_raised && (
                                  <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-1 shadow-lg animate-bounce">
                                    <Hand className="h-2 w-2 text-white" />
                                  </div>
                                )}

                                {/* Host Controls for listeners */}
                                {isHost && participant.user_id !== user?.id && (
                                  <div className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-0.5">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0 hover:bg-white/20"
                                      onClick={() => promoteToSpeaker(participant.id, participant.user_id)}
                                      title="Promote to speaker"
                                    >
                                      <Mic className="h-3 w-3 text-white" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0 hover:bg-white/20"
                                      onClick={() => removeParticipant(participant.id, participant.user_id)}
                                      title="Remove from room"
                                    >
                                      <Trash2 className="h-3 w-3 text-white" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Room Controls */}
              <div className="p-4 border-t bg-background/50">
                <div className="flex items-center justify-center gap-3">
                  {/* Mic Control - Show for everyone */}
                  <div className="flex flex-col items-center gap-1">
                    <Button
                      size="lg"
                      variant={isMuted ? "destructive" : "default"}
                      onClick={toggleMute}
                      className="rounded-full w-14 h-14 shadow-lg"
                      disabled={userRole === 'listener'}
                    >
                      {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      {userRole === 'listener' ? 'Listening' : isMuted ? 'Muted' : 'Live'}
                    </span>
                  </div>

                  {/* Hand Raise */}
                  <div className="flex flex-col items-center gap-1">
                    <Button
                      size="lg"
                      variant={handRaised ? "default" : "outline"}
                      onClick={toggleHandRaise}
                      className={cn(
                        "rounded-full w-14 h-14 shadow-lg transition-all",
                        handRaised && "bg-yellow-500 hover:bg-yellow-600 animate-bounce"
                      )}
                    >
                      <Hand className="h-6 w-6" />
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      {handRaised ? 'Hand up' : 'Raise hand'}
                    </span>
                  </div>

                  {/* Volume Control */}
                  <div className="flex flex-col items-center gap-1">
                    <Button size="lg" variant="outline" className="rounded-full w-14 h-14 shadow-lg">
                      <Volume2 className="h-6 w-6" />
                    </Button>
                    <span className="text-xs text-muted-foreground">Volume</span>
                  </div>

                  {/* Enable Audio Button */}
                  {needsAudioStart && (
                    <Button
                      size="lg"
                      className="rounded-full px-6 shadow-lg"
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
            /* Empty state when not in room */
            <div className="flex-1"></div>
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

      {/* Delete Room Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Room?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this audio room. All participants will be removed. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (roomToDelete) {
                  deleteRoom(roomToDelete);
                  setRoomToDelete(null);
                }
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete Room
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Transfer Ownership Dialog */}
      <AlertDialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Transfer Room Ownership</AlertDialogTitle>
            <AlertDialogDescription>
              Select a participant to transfer ownership to. You will become a speaker after the transfer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <div className="space-y-2">
              {roomParticipants
                .filter(p => p.profiles && p.id !== user?.id)
                .map((participant) => (
                  <div
                    key={participant.id}
                    onClick={() => setSelectedNewHost(participant.user_id)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg cursor-pointer border-2 transition-all",
                      selectedNewHost === participant.user_id
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={participant.profiles?.avatar_url} />
                      <AvatarFallback>
                        {participant.profiles?.display_name?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {participant.profiles?.display_name || participant.profiles?.username}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">{participant.role}</p>
                    </div>
                  </div>
                ))}
              {roomParticipants.filter(p => p.id !== user?.id).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No other participants to transfer to
                </p>
              )}
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedNewHost(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedRoom && selectedNewHost) {
                  transferOwnership(selectedRoom, selectedNewHost);
                  setSelectedNewHost(null);
                  setShowTransferDialog(false);
                }
              }}
              disabled={!selectedNewHost}
            >
              Transfer Ownership
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Voice Story Dialog */}
      <AlertDialog open={showDeleteStoryDialog} onOpenChange={setShowDeleteStoryDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Voice Story?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this voice story. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (storyToDelete) {
                  deleteVoiceStory(storyToDelete);
                  setStoryToDelete(null);
                }
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete Story
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Voice Story Dialog */}
      <AlertDialog open={showEditStoryDialog} onOpenChange={setShowEditStoryDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Edit Voice Story</AlertDialogTitle>
            <AlertDialogDescription>
              Update your voice story details
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <input
                type="text"
                className="w-full mt-1 px-3 py-2 bg-background border rounded-md"
                defaultValue={selectedStory?.title || ''}
                id="story-title"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="story-public"
                defaultChecked={selectedStory?.is_public}
                className="h-4 w-4"
              />
              <label htmlFor="story-public" className="text-sm">Make public</label>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedStory) {
                  const title = (document.getElementById('story-title') as HTMLInputElement)?.value;
                  const isPublic = (document.getElementById('story-public') as HTMLInputElement)?.checked;
                  updateVoiceStory(selectedStory.id, { title, is_public: isPublic });
                }
              }}
            >
              Save Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Schedule Voice Story Dialog */}
      <AlertDialog open={showScheduleStoryDialog} onOpenChange={setShowScheduleStoryDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Schedule Voice Story</AlertDialogTitle>
            <AlertDialogDescription>
              Choose when to publish this voice story
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium">Schedule for</label>
            <input
              type="datetime-local"
              className="w-full mt-1 px-3 py-2 bg-background border rounded-md"
              id="schedule-datetime"
              min={new Date().toISOString().slice(0, 16)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedStory) {
                  const datetime = (document.getElementById('schedule-datetime') as HTMLInputElement)?.value;
                  if (datetime) {
                    scheduleVoiceStory(selectedStory.id, new Date(datetime));
                  } else {
                    sonnerToast.error('Please select a date and time');
                  }
                }
              }}
            >
              Schedule Story
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AudioFeed;
