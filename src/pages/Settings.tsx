import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Camera, Save, Shield } from 'lucide-react';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';
import ThemeSelector from '@/components/ThemeSelector';
import MusicSelector from '@/components/MusicSelector';
import LocationPicker from '@/components/LocationPicker';

interface Profile {
  user_id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  interests: string[];
  user_role: string;
  is_verified: boolean;
  verification_tier: string;
  background_theme: any;
  background_music_url: string;
  background_music_title: string;
}

interface PrivateData {
  website_url: string;
  location: string;
  birthday: string;
  ethnicity: string;
  social_links: Record<string, string>;
}

const Settings = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [privateData, setPrivateData] = useState<PrivateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      // Fetch public profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch private data
      const { data: privateDataResult, error: privateError } = await supabase
        .from('profile_private_data')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (privateError && privateError.code !== 'PGRST116') {
        console.error('Error fetching private data:', privateError);
      } else if (privateDataResult) {
        setPrivateData({
          website_url: privateDataResult.website_url || '',
          location: privateDataResult.location || '',
          birthday: privateDataResult.birthday || '',
          ethnicity: privateDataResult.ethnicity || '',
          social_links: (privateDataResult.social_links as Record<string, string>) || {},
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async () => {
    if (!profile || !user) return;

    setSaving(true);
    try {
      // Update public profile data
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          display_name: profile.display_name,
          bio: profile.bio,
          interests: profile.interests,
          background_theme: profile.background_theme,
          background_music_url: profile.background_music_url,
          background_music_title: profile.background_music_title,
        })
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      // Update private data
      if (privateData) {
        const { error: privateError } = await supabase
          .from('profile_private_data')
          .upsert({
            user_id: user.id,
            website_url: privateData.website_url,
            location: privateData.location,
            birthday: privateData.birthday,
            ethnicity: privateData.ethnicity,
            social_links: privateData.social_links,
          });

        if (privateError) throw privateError;
      }

      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('posts')
        .upload(`avatars/${fileName}`, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('posts')
        .getPublicUrl(`avatars/${fileName}`);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: data.publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setProfile(prev => prev ? { ...prev, avatar_url: data.publicUrl } : null);
      toast.success('Avatar updated successfully!');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload avatar');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-4xl mx-auto p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-96 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-4xl mx-auto p-6">
          <p>Profile not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Profile Settings</h1>
          <Button onClick={updateProfile} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={profile.avatar_url} />
                    <AvatarFallback>
                      {profile.display_name?.charAt(0) || profile.username?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 p-1 bg-primary rounded-full cursor-pointer">
                    <Camera className="h-3 w-3 text-primary-foreground" />
                  </label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">@{profile.username}</span>
                    {profile.is_verified && (
                      <Badge variant="secondary" className="flex items-center">
                        <Shield className="h-3 w-3 mr-1" />
                        {profile.verification_tier}
                      </Badge>
                    )}
                  </div>
                  <Badge variant="outline">{profile.user_role}</Badge>
                </div>
              </div>

              <div>
                <Label htmlFor="display_name">Display Name</Label>
                <Input
                  id="display_name"
                  value={profile.display_name || ''}
                  onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={profile.bio || ''}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={privateData?.website_url || ''}
                  onChange={(e) => setPrivateData({ ...privateData!, website_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Personal Details */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={privateData?.location || ''}
                  onChange={(e) => setPrivateData({ ...privateData!, location: e.target.value })}
                  placeholder="Enter your location..."
                />
              </div>

              <div>
                <Label htmlFor="birthday">Birthday</Label>
                <Input
                  id="birthday"
                  type="date"
                  value={privateData?.birthday || ''}
                  onChange={(e) => setPrivateData({ ...privateData!, birthday: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="ethnicity">Ethnicity</Label>
                <Input
                  id="ethnicity"
                  value={privateData?.ethnicity || ''}
                  onChange={(e) => setPrivateData({ ...privateData!, ethnicity: e.target.value })}
                />
              </div>

              <div>
                <Label>Interests</Label>
                <Input
                  value={profile.interests?.join(', ') || ''}
                  onChange={(e) => setProfile({ 
                    ...profile, 
                    interests: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  })}
                  placeholder="Music, Sports, Technology..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Appearance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ThemeSelector 
                currentTheme={profile.background_theme}
                onThemeChange={(theme) => setProfile({ ...profile, background_theme: theme })}
              />
            </CardContent>
          </Card>

          {/* Background Music */}
          <Card>
            <CardHeader>
              <CardTitle>Background Music</CardTitle>
            </CardHeader>
            <CardContent>
              <MusicSelector 
                currentUrl={profile.background_music_url || ''}
                currentTitle={profile.background_music_title || ''}
                onMusicChange={(url, title) => setProfile({
                  ...profile,
                  background_music_url: url,
                  background_music_title: title
                })}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;