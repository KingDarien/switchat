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
    <div className="min-h-screen bg-background">
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
                    <div className="text-center">
                      <p className="text-muted-foreground">Audio feed unavailable</p>
                    </div>
                  </div>
                }>
                  <AudioFeed />
                </ErrorBoundary>,
                // Main Feed
                <ErrorBoundary key="main" fallback={
                  <div className="h-screen flex items-center justify-center bg-background">
                    <div className="text-center">
                      <p className="text-muted-foreground">Feed unavailable</p>
                    </div>
                  </div>
                }>
                  <div className="max-w-6xl mx-auto p-4 pb-20">
                    <Feed />
                  </div>
                </ErrorBoundary>,
                // Video Feed
                <ErrorBoundary key="video" fallback={
                  <div className="h-screen flex items-center justify-center bg-background">
                    <div className="text-center">
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
            <div className="w-full">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 border-b border-border shadow-sm">
                  <TabsList className="w-full max-w-6xl mx-auto justify-start rounded-none h-14 bg-transparent p-0 gap-1">
                    <TabsTrigger 
                      value="audio" 
                      className="flex-1 gap-2 h-full rounded-none relative data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none hover:bg-muted/50 transition-colors after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary after:scale-x-0 data-[state=active]:after:scale-x-100 after:transition-transform after:duration-300 font-medium"
                    >
                      <span className="text-lg">🎙️</span> Audio
                    </TabsTrigger>
                    <TabsTrigger 
                      value="feed" 
                      className="flex-1 gap-2 h-full rounded-none relative data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none hover:bg-muted/50 transition-colors after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary after:scale-x-0 data-[state=active]:after:scale-x-100 after:transition-transform after:duration-300 font-medium"
                    >
                      <span className="text-lg">📱</span> Feed
                    </TabsTrigger>
                    <TabsTrigger 
                      value="video" 
                      className="flex-1 gap-2 h-full rounded-none relative data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none hover:bg-muted/50 transition-colors after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary after:scale-x-0 data-[state=active]:after:scale-x-100 after:transition-transform after:duration-300 font-medium"
                    >
                      <span className="text-lg">🎥</span> Video
                    </TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="audio" className="mt-0 animate-fade-in">
                  <ErrorBoundary fallback={
                    <div className="h-screen flex items-center justify-center bg-background">
                      <div className="text-center">
                        <p className="text-muted-foreground">Audio feed unavailable</p>
                      </div>
                    </div>
                  }>
                    <AudioFeed />
                  </ErrorBoundary>
                </TabsContent>

                <TabsContent value="feed" className="mt-0 animate-fade-in">
                  <ErrorBoundary fallback={
                    <div className="h-screen flex items-center justify-center bg-background">
                      <div className="text-center">
                        <p className="text-muted-foreground">Feed unavailable</p>
                      </div>
                    </div>
                  }>
                    <div className="max-w-6xl mx-auto p-4 pb-20">
                      <Feed />
                    </div>
                  </ErrorBoundary>
                </TabsContent>

                <TabsContent value="video" className="mt-0 animate-fade-in">
                  <ErrorBoundary fallback={
                    <div className="h-screen flex items-center justify-center bg-background">
                      <div className="text-center">
                        <p className="text-muted-foreground">Video feed unavailable</p>
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
