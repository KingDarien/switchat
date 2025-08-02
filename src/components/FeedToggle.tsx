import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, MapPin, Building2, Globe } from 'lucide-react';

export type FeedType = 'social' | 'following' | 'news';
export type NewsLocation = 'local' | 'city' | 'state';

interface FeedToggleProps {
  feedType: FeedType;
  newsLocation: NewsLocation;
  onFeedTypeChange: (type: FeedType) => void;
  onNewsLocationChange: (location: NewsLocation) => void;
}

const FeedToggle = ({ feedType, newsLocation, onFeedTypeChange, onNewsLocationChange }: FeedToggleProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const feedOptions = [
    { value: 'social' as FeedType, label: 'All Posts', icon: Globe },
    { value: 'following' as FeedType, label: 'Following', icon: Building2 },
    { value: 'news' as FeedType, label: 'Local News', icon: MapPin }
  ];

  const newsLocationOptions = [
    { value: 'local' as NewsLocation, label: 'Local Area', color: 'news-local' },
    { value: 'city' as NewsLocation, label: 'City', color: 'news-city' },
    { value: 'state' as NewsLocation, label: 'State', color: 'news-state' }
  ];

  const getCurrentIcon = () => {
    const option = feedOptions.find(opt => opt.value === feedType);
    return option?.icon || Globe;
  };

  const getCurrentLabel = () => {
    const option = feedOptions.find(opt => opt.value === feedType);
    if (feedType === 'news') {
      const locationOption = newsLocationOptions.find(opt => opt.value === newsLocation);
      return `${option?.label} - ${locationOption?.label}`;
    }
    return option?.label || 'All Posts';
  };

  const CurrentIcon = getCurrentIcon();

  return (
    <div className="flex items-center gap-3 mb-6">
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className="flex items-center gap-2 hover-scale bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20 hover:border-primary/40 transition-all duration-300"
          >
            <CurrentIcon className="h-4 w-4" />
            <span className="font-medium">{getCurrentLabel()}</span>
            <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[200px] animate-fade-in">
          {feedOptions.map((option) => {
            const Icon = option.icon;
            return (
              <DropdownMenuItem
                key={option.value}
                onClick={() => onFeedTypeChange(option.value)}
                className={`flex items-center gap-2 cursor-pointer transition-all duration-200 ${
                  feedType === option.value ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{option.label}</span>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {feedType === 'news' && (
        <div className="flex items-center gap-2 animate-fade-in">
          <div className="h-4 border-l border-border"></div>
          {newsLocationOptions.map((option) => (
            <Button
              key={option.value}
              variant={newsLocation === option.value ? "default" : "ghost"}
              size="sm"
              onClick={() => onNewsLocationChange(option.value)}
              className={`transition-all duration-300 hover-scale ${
                newsLocation === option.value 
                  ? `bg-${option.color} text-white shadow-md` 
                  : `hover:bg-${option.color}/10 hover:text-${option.color}`
              }`}
            >
              {option.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};

export default FeedToggle;