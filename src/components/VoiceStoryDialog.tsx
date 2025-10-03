import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Mic, Square, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

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
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

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
      toast.success('Audio file selected');
    }
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
      setAudioBlob(null);
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
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm text-muted-foreground mb-2">
                  ✓ Audio ready ({(audioBlob.size / 1024).toFixed(0)} KB)
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setAudioBlob(null)}
                >
                  Clear & Record Again
                </Button>
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
