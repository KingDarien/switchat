import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, MapPin, Building2, Globe } from 'lucide-react';
import LocationPicker, { LocationData } from './LocationPicker';

export type FeedType = 'social' | 'following' | 'news';

interface FeedToggleProps {
  feedType: FeedType;
  selectedLocation: LocationData;
  onFeedTypeChange: (type: FeedType) => void;
  onLocationChange: (location: LocationData) => void;
}

const FeedToggle = ({ feedType, selectedLocation, onFeedTypeChange, onLocationChange }: FeedToggleProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const feedOptions = [
    { value: 'social' as FeedType, label: 'All Posts', icon: Globe },
    { value: 'following' as FeedType, label: 'Following', icon: Building2 },
    { value: 'news' as FeedType, label: 'Local News', icon: MapPin }
  ];

  const getCurrentIcon = () => {
    const option = feedOptions.find(opt => opt.value === feedType);
    return option?.icon || Globe;
  };

  const getCurrentLabel = () => {
    const option = feedOptions.find(opt => opt.value === feedType);
    if (feedType === 'news') {
      const locationName = selectedLocation.type === 'city' 
        ? `${selectedLocation.name}, ${selectedLocation.state}` 
        : selectedLocation.name;
      return `${option?.label} - ${locationName}`;
    }
    return option?.label || 'All Posts';
  };

  const CurrentIcon = getCurrentIcon();

  return (
    <div className="flex items-center gap-3 mb-6 p-4 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 rounded-lg border border-primary/10">
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className="flex items-center gap-2 hover-scale bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20 hover:border-primary/40 transition-all duration-300 shadow-md hover:shadow-lg"
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
          <div className="h-6 border-l-2 border-primary/30"></div>
          <span className="text-sm text-muted-foreground font-medium">Location:</span>
          <LocationPicker 
            selectedLocation={selectedLocation}
            onLocationChange={onLocationChange}
          />
        </div>
      )}
    </div>
  );
};

export default FeedToggle;