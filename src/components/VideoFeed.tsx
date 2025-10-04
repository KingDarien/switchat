import { useState, useEffect } from 'react';
import { useVideoFeed } from '@/hooks/useVideoFeed';
import VideoPlayer from './VideoPlayer';
import VideoSkeleton from './VideoSkeleton';

const VideoFeed = () => {
  const { posts, loading, hasMore, loadMore } = useVideoFeed();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Trigger load more when approaching end
  useEffect(() => {
    if (currentIndex >= posts.length - 3 && hasMore && !loading) {
      loadMore();
    }
  }, [currentIndex, posts.length, hasMore, loading, loadMore]);

  const handleScroll = (direction: 'up' | 'down') => {
    if (direction === 'down' && currentIndex < posts.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else if (direction === 'up' && currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  if (loading && posts.length === 0) {
    return <VideoSkeleton />;
  }

  if (posts.length === 0) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background p-8 text-center animate-fade-in">
        <div className="rounded-full bg-muted/50 p-6 mb-4">
          <span className="text-5xl">🎥</span>
        </div>
        <h3 className="text-xl font-semibold mb-2">No Videos Yet</h3>
        <p className="text-muted-foreground max-w-md">
          Follow more users or create your first video to see content here
        </p>
      </div>
    );
  }

  // Render only visible videos (current, previous, next)
  const visibleRange = {
    start: Math.max(0, currentIndex - 1),
    end: Math.min(posts.length - 1, currentIndex + 1)
  };

  return (
    <div className="h-screen overflow-hidden bg-background relative snap-y snap-mandatory">
      <div 
        className="flex flex-col transition-transform duration-300 ease-out"
        style={{
          transform: `translateY(-${currentIndex * 100}vh)`,
          height: `${posts.length * 100}vh`
        }}
      >
        {posts.map((post, index) => {
          const shouldRender = index >= visibleRange.start && index <= visibleRange.end;
          
          return (
            <div key={post.id} className="h-screen flex-shrink-0 snap-start snap-always">
              {shouldRender ? (
                <VideoPlayer
                  post={post}
                  isActive={index === currentIndex}
                  onScroll={handleScroll}
                  canScrollUp={currentIndex > 0}
                  canScrollDown={currentIndex < posts.length - 1}
                />
              ) : (
                <div className="h-full w-full bg-black" />
              )}
            </div>
          );
        })}
        
        {loading && hasMore && (
          <div className="h-screen flex-shrink-0 snap-start">
            <VideoSkeleton />
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoFeed;