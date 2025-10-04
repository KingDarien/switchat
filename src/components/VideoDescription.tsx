import { useState } from 'react';
import { cn } from '@/lib/utils';

interface VideoDescriptionProps {
  content: string;
  maxLines?: number;
}

const VideoDescription = ({ content, maxLines = 2 }: VideoDescriptionProps) => {
  const [expanded, setExpanded] = useState(false);
  
  // Simple check if content is long enough to truncate
  const needsTruncation = content.length > 100;

  return (
    <div className="mt-2 max-w-xs">
      <p 
        className={cn(
          "text-sm text-white",
          !expanded && needsTruncation && "line-clamp-2"
        )}
      >
        {content}
      </p>
      {needsTruncation && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
          className="text-xs text-white/70 hover:text-white mt-1 font-medium"
        >
          {expanded ? 'Show less' : 'more'}
        </button>
      )}
    </div>
  );
};

export default VideoDescription;
