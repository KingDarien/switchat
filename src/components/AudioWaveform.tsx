import { memo } from 'react';
import { motion } from 'framer-motion';

interface AudioWaveformProps {
  isPlaying?: boolean;
}

const EASE = [0.42, 0, 0.58, 1] as const; // cubic-bezier easeInOut

const AudioWaveform = memo(({ isPlaying = false }: AudioWaveformProps) => {
  return (
    <div className="flex items-end gap-0.5 h-4">
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ scaleY: 0.4 }}
          animate={isPlaying ? { scaleY: [0.4, 1, 0.6, 0.9, 0.4] } : { scaleY: 0.4 }}
          transition={{ repeat: isPlaying ? Infinity : 0, duration: 1.2, ease: EASE, delay: i * 0.12 }}
          className="w-1 rounded-sm bg-gradient-to-b from-brand-primary/90 to-accent"
          style={{ transformOrigin: 'center bottom' }}
        />
      ))}
    </div>
  );
});

export default AudioWaveform;
