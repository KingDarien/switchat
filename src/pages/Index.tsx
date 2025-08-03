import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/Navbar';
import Feed from '@/components/Feed';
import VideoFeed from '@/components/VideoFeed';
import SwipeContainer from '@/components/SwipeContainer';
import LiveStatusBanner from '@/components/LiveStatusBanner';

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
        <SwipeContainer>
          {[
            // Main Feed
            <div className="max-w-6xl mx-auto p-4 pb-20">
              <Feed />
            </div>,
            // Video Feed
            <VideoFeed />
          ]}
        </SwipeContainer>
      </div>
    </div>
  );
};

export default Index;
