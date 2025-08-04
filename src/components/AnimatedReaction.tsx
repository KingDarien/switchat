import React, { useState, useEffect } from 'react';

interface AnimatedReactionProps {
  emoji: string;
  show: boolean;
  onComplete: () => void;
}

const AnimatedReaction = ({ emoji, show, onComplete }: AnimatedReactionProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (show) {
      setMounted(true);
      const timer = setTimeout(() => {
        setMounted(false);
        onComplete();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!show && !mounted) return null;

  return (
    <div 
      className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none transition-all duration-300 ${
        show 
          ? 'animate-scale-in opacity-100 scale-150' 
          : 'animate-scale-out opacity-0 scale-50'
      }`}
    >
      <div className="text-6xl animate-bounce">
        {emoji}
      </div>
    </div>
  );
};

export default AnimatedReaction;