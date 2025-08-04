import React, { useState, useRef } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Pause, Volume2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MusicSelectorProps {
  currentUrl: string;
  currentTitle: string;
  onMusicChange: (url: string, title: string) => void;
}

const MusicSelector: React.FC<MusicSelectorProps> = ({ 
  currentUrl, 
  currentTitle, 
  onMusicChange 
}) => {
  const [url, setUrl] = useState(currentUrl);
  const [title, setTitle] = useState(currentTitle);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handlePreview = async () => {
    if (!url) {
      toast({
        title: "Error",
        description: "Please enter a music URL first",
        variant: "destructive",
      });
      return;
    }

    if (!isValidUrl(url)) {
      toast({
        title: "Error",
        description: "Please enter a valid URL",
        variant: "destructive",
      });
      return;
    }

    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      return;
    }

    setIsLoading(true);

    if (audioRef.current) {
      audioRef.current.src = url;
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (error) {
        toast({
          title: "Preview unavailable",
          description: "Cannot preview this URL, but it will be saved. Some streaming services don't allow preview.",
          variant: "default",
        });
      }
    }
    setIsLoading(false);
  };

  const handleSave = () => {
    if (url && !isValidUrl(url)) {
      toast({
        title: "Error",
        description: "Please enter a valid URL",
        variant: "destructive",
      });
      return;
    }
    
    onMusicChange(url, title);
    toast({
      title: "Success",
      description: "Music settings saved!",
    });
  };

  const popularMusicSites = [
    { name: 'SoundCloud', example: 'https://soundcloud.com/...' },
    { name: 'YouTube Music', example: 'https://music.youtube.com/...' },
    { name: 'Spotify (Web Player)', example: 'https://open.spotify.com/...' },
    { name: 'Apple Music', example: 'https://music.apple.com/...' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Background Music</CardTitle>
        <CardDescription>
          Add background music that plays when visitors view your profile
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <audio
          ref={audioRef}
          onEnded={() => setIsPlaying(false)}
          onPause={() => setIsPlaying(false)}
        />

        <div className="space-y-2">
          <Label htmlFor="music-title">Music Title</Label>
          <Input
            id="music-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Song title (optional)"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="music-url">Music URL</Label>
          <div className="flex gap-2">
            <Input
              id="music-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/music.mp3"
              className="flex-1"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handlePreview}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
              ) : isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="bg-muted/50 p-3 rounded-lg space-y-2">
          <div className="flex items-center gap-2">
            <Volume2 className="h-4 w-4" />
            <span className="text-sm font-medium">Music Tips</span>
          </div>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Use direct links to audio files (.mp3, .wav, .ogg)</li>
            <li>• Ensure the URL is publicly accessible</li>
            <li>• Music will loop and play at low volume</li>
            <li>• Visitors can control playback</li>
          </ul>
        </div>

        <div className="space-y-2">
          <Label>Popular Music Platforms</Label>
          <div className="grid grid-cols-1 gap-2 text-sm">
            {popularMusicSites.map((site) => (
              <div key={site.name} className="flex justify-between text-muted-foreground">
                <span>{site.name}:</span>
                <span className="text-xs">{site.example}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSave} className="flex-1">
            Save Music Settings
          </Button>
          {url && (
            <Button 
              variant="outline" 
              onClick={() => {
                setUrl('');
                setTitle('');
                onMusicChange('', '');
              }}
            >
              Remove Music
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MusicSelector;