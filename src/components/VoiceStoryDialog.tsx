import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Mic, Square, Upload, Play, Pause, RotateCcw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import AudioWaveform from './AudioWaveform';

interface VoiceStoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStoryCreated: () => void;
}

const VoiceStoryDialog = ({ open, onOpenChange, onStoryCreated }: VoiceStoryDialogProps) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Create audio URL when blob changes
  useEffect(() => {
    if (audioBlob) {
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
      
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [audioBlob]);

  // Setup audio element
  useEffect(() => {
    if (audioUrl && !audioRef.current) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => setIsPlaying(false);
      audioRef.current.onerror = () => {
        toast.error('Failed to load audio preview');
        setIsPlaying(false);
      };
    }
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.success('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Failed to start recording. Please check microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast.success('Recording stopped');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioBlob(file);
      toast.success('Audio file selected - Preview it before posting!');
    }
  };

  const togglePlayPause = async () => {
    if (!audioRef.current) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      toast.error('Failed to play audio preview');
    }
  };

  const handleClearAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setIsPlaying(false);
  };

  const handleCreateStory = async () => {
    if (!audioBlob) {
      toast.error('Please record or upload an audio file');
      return;
    }

    if (!user) {
      toast.error('You must be logged in to create a voice story');
      return;
    }

    setLoading(true);
    try {
      // Upload audio to storage
      const fileName = `${user.id}/${Date.now()}.webm`;
      const { error: uploadError } = await supabase.storage
        .from('music')
        .upload(fileName, audioBlob);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('music')
        .getPublicUrl(fileName);

      // Calculate duration (approximate)
      const duration = Math.floor(audioBlob.size / 16000); // Rough estimate

      // Create voice memo record
      const { error: insertError } = await supabase
        .from('voice_memos')
        .insert({
          user_id: user.id,
          title: title.trim() || 'Untitled Story',
          audio_url: publicUrl,
          duration,
          is_public: isPublic,
        });

      if (insertError) throw insertError;

      toast.success('Voice story created successfully!');
      
      // Reset form
      setTitle('');
      handleClearAudio();
      setIsPublic(true);
      onOpenChange(false);
      onStoryCreated();
    } catch (error: any) {
      console.error('Error creating voice story:', error);
      toast.error(error.message || 'Failed to create voice story');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Voice Story</DialogTitle>
          <DialogDescription>
            Record or upload an audio story to share with others
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Story Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your story a title..."
              maxLength={100}
            />
          </div>

          <div className="space-y-3">
            <Label>Audio</Label>
            
            {!audioBlob ? (
              <div className="space-y-2">
                <Button
                  type="button"
                  variant={isRecording ? 'destructive' : 'default'}
                  className="w-full gap-2"
                  onClick={isRecording ? stopRecording : startRecording}
                >
                  {isRecording ? (
                    <>
                      <Square className="h-4 w-4" />
                      Stop Recording
                    </>
                  ) : (
                    <>
                      <Mic className="h-4 w-4" />
                      Start Recording
                    </>
                  )}
                </Button>

                <div className="relative">
                  <Input
                    type="file"
                    accept="audio/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="audio-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => document.getElementById('audio-upload')?.click()}
                  >
                    <Upload className="h-4 w-4" />
                    Upload Audio File
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-4 bg-muted rounded-lg border-2 border-primary/20">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-medium">Recording Ready</p>
                      <p className="text-xs text-muted-foreground">
                        Size: {(audioBlob.size / 1024).toFixed(0)} KB
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="gap-2"
                      onClick={handleClearAudio}
                    >
                      <RotateCcw className="h-3 w-3" />
                      Re-record
                    </Button>
                  </div>
                  
                  {/* Audio Preview Player */}
                  <div className="flex items-center gap-3 p-3 bg-background rounded-md">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="h-10 w-10 rounded-full p-0 flex-shrink-0"
                      onClick={togglePlayPause}
                    >
                      {isPlaying ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4 ml-0.5" />
                      )}
                    </Button>
                    <div className="flex-1">
                      <AudioWaveform isPlaying={isPlaying} />
                    </div>
                  </div>
                  
                  <p className="text-xs text-center text-muted-foreground mt-2">
                    👆 Preview your recording before posting
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="public"
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
            <Label htmlFor="public">Make this story public</Label>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreateStory} 
            disabled={!audioBlob || loading}
          >
            {loading ? 'Creating...' : 'Create Story'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VoiceStoryDialog;
