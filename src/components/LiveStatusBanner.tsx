import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Cloud, Calendar, Gift, X, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface BannerItem {
  id: string;
  type: 'weather' | 'event' | 'birthday';
  content: string;
  icon: React.ReactNode;
}

interface UserPreferences {
  show_weather_banner: boolean;
  show_events_banner: boolean;
  show_birthday_banner: boolean;
}

const LiveStatusBanner: React.FC = () => {
  const [bannerItems, setBannerItems] = useState<BannerItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [preferences, setPreferences] = useState<UserPreferences>({
    show_weather_banner: true,
    show_events_banner: true,
    show_birthday_banner: true
  });
  const [showSettings, setShowSettings] = useState(false);

  const fetchBannerData = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      // Fetch user preferences
      const { data: prefs } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.user.id)
        .single();

      if (prefs) {
        setPreferences({
          show_weather_banner: prefs.show_weather_banner,
          show_events_banner: prefs.show_events_banner,
          show_birthday_banner: prefs.show_birthday_banner
        });
      }

      const items: BannerItem[] = [];

      // Weather data (mock for now - would integrate with weather API)
      if (preferences.show_weather_banner) {
        items.push({
          id: 'weather-1',
          type: 'weather',
          content: 'Current temperature: 72°F - Partly cloudy in your area',
          icon: <Cloud className="h-4 w-4" />
        });
      }

      // Upcoming events
      if (preferences.show_events_banner) {
        const { data: events } = await supabase
          .from('events')
          .select('title, start_date')
          .gte('start_date', new Date().toISOString())
          .lte('start_date', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString())
          .order('start_date', { ascending: true })
          .limit(3);

        events?.forEach(event => {
          const date = new Date(event.start_date).toLocaleDateString();
          items.push({
            id: `event-${event.title}`,
            type: 'event',
            content: `Upcoming: ${event.title} on ${date}`,
            icon: <Calendar className="h-4 w-4" />
          });
        });
      }

      // Birthdays (mock data - would be real user birthdays)
      if (preferences.show_birthday_banner) {
        const today = new Date();
        const todayMonth = today.getMonth() + 1;
        const todayDay = today.getDate();
        
        // This would query actual user birthdays from profiles
        items.push({
          id: 'birthday-sample',
          type: 'birthday',
          content: 'Today is Sarah M. and Mike T.\'s birthday! 🎉',
          icon: <Gift className="h-4 w-4" />
        });
      }

      setBannerItems(items);
    } catch (error) {
      console.error('Error fetching banner data:', error);
    }
  };

  const togglePreference = async (key: keyof UserPreferences) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const newPrefs = { ...preferences, [key]: !preferences[key] };
      setPreferences(newPrefs);

      await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.user.id,
          ...newPrefs
        });

      fetchBannerData();
    } catch (error) {
      console.error('Error updating preferences:', error);
    }
  };

  useEffect(() => {
    fetchBannerData();
    
    // Auto-scroll through banner items
    const interval = setInterval(() => {
      if (bannerItems.length > 1) {
        setCurrentIndex((prev) => (prev + 1) % bannerItems.length);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [bannerItems.length, preferences]);

  if (!isVisible || bannerItems.length === 0) {
    return null;
  }

  const currentItem = bannerItems[currentIndex];

  return (
    <div className="relative">
      <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {currentItem?.icon}
            <span className="text-sm text-foreground truncate">
              {currentItem?.content}
            </span>
          </div>
          
          <div className="flex items-center gap-1">
            {bannerItems.length > 1 && (
              <div className="flex gap-1">
                {bannerItems.map((_, index) => (
                  <div
                    key={index}
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${
                      index === currentIndex ? 'bg-primary' : 'bg-primary/30'
                    }`}
                  />
                ))}
              </div>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              className="h-6 w-6 p-0"
            >
              <Settings className="h-3 w-3" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        {showSettings && (
          <div className="border-t border-primary/20 p-3 space-y-2">
            <div className="text-xs font-medium text-muted-foreground mb-2">Banner Settings</div>
            
            <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-accent/30 p-1 rounded">
              <input
                type="checkbox"
                checked={preferences.show_weather_banner}
                onChange={() => togglePreference('show_weather_banner')}
                className="h-4 w-4 rounded border border-input bg-background accent-primary"
              />
              Show weather updates
            </label>
            
            <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-accent/30 p-1 rounded">
              <input
                type="checkbox"
                checked={preferences.show_events_banner}
                onChange={() => togglePreference('show_events_banner')}
                className="h-4 w-4 rounded border border-input bg-background accent-primary"
              />
              Show upcoming events
            </label>
            
            <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-accent/30 p-1 rounded">
              <input
                type="checkbox"
                checked={preferences.show_birthday_banner}
                onChange={() => togglePreference('show_birthday_banner')}
                className="h-4 w-4 rounded border border-input bg-background accent-primary"
              />
              Show birthday notifications
            </label>
          </div>
        )}
      </Card>
    </div>
  );
};

export default LiveStatusBanner;