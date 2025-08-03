import { useState, useRef, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface SwipeContainerProps {
  children: [React.ReactNode, React.ReactNode]; // [main feed, video feed]
}

const SwipeContainer = ({ children }: SwipeContainerProps) => {
  const [currentPage, setCurrentPage] = useState(0); // 0 = main feed, 1 = video feed
  const [isTransitioning, setIsTransitioning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const currentX = useRef(0);
  const isDragging = useRef(false);
  const isMobile = useIsMobile();

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobile) return;
    startX.current = e.touches[0].clientX;
    isDragging.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isMobile || isTransitioning) return;
    
    currentX.current = e.touches[0].clientX;
    const deltaX = currentX.current - startX.current;
    
    if (Math.abs(deltaX) > 10) {
      isDragging.current = true;
      e.preventDefault();
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isMobile || !isDragging.current || isTransitioning) return;
    
    const deltaX = currentX.current - startX.current;
    const threshold = 50;

    if (Math.abs(deltaX) > threshold) {
      if (deltaX > 0 && currentPage === 1) {
        // Swipe right - go to main feed
        setCurrentPage(0);
      } else if (deltaX < 0 && currentPage === 0) {
        // Swipe left - go to video feed
        setCurrentPage(1);
      }
    }
    
    isDragging.current = false;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMobile) return;
    startX.current = e.clientX;
    isDragging.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isMobile || !e.buttons || isTransitioning) return;
    
    currentX.current = e.clientX;
    const deltaX = currentX.current - startX.current;
    
    if (Math.abs(deltaX) > 10) {
      isDragging.current = true;
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (isMobile || !isDragging.current || isTransitioning) return;
    
    const deltaX = currentX.current - startX.current;
    const threshold = 100;

    if (Math.abs(deltaX) > threshold) {
      if (deltaX > 0 && currentPage === 1) {
        setCurrentPage(0);
      } else if (deltaX < 0 && currentPage === 0) {
        setCurrentPage(1);
      }
    }
    
    isDragging.current = false;
  };

  useEffect(() => {
    if (isTransitioning) {
      const timer = setTimeout(() => setIsTransitioning(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isTransitioning]);

  useEffect(() => {
    setIsTransitioning(true);
  }, [currentPage]);

  return (
    <div className="relative h-screen overflow-hidden">
      {/* Page Indicators */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 flex gap-2">
        <div 
          className={cn(
            'w-2 h-2 rounded-full transition-all duration-300',
            currentPage === 0 ? 'bg-primary' : 'bg-white/50'
          )}
        />
        <div 
          className={cn(
            'w-2 h-2 rounded-full transition-all duration-300',
            currentPage === 1 ? 'bg-primary' : 'bg-white/50'
          )}
        />
      </div>

      {/* Swipe Instructions */}
      {currentPage === 0 && (
        <div className="absolute bottom-4 right-4 z-50 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
          Swipe left for videos →
        </div>
      )}
      {currentPage === 1 && (
        <div className="absolute bottom-4 left-4 z-50 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
          ← Swipe right for feed
        </div>
      )}

      <div
        ref={containerRef}
        className="flex h-full transition-transform duration-300 ease-out"
        style={{
          transform: `translateX(-${currentPage * 100}vw)`,
          width: '200vw'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* Main Feed */}
        <div className="w-screen h-full flex-shrink-0">
          {children[0]}
        </div>
        
        {/* Video Feed */}
        <div className="w-screen h-full flex-shrink-0">
          {children[1]}
        </div>
      </div>
    </div>
  );
};

export default SwipeContainer;