import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Image, X, Video, Play } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface CreatePostProps {
  onPostCreated?: () => void;
}

const CreatePost = ({ onPostCreated }: CreatePostProps) => {
  const [content, setContent] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [video, setVideo] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [postType, setPostType] = useState<'text' | 'image' | 'video'>('text');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check if user is DarienAdair for unlimited uploads
      const isDarienAdair = user?.id === '00000000-0000-0000-0000-000000000000';
      
      // Check image size (max 50MB for regular users, unlimited for DarienAdair)
      if (!isDarienAdair && file.size > 50 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "Image file must be less than 50MB",
          variant: "destructive",
        });
        return;
      }
      
      setImage(file);
      setVideo(null);
      setVideoPreview(null);
      setPostType('image');
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check if user is DarienAdair for unlimited uploads
      const isDarienAdair = user?.id === '00000000-0000-0000-0000-000000000000';
      
      // Check video size (max 50MB for regular users, unlimited for DarienAdair)
      if (!isDarienAdair && file.size > 50 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "Video file must be less than 50MB",
          variant: "destructive",
        });
        return;
      }
      
      setVideo(file);
      setImage(null);
      setImagePreview(null);
      setPostType('video');
      const reader = new FileReader();
      reader.onload = () => setVideoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
    setPostType('text');
  };

  const removeVideo = () => {
    setVideo(null);
    setVideoPreview(null);
    setPostType('text');
  };

  const uploadFile = async (file: File, bucket: string): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${user!.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, file);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return null;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
    return data.publicUrl;
  };

  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(Math.round(video.duration));
      };
      video.src = URL.createObjectURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);

    try {
      let imageUrl = null;
      let videoUrl = null;
      let duration = null;

      if (image) {
        imageUrl = await uploadFile(image, 'posts');
        if (!imageUrl) {
          toast({
            title: "Error",
            description: "Failed to upload image",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
      }

      if (video) {
        videoUrl = await uploadFile(video, 'videos');
        duration = await getVideoDuration(video);
        if (!videoUrl) {
          toast({
            title: "Error",
            description: "Failed to upload video",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
      }

      const { error } = await supabase
        .from('posts')
        .insert({
          content: content.trim(),
          image_url: imageUrl,
          video_url: videoUrl,
          duration: duration,
          post_type: postType,
          user_id: user!.id,
        });

      if (error) {
        throw error;
      }

      setContent('');
      setImage(null);
      setVideo(null);
      setImagePreview(null);
      setVideoPreview(null);
      setPostType('text');
      onPostCreated?.();
      
      toast({
        title: "Success!",
        description: `Your ${postType} post has been created.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create a Post</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Textarea
              placeholder="What's on your mind?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          
          {imagePreview && (
            <div className="relative">
              <img
                src={imagePreview}
                alt="Preview"
                className="max-h-64 rounded-lg object-cover"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={removeImage}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {videoPreview && (
            <div className="relative">
              <video
                src={videoPreview}
                controls
                className="max-h-64 rounded-lg object-cover w-full"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={removeVideo}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Label htmlFor="image-upload" className="cursor-pointer">
                <div className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                  <Image className="h-5 w-5" />
                  <span>Add Image</span>
                </div>
              </Label>
              <Input
                id="image-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageSelect}
              />

              <Label htmlFor="video-upload" className="cursor-pointer">
                <div className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                  <Video className="h-5 w-5" />
                  <span>Add Video</span>
                </div>
              </Label>
              <Input
                id="video-upload"
                type="file"
                accept="video/*"
                className="hidden"
                onChange={handleVideoSelect}
              />
            </div>
            
            <Button type="submit" disabled={loading || !content.trim()}>
              {loading ? 'Posting...' : 'Post'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreatePost;