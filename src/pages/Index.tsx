import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/Navbar';
import Feed from '@/components/Feed';
import VideoFeed from '@/components/VideoFeed';
import AudioFeed from '@/components/AudioFeed';
import SwipeContainer from '@/components/SwipeContainer';
import LiveStatusBanner from '@/components/LiveStatusBanner';
import ErrorBoundary from '@/components/ErrorBoundary';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

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
        </ErrorBoundary>
      </div>
    </div>
  );
};

export default Index;
