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

    setLoading(true);
    try {
      const { data, error } = await supabase
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Audio Room</DialogTitle>
          <DialogDescription>
            Start a live audio conversation for people to join and participate in.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Room Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter room title..."
              maxLength={100}
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this room is about..."
              maxLength={500}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="topic">Topic/Category</Label>
            <Input
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Business, Technology, Music..."
              maxLength={50}
            />
          </div>

          <div>
            <Label htmlFor="maxParticipants">Max Participants</Label>
            <Input
              id="maxParticipants"
              type="number"
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(parseInt(e.target.value) || 50)}
              min={2}
              max={500}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="private"
              checked={isPrivate}
              onCheckedChange={setIsPrivate}
            />
            <Label htmlFor="private">Private Room</Label>
          </div>
          {isPrivate && (
            <p className="text-sm text-muted-foreground">
              Only invited users will be able to join this room
            </p>
          )}
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreateRoom} 
            disabled={!title.trim() || loading}
          >
            {loading ? 'Creating...' : 'Create Room'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateRoomDialog;