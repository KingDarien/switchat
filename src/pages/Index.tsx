import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import Navbar from '@/components/Navbar';
import Feed from '@/components/Feed';
import VideoFeed from '@/components/VideoFeed';
import AudioFeed from '@/components/AudioFeed';
import SwipeContainer from '@/components/SwipeContainer';
import LiveStatusBanner from '@/components/LiveStatusBanner';
import ErrorBoundary from '@/components/ErrorBoundary';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Home, User, LogOut, Heart, MessageCircle, Search, Shield, Radio, Video, Globe, Building2, MapPin } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { FeedType } from '@/components/FeedToggle';
import { LocationData } from '@/components/LocationPicker';
import LocationPicker from '@/components/LocationPicker';

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState('feed');
  const [feedType, setFeedType] = useState<FeedType>('social');
  const [selectedLocation, setSelectedLocation] = useState<LocationData>({ type: 'city', name: 'New York', state: 'New York' });

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // SEO: title, meta description, canonical
  useEffect(() => {
    document.title = 'Home Feed: Audio, Posts, Video | Community';
    const desc = 'Experience audio rooms, a social feed, and short videos in one app.';
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', desc);

    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = window.location.origin + '/';
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg font-medium">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to auth
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {isMobile && <Navbar />}
      
      <div className="relative">
        <LiveStatusBanner />
        <ErrorBoundary>
          {isMobile ? (
            // Mobile: Bottom nav with swipe feeds
            <SwipeContainer>
              {[
                <ErrorBoundary key="audio" fallback={
                  <div className="h-screen flex items-center justify-center">
                    <div className="text-center space-y-2">
                      <div className="text-4xl">🎙️</div>
                      <p className="text-muted-foreground">Audio feed unavailable</p>
                    </div>
                  </div>
                }>
                  <AudioFeed />
                </ErrorBoundary>,
                <ErrorBoundary key="main" fallback={
                  <div className="h-screen flex items-center justify-center">
                    <div className="text-center space-y-2">
                      <div className="text-4xl">📱</div>
                      <p className="text-muted-foreground">Feed unavailable</p>
                    </div>
                  </div>
                }>
                  <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
                    <Feed 
                      feedType={feedType}
                      selectedLocation={selectedLocation}
                      onFeedTypeChange={setFeedType}
                      onLocationChange={setSelectedLocation}
                    />
                  </div>
                </ErrorBoundary>,
                <ErrorBoundary key="video" fallback={
                  <div className="h-screen flex items-center justify-center">
                    <div className="text-center space-y-2">
                      <div className="text-4xl">🎥</div>
                      <p className="text-muted-foreground">Video feed unavailable</p>
                    </div>
                  </div>
                }>
                  <VideoFeed />
                </ErrorBoundary>
              ]}
            </SwipeContainer>
          ) : (
            // Desktop: Sidebar + Main content layout
            <TooltipProvider>
              <div className="flex min-h-screen">
                {/* Left Sidebar Navigation - Compact Icon-Only */}
                <aside className="w-24 fixed left-0 top-0 h-screen glass-effect border-r border-border/50 py-6 flex flex-col items-center z-30">
                  <div className="mb-8">
                    <h1 className="text-xl font-bold gradient-text">switchat</h1>
                  </div>

                  <nav className="flex-1 space-y-2 w-full px-3">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => {
                            setActiveTab('feed');
                            setFeedType('social');
                          }}
                          className={`w-full flex items-center justify-center p-4 rounded-xl transition-all duration-300 ${
                            activeTab === 'feed' && feedType === 'social'
                              ? 'bg-primary text-primary-foreground shadow-lg scale-105'
                              : 'hover:bg-muted/50 text-foreground'
                          }`}
                        >
                          <Globe className="h-6 w-6" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>All Posts</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => {
                            setActiveTab('feed');
                            setFeedType('following');
                          }}
                          className={`w-full flex items-center justify-center p-4 rounded-xl transition-all duration-300 ${
                            activeTab === 'feed' && feedType === 'following'
                              ? 'bg-primary text-primary-foreground shadow-lg scale-105'
                              : 'hover:bg-muted/50 text-foreground'
                          }`}
                        >
                          <Building2 className="h-6 w-6" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>Following</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => {
                            setActiveTab('feed');
                            setFeedType('news');
                          }}
                          className={`w-full flex items-center justify-center p-4 rounded-xl transition-all duration-300 ${
                            activeTab === 'feed' && feedType === 'news'
                              ? 'bg-primary text-primary-foreground shadow-lg scale-105'
                              : 'hover:bg-muted/50 text-foreground'
                          }`}
                        >
                          <MapPin className="h-6 w-6" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>Local News</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => setActiveTab('audio')}
                          className={`w-full flex items-center justify-center p-4 rounded-xl transition-all duration-300 ${
                            activeTab === 'audio'
                              ? 'bg-primary text-primary-foreground shadow-lg scale-105'
                              : 'hover:bg-muted/50 text-foreground'
                          }`}
                        >
                          <Radio className="h-6 w-6" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>Audio Rooms</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => setActiveTab('video')}
                          className={`w-full flex items-center justify-center p-4 rounded-xl transition-all duration-300 ${
                            activeTab === 'video'
                              ? 'bg-primary text-primary-foreground shadow-lg scale-105'
                              : 'hover:bg-muted/50 text-foreground'
                          }`}
                        >
                          <Video className="h-6 w-6" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>Video Shorts</p>
                      </TooltipContent>
                    </Tooltip>

                    <div className="pt-4 mt-4 border-t border-border/50 space-y-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link to="/explore">
                            <button className="w-full flex items-center justify-center p-4 rounded-xl hover:bg-muted/50 transition-all duration-300 text-foreground">
                              <Search className="h-6 w-6" />
                            </button>
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <p>Explore</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link to="/notifications">
                            <button className="w-full flex items-center justify-center p-4 rounded-xl hover:bg-muted/50 transition-all duration-300 text-foreground">
                              <Heart className="h-6 w-6" />
                            </button>
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <p>Activity</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link to={`/profile/${user?.id}`}>
                            <button className="w-full flex items-center justify-center p-4 rounded-xl hover:bg-muted/50 transition-all duration-300 text-foreground">
                              <User className="h-6 w-6" />
                            </button>
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <p>Profile</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </nav>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="p-2 rounded-xl hover:bg-muted/50">
                        <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                          <AvatarImage src="" />
                          <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground font-bold">
                            {user.email?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 mb-2 ml-2 glass-effect border-border/50 rounded-2xl shadow-2xl" align="start">
                      <DropdownMenuItem className="font-normal py-3">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium">{user.email}</p>
                          <p className="text-xs text-muted-foreground">Signed in</p>
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/settings" className="w-full cursor-pointer py-2">
                          Settings
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut} className="py-2">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 ml-24">
                  <div className="min-h-screen">
                    {activeTab === 'feed' && (
                      <ErrorBoundary fallback={
                        <div className="h-screen flex items-center justify-center">
                          <div className="text-center space-y-3">
                            <div className="text-6xl">📱</div>
                            <p className="text-xl font-medium text-muted-foreground">Feed unavailable</p>
                          </div>
                        </div>
                      }>
                        <div className="max-w-3xl mx-auto px-6 py-8">
                          <div className="mb-6 flex items-center justify-between">
                            <div>
                              <h2 className="text-3xl font-bold mb-2">
                                {feedType === 'news' ? 'Local News' : feedType === 'following' ? 'Following' : 'Social Feed'}
                              </h2>
                              <p className="text-muted-foreground">
                                {feedType === 'news' 
                                  ? `News from ${selectedLocation.type === 'city' ? `${selectedLocation.name}, ${selectedLocation.state}` : selectedLocation.name}`
                                  : feedType === 'following' 
                                  ? 'Posts from people you follow'
                                  : 'Stay connected with your community'
                                }
                              </p>
                            </div>
                            {feedType === 'news' && (
                              <LocationPicker 
                                selectedLocation={selectedLocation}
                                onLocationChange={setSelectedLocation}
                              />
                            )}
                          </div>
                          <Feed 
                            feedType={feedType}
                            selectedLocation={selectedLocation}
                            onFeedTypeChange={setFeedType}
                            onLocationChange={setSelectedLocation}
                          />
                        </div>
                      </ErrorBoundary>
                    )}

                    {activeTab === 'audio' && (
                      <ErrorBoundary fallback={
                        <div className="h-screen flex items-center justify-center">
                          <div className="text-center space-y-3">
                            <div className="text-6xl">🎙️</div>
                            <p className="text-xl font-medium text-muted-foreground">Audio feed unavailable</p>
                          </div>
                        </div>
                      }>
                        <AudioFeed />
                      </ErrorBoundary>
                    )}

                    {activeTab === 'video' && (
                      <ErrorBoundary fallback={
                        <div className="h-screen flex items-center justify-center">
                          <div className="text-center space-y-3">
                            <div className="text-6xl">🎥</div>
                            <p className="text-xl font-medium text-muted-foreground">Video feed unavailable</p>
                          </div>
                        </div>
                      }>
                        <VideoFeed />
                      </ErrorBoundary>
                    )}
                  </div>
                </main>
              </div>
            </TooltipProvider>
          )}
        </ErrorBoundary>
      </div>
    </div>
  );
};

export default Index;
