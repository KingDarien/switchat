import { useRef, useState, useCallback } from "react";
import { Room, RoomEvent, RemoteParticipant } from "livekit-client";

/**
 * Lightweight LiveKit client hook for joining/leaving and enabling audio playback.
 * - Call connect(wsUrl, token, publishMic=false) to join a room
 * - Call startAudio() if the browser blocks autoplay (shows Enable Audio button)
 * - Call leave() to disconnect
 */
export const useLiveKit = () => {
  const roomRef = useRef<Room | null>(null);
  const [connected, setConnected] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [activeSpeakers, setActiveSpeakers] = useState<string[]>([]);

  const connect = useCallback(async (wsUrl: string, token: string, publishMic = false) => {
    // Disconnect any existing room
    if (roomRef.current) {
      await roomRef.current.disconnect();
      roomRef.current = null;
    }

    const room = new Room({
      adaptiveStream: true,
      dynacast: true,
      disconnectOnPageLeave: true,
      // defaults keep it simple; we only handle audio
    });

    room.on(RoomEvent.Connected, () => {
      setConnected(true);
    });

    room.on(RoomEvent.Disconnected, () => {
      setConnected(false);
      setIsSpeaker(false);
      setIsMuted(true);
    });

    // Basic logs for debugging
    room.on(RoomEvent.ParticipantConnected, (p) => console.log("Participant connected:", p.identity));
    room.on(RoomEvent.ParticipantDisconnected, (p) => console.log("Participant disconnected:", p.identity));
    room.on(RoomEvent.TrackSubscribed, (_track, pub, p) => {
      console.log("Subscribed to track:", pub.trackSid, "from", p.identity);
    });

    // Track active speakers
    room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
      const speakerIds = speakers.map(s => s.identity);
      setActiveSpeakers(speakerIds);
    });

    await room.connect(wsUrl, token);

    roomRef.current = room;

    if (publishMic) {
      // This will request mic permission and publish the local mic
      await room.localParticipant.setMicrophoneEnabled(true);
      setIsSpeaker(true);
      setIsMuted(false);
    } else {
      // As a listener, try to start audio; may require user gesture
      try {
        await room.startAudio();
      } catch (e) {
        console.warn("Autoplay blocked; user must click Enable Audio.");
      }
    }
  }, []);

  const startAudio = useCallback(async () => {
    if (!roomRef.current) return;
    await roomRef.current.startAudio();
  }, []);

  const leave = useCallback(async () => {
    if (roomRef.current) {
      await roomRef.current.disconnect();
      roomRef.current = null;
    }
  }, []);

  const setMute = useCallback(async (mute: boolean) => {
    if (!roomRef.current) return;
    await roomRef.current.localParticipant.setMicrophoneEnabled(!mute);
    setIsMuted(mute);
  }, []);

  return {
    connect,
    startAudio,
    leave,
    setMute,
    connected,
    isSpeaker,
    isMuted,
    activeSpeakers,
  };
};
