import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Camera, Briefcase, MapPin, Globe } from 'lucide-react';
import Navbar from '@/components/Navbar';
import UserGoals from '@/components/UserGoals';
import VerificationRequest from '@/components/VerificationRequest';

interface Profile {
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  niche_id: string;
  location: string;
  website_url: string;
  social_links: Record<string, string>;
}

interface Niche {
  id: string;
  name: string;
  description: string;
  icon: string;
}

const Profile = () => {
  const [profile, setProfile] = useState<Profile>({
    username: '',
    display_name: '',
    bio: '',
    avatar_url: '',
    niche_id: '',
    location: '',
    website_url: '',
    social_links: {},
  });
  const [niches, setNiches] = useState<Niche[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchNiches();
    }
  }, [user]);

  const fetchNiches = async () => {
    try {
      const { data } = await supabase.from('niches').select('*').order('name');
      setNiches(data || []);
    } catch (error) {
      console.error('Error fetching niches:', error);
    }
  };

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user!.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setProfile({
          username: data.username || '',
          display_name: data.display_name || '',
          bio: data.bio || '',
          avatar_url: data.avatar_url || '',
          niche_id: data.niche_id || '',
          location: data.location || '',
          website_url: data.website_url || '',
          social_links: (data.social_links as Record<string, string>) || {},
        });
      }
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

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user!.id,
          username: profile.username,
          display_name: profile.display_name,
          bio: profile.bio,
          avatar_url: profile.avatar_url,
          niche_id: profile.niche_id || null,
          location: profile.location,
          website_url: profile.website_url,
          social_links: profile.social_links,
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Success!",
        description: "Your profile has been updated.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof Profile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please select a valid image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error", 
        description: "Image must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user!.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('posts')
        .upload(`avatars/${fileName}`, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('posts')
        .getPublicUrl(`avatars/${fileName}`);

      // Update profile state with new avatar URL
      const newAvatarUrl = `${data.publicUrl}?t=${Date.now()}`;
      setProfile(prev => ({ ...prev, avatar_url: newAvatarUrl }));

      // Immediately save to database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: newAvatarUrl })
        .eq('user_id', user!.id);

      if (updateError) throw updateError;

      toast({
        title: "Success!",
        description: "Profile photo uploaded successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return user?.email?.charAt(0).toUpperCase() || 'U';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-2xl mx-auto p-4">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-2xl mx-auto p-4 pb-20 space-y-6">
        <h1 className="text-3xl font-bold">Profile Settings</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Update your profile information and let others know more about you.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6">
              <div className="relative">
                <input
                  type="file"
                  id="avatar-upload"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
                <label htmlFor="avatar-upload" className="cursor-pointer">
                  <Avatar className="h-20 w-20 hover:opacity-75 transition-opacity">
                    <AvatarImage src={profile.avatar_url} />
                    <AvatarFallback className="text-lg">
                      {getInitials(profile.display_name)}
                    </AvatarFallback>
                  </Avatar>
                </label>
                <Button
                  size="icon"
                  variant="outline"
                  className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full"
                  disabled={uploading}
                  onClick={() => document.getElementById('avatar-upload')?.click()}
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">
                  {uploading ? 'Uploading...' : 'Click to upload profile photo'}
                </p>
              </div>
            </div>
            
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="@username"
                  value={profile.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="display-name">Display Name</Label>
                <Input
                  id="display-name"
                  placeholder="Your display name"
                  value={profile.display_name}
                  onChange={(e) => handleInputChange('display_name', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us about yourself..."
                  value={profile.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="niche">Your Niche</Label>
                <Select value={profile.niche_id} onValueChange={(value) => handleInputChange('niche_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your niche" />
                  </SelectTrigger>
                  <SelectContent>
                    {niches.map((niche) => (
                      <SelectItem key={niche.id} value={niche.id}>
                        <span className="flex items-center gap-2">
                          <span>{niche.icon}</span>
                          {niche.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="City, Country"
                    value={profile.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    placeholder="https://yourwebsite.com"
                    value={profile.website_url}
                    onChange={(e) => handleInputChange('website_url', e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? 'Saving...' : 'Save Profile'}
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Email</Label>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </CardContent>
        </Card>

        {/* Verification Request */}
        <VerificationRequest />

        {/* Goals Section */}
        <Card>
          <CardHeader>
            <CardTitle>My Goals</CardTitle>
          </CardHeader>
          <CardContent>
            <UserGoals />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
