import React, { useState, useRef } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, Pause, Volume2, Upload, Music } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

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
  const [uploadLoading, setUploadLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Curated royalty-free music library
  const curatedMusic = [
    {
      title: "Peaceful Ambient",
      url: "/music/peaceful-ambient.wav",
      description: "Calm ambient background music"
    },
    {
      title: "Gentle Piano",
      url: "https://commondatastorage.googleapis.com/codeskulptor-assets/Epoq-Lepidoptera.ogg",
      description: "Gentle piano melody"
    },
    {
      title: "Nature Sounds",
      url: "/music/nature-sounds.mp3",
      description: "Relaxing nature ambience"
    },
    {
      title: "Ambient Chill",
      url: "https://commondatastorage.googleapis.com/codeskulptor-assets/Epoq-Lepidoptera.ogg",
      description: "Relaxed ambient background music"
    }
  ];

  const isValidAudioUrl = (url: string): boolean => {
    if (!url) return false;
    try {
      new URL(url);
      // Check for direct audio file extensions
      const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.aac'];
      return audioExtensions.some(ext => url.toLowerCase().includes(ext));
    } catch {
      return false;
    }
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/aac'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload an MP3, WAV, OGG, M4A, or AAC file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    setUploadLoading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('music')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('music')
        .getPublicUrl(data.path);

      setUrl(publicUrl);
      setTitle(file.name.replace(/\.[^/.]+$/, "")); // Remove file extension
      
      toast({
        title: "File uploaded successfully",
        description: "Your music file has been uploaded and is ready to use",
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload music file",
        variant: "destructive",
      });
    } finally {
      setUploadLoading(false);
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
          description: "Cannot preview this URL. Try uploading a direct audio file instead.",
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

  const selectCuratedMusic = (music: typeof curatedMusic[0]) => {
    setUrl(music.url);
    setTitle(music.title);
  };

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

        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload">Upload File</TabsTrigger>
            <TabsTrigger value="library">Music Library</TabsTrigger>
            <TabsTrigger value="url">Custom URL</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
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
              <Label>Upload Audio File</Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadLoading}
                  className="flex-1"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploadLoading ? "Uploading..." : "Choose Audio File"}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handlePreview}
                  disabled={isLoading || !url}
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
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <p className="text-xs text-muted-foreground">
                Supported formats: MP3, WAV, OGG, M4A, AAC (max 10MB)
              </p>
            </div>
          </TabsContent>

          <TabsContent value="library" className="space-y-4">
            <div className="space-y-2">
              <Label>Royalty-Free Music Library</Label>
              <div className="grid gap-2">
                {curatedMusic.map((music, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => selectCuratedMusic(music)}
                  >
                    <div className="flex items-center gap-3">
                      <Music className="h-4 w-4" />
                      <div>
                        <p className="font-medium">{music.title}</p>
                        <p className="text-xs text-muted-foreground">{music.description}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      Select
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="url" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="music-title-url">Music Title</Label>
              <Input
                id="music-title-url"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Song title (optional)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="music-url">Direct Audio File URL</Label>
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
                <span className="text-sm font-medium">Important</span>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Use direct links to audio files (.mp3, .wav, .ogg)</li>
                <li>• Streaming service URLs (Spotify, YouTube) won't work</li>
                <li>• File must be publicly accessible</li>
                <li>• Music will loop and play at low volume</li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>

        {url && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm font-medium">Current Music:</p>
            <p className="text-sm text-muted-foreground">
              {title || "Untitled"} - {isValidAudioUrl(url) ? "✅ Direct audio file" : "⚠️ May not work"}
            </p>
          </div>
        )}

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