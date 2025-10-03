import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';

interface CreateRoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRoomCreated: () => void;
}

const CreateRoomDialog = ({ open, onOpenChange, onRoomCreated }: CreateRoomDialogProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [topic, setTopic] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [maxParticipants, setMaxParticipants] = useState(50);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleCreateRoom = async () => {
    if (!title.trim()) {
      toast.error('Room title is required');
      return;
    }

    if (!user) {
      toast.error('You must be logged in to create a room');
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      toast.error('Session expired — please sign in and try again.');
      return;
    }

    setLoading(true);
    try {
      const { data: newRoom, error } = await supabase
        .from('audio_rooms')
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          topic: topic.trim() || null,
          is_private: isPrivate,
          max_participants: maxParticipants,
        } as any)
        .select()
        .single();

      if (error) {
        console.error('Error creating room:', error);
        toast.error(error.message || 'Failed to create room. Please try again.');
        return;
      }

      // Add creator as speaker participant immediately
      if (newRoom) {
        const { error: participantError } = await supabase
          .from('room_participants')
          .insert({
            room_id: newRoom.id,
            user_id: user.id,
            role: 'speaker'
          });

        if (participantError) {
          console.error('Error adding creator as speaker:', participantError);
        }
      }

      toast.success('Audio room created successfully!');
      setTitle('');
      setDescription('');
      setTopic('');
      setIsPrivate(false);
      setMaxParticipants(50);
      onOpenChange(false);
      onRoomCreated();
    } catch (error: any) {
      console.error('Error creating room:', error);
      toast.error('Failed to create room. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">🎙️ Start Your Live Room</DialogTitle>
          <DialogDescription>
            Create a Clubhouse-style audio room where people can join and have live conversations.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Room Privacy - Most Important Feature */}
          <div className="p-4 rounded-lg border-2 border-primary/20 bg-primary/5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="private" className="text-base font-semibold flex items-center gap-2">
                  {isPrivate ? '🔒 Private Room' : '🌍 Public Room'}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {isPrivate 
                    ? 'Only invited users can join this room' 
                    : 'Anyone can discover and join this room'}
                </p>
              </div>
              <Switch
                id="private"
                checked={isPrivate}
                onCheckedChange={setIsPrivate}
                className="data-[state=checked]:bg-primary"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="title" className="text-base">Room Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's your room about?"
              maxLength={100}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What will you talk about?"
              maxLength={500}
              rows={3}
              className="mt-1.5"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="topic">Topic</Label>
              <Input
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Tech, Music..."
                maxLength={50}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="maxParticipants">Max People</Label>
              <Input
                id="maxParticipants"
                type="number"
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(parseInt(e.target.value) || 50)}
                min={2}
                max={500}
                className="mt-1.5"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreateRoom} 
            disabled={!title.trim() || loading}
            className="gap-2 bg-gradient-to-r from-primary to-accent hover:shadow-lg"
          >
            <Plus className="h-4 w-4" />
            {loading ? 'Creating...' : `Go Live ${isPrivate ? '🔒' : '🌍'}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateRoomDialog;