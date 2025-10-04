import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DoubleTapLikeProps {
  onDoubleTap: () => void;
  children: React.ReactNode;
}

const DoubleTapLike = ({ onDoubleTap, children }: DoubleTapLikeProps) => {
  const [showHeart, setShowHeart] = useState(false);
  const [heartPosition, setHeartPosition] = useState({ x: 0, y: 0 });
  const [lastTap, setLastTap] = useState(0);

  const handleTap = (e: React.TouchEvent | React.MouseEvent) => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTap;
    
    if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
      // Double tap detected
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const x = 'touches' in e 
        ? e.touches[0].clientX - rect.left 
        : (e as React.MouseEvent).clientX - rect.left;
      const y = 'touches' in e 
        ? e.touches[0].clientY - rect.top 
        : (e as React.MouseEvent).clientY - rect.top;
      
      setHeartPosition({ x, y });
      setShowHeart(true);
      onDoubleTap();
      
      setTimeout(() => setShowHeart(false), 1000);
    }
    
    setLastTap(now);
  };

  return (
    <div 
      className="relative w-full h-full"
      onTouchStart={handleTap}
      onClick={handleTap}
    >
      {children}
      
      {showHeart && (
        <div
          className="absolute pointer-events-none z-50"
          style={{
            left: `${heartPosition.x}px`,
            top: `${heartPosition.y}px`,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <Heart 
            className={cn(
              "w-20 h-20 text-white fill-red-500 animate-ping opacity-0",
              "animation-duration-1000"
            )}
            style={{
              filter: 'drop-shadow(0 0 10px rgba(239, 68, 68, 0.8))'
            }}
          />
          <Heart 
            className="absolute inset-0 w-20 h-20 text-white fill-red-500 animate-scale-in"
            style={{
              filter: 'drop-shadow(0 0 10px rgba(239, 68, 68, 0.8))'
            }}
          />
        </div>
      )}
    </div>
  );
};

export default DoubleTapLike;
