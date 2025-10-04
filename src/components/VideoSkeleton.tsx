import { Skeleton } from '@/components/ui/skeleton';

const VideoSkeleton = () => {
  return (
    <div className="h-screen w-full bg-background relative flex items-center justify-center">
      <Skeleton className="h-full w-full" />
      
      {/* User info skeleton */}
      <div className="absolute bottom-24 left-4 flex items-center gap-3">
        <Skeleton className="w-12 h-12 rounded-full" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
      </div>
      
      {/* Controls skeleton */}
      <div className="absolute right-4 bottom-20 flex flex-col gap-4">
        <Skeleton className="w-12 h-12 rounded-full" />
        <Skeleton className="w-12 h-12 rounded-full" />
        <Skeleton className="w-12 h-12 rounded-full" />
        <Skeleton className="w-12 h-12 rounded-full" />
      </div>
      
      {/* Progress bar skeleton */}
      <div className="absolute bottom-20 left-4 right-20">
        <Skeleton className="h-1 w-full rounded-full" />
      </div>
    </div>
  );
};

export default VideoSkeleton;
