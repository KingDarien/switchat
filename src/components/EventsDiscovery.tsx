import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar, MapPin, Users, Clock, Plus, Search, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import UserDisplayName from '@/components/UserDisplayName';

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  location_name: string | null;
  address: string | null;
  start_date: string;
  end_date: string | null;
  max_attendees: number | null;
  is_free: boolean;
  price: number | null;
  image_url: string | null;
  tags: string[] | null;
  creator_id: string;
  created_at: string;
  profiles?: {
    display_name: string | null;
    avatar_url: string | null;
    username: string;
    is_verified: boolean;
    verification_tier: string;
  } | null;
  attendee_count?: number;
  user_status?: 'going' | 'interested' | null;
}

const EventsDiscovery = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');

  useEffect(() => {
    fetchEvents();
  }, [user]);

  const fetchEvents = async () => {
    try {
      let query = supabase
        .from('events')
        .select(`
          *,
          profiles!events_creator_id_fkey (display_name, avatar_url, username, is_verified, verification_tier)
        `)
        .eq('is_published', true)
        .gte('start_date', new Date().toISOString())
        .order('start_date', { ascending: true });

      const { data: eventsData, error } = await query;
      if (error) throw error;

      // Get attendee counts and user status for each event
      const eventsWithDetails = await Promise.all(
        (eventsData || []).map(async (event) => {
          // Get attendee count
          const { count } = await supabase
            .from('event_attendees')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', event.id)
            .eq('status', 'going');

          // Get user's attendance status
          let userStatus = null;
          if (user) {
            const { data: attendance } = await supabase
              .from('event_attendees')
              .select('status')
              .eq('event_id', event.id)
              .eq('user_id', user.id)
              .single();
            
            userStatus = attendance?.status || null;
          }

          return {
            ...event,
            attendee_count: count || 0,
            user_status: userStatus as 'going' | 'interested' | null,
            profiles: Array.isArray(event.profiles) ? event.profiles[0] : event.profiles
          } as Event;
        })
      );

      setEvents(eventsWithDetails);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast({
        title: "Error",
        description: "Failed to load events",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleEventAttendance = async (eventId: string, currentStatus: string | null) => {
    if (!user) return;

    try {
      if (currentStatus === 'going') {
        // Remove attendance
        const { error } = await supabase
          .from('event_attendees')
          .delete()
          .eq('event_id', eventId)
          .eq('user_id', user.id);
        
        if (error) throw error;
        
        toast({
          title: "Attendance Removed",
          description: "You're no longer attending this event."
        });
      } else {
        // Add or update attendance
        const { error } = await supabase
          .from('event_attendees')
          .upsert({
            event_id: eventId,
            user_id: user.id,
            status: 'going'
          });
        
        if (error) throw error;
        
        toast({
          title: "Attendance Confirmed",
          description: "You're now attending this event!"
        });
      }

      fetchEvents(); // Refresh to get updated counts
    } catch (error) {
      console.error('Error updating attendance:', error);
      toast({
        title: "Error",
        description: "Failed to update attendance",
        variant: "destructive"
      });
    }
  };

  const getEventTypeColor = (type: string) => {
    const colors = {
      networking: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      workshop: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      conference: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      social: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
      business: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.location_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = selectedType === 'all' || event.event_type === selectedType;
    
    return matchesSearch && matchesType;
  });

  const eventTypes = ['all', 'networking', 'workshop', 'conference', 'social', 'business'];

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse border rounded-lg p-4">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-full mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Upcoming Events
        </CardTitle>
        
        {/* Search and Filter Controls */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2 flex-wrap">
            {eventTypes.map((type) => (
              <Button
                key={type}
                variant={selectedType === type ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedType(type)}
                className="capitalize"
              >
                {type === 'all' ? 'All Events' : type}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {filteredEvents.map((event) => {
            const startDateTime = formatDateTime(event.start_date);
            
            return (
              <div key={event.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">{event.title}</h3>
                      <Badge className={getEventTypeColor(event.event_type)}>
                        {event.event_type}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {event.description}
                    </p>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{startDateTime.date} at {startDateTime.time}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{event.location_name}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {event.attendee_count} attending
                          {event.max_attendees && ` / ${event.max_attendees} max`}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mt-3">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={event.profiles?.avatar_url} />
                        <AvatarFallback className="text-xs">
                          {getInitials(event.profiles?.display_name || '')}
                        </AvatarFallback>
                      </Avatar>
                      <UserDisplayName
                        displayName={event.profiles?.display_name || 'Anonymous'}
                        username="creator"
                        userId={event.creator_id}
                        variant="compact"
                        size="sm"
                        showRank={false}
                        showVerification={true}
                      />
                      <div className="flex-1"></div>
                      {!event.is_free && (
                        <Badge variant="outline">
                          ${event.price}
                        </Badge>
                      )}
                      {event.is_free && (
                        <Badge variant="secondary">Free</Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    {event.tags?.slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  
                  {user && (
                    <Button
                      variant={event.user_status === 'going' ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleEventAttendance(event.id, event.user_status)}
                    >
                      {event.user_status === 'going' ? 'Going' : 'Attend'}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}

          {filteredEvents.length === 0 && (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">
                {searchQuery || selectedType !== 'all' ? 'No events found' : 'No upcoming events'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery || selectedType !== 'all' 
                  ? 'Try adjusting your search or filters' 
                  : 'Check back later for new events in your area!'
                }
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EventsDiscovery;