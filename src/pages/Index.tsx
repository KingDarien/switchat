import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import Navbar from '@/components/Navbar';
import Feed from '@/components/Feed';
import VideoFeed from '@/components/VideoFeed';
import AudioFeed from '@/components/AudioFeed';
import SwipeContainer from '@/components/SwipeContainer';
import LiveStatusBanner from '@/components/LiveStatusBanner';
import ErrorBoundary from '@/components/ErrorBoundary';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState('feed');

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
        <div>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to auth
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navbar />
      <div className="relative">
        <LiveStatusBanner />
        <ErrorBoundary>
          {isMobile ? (
            // Mobile: Swipe navigation
            <SwipeContainer>
              {[
                // Audio Feed
                <ErrorBoundary key="audio" fallback={
                  <div className="h-screen flex items-center justify-center bg-background">
                    <div className="text-center space-y-2">
                      <div className="text-4xl">🎙️</div>
                      <p className="text-muted-foreground">Audio feed unavailable</p>
                    </div>
                  </div>
                }>
                  <AudioFeed />
                </ErrorBoundary>,
                // Main Feed
                <ErrorBoundary key="main" fallback={
                  <div className="h-screen flex items-center justify-center bg-background">
                    <div className="text-center space-y-2">
                      <div className="text-4xl">📱</div>
                      <p className="text-muted-foreground">Feed unavailable</p>
                    </div>
                  </div>
                }>
                  <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
                    <Feed />
                  </div>
                </ErrorBoundary>,
                // Video Feed
                <ErrorBoundary key="video" fallback={
                  <div className="h-screen flex items-center justify-center bg-background">
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
            // Desktop: Tab navigation
            <div className="w-full min-h-screen">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="sticky top-0 z-20 glass-effect border-b border-border/50 shadow-md">
                  <div className="max-w-7xl mx-auto px-4">
                    <TabsList className="w-full justify-center bg-transparent h-16 p-0 gap-2">
                      <TabsTrigger 
                        value="audio" 
                        className="group relative px-8 py-3 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=inactive]:hover:bg-muted/50 transition-all duration-300 font-semibold text-base"
                      >
                        <span className="text-xl mr-2">🎙️</span> 
                        <span className="relative">
                          Audio Rooms
                          <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-foreground group-data-[state=active]:w-full transition-all duration-300"></span>
                        </span>
                      </TabsTrigger>
                      <TabsTrigger 
                        value="feed" 
                        className="group relative px-8 py-3 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=inactive]:hover:bg-muted/50 transition-all duration-300 font-semibold text-base"
                      >
                        <span className="text-xl mr-2">📱</span> 
                        <span className="relative">
                          Social Feed
                          <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-foreground group-data-[state=active]:w-full transition-all duration-300"></span>
                        </span>
                      </TabsTrigger>
                      <TabsTrigger 
                        value="video" 
                        className="group relative px-8 py-3 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=inactive]:hover:bg-muted/50 transition-all duration-300 font-semibold text-base"
                      >
                        <span className="text-xl mr-2">🎥</span> 
                        <span className="relative">
                          Video Shorts
                          <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-foreground group-data-[state=active]:w-full transition-all duration-300"></span>
                        </span>
                      </TabsTrigger>
                    </TabsList>
                  </div>
                </div>
                
                <TabsContent value="audio" className="mt-0 animate-fade-in">
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
                </TabsContent>

                <TabsContent value="feed" className="mt-0 animate-fade-in">
                  <ErrorBoundary fallback={
                    <div className="h-screen flex items-center justify-center">
                      <div className="text-center space-y-3">
                        <div className="text-6xl">📱</div>
                        <p className="text-xl font-medium text-muted-foreground">Feed unavailable</p>
                      </div>
                    </div>
                  }>
                    <div className="max-w-3xl mx-auto px-4 py-8 pb-24">
                      <Feed />
                    </div>
                  </ErrorBoundary>
                </TabsContent>

                <TabsContent value="video" className="mt-0 animate-fade-in">
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
                </TabsContent>
              </Tabs>
            </div>
          )}
        </ErrorBoundary>
      </div>
    </div>
  );
};

export default Index;
