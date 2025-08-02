import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { ChevronDown, MapPin, Search } from 'lucide-react';

export interface LocationData {
  type: 'city' | 'state';
  name: string;
  state?: string; // For cities, includes the state
}

interface LocationPickerProps {
  selectedLocation: LocationData;
  onLocationChange: (location: LocationData) => void;
}

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware',
  'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky',
  'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
  'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico',
  'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania',
  'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
  'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
];

const MAJOR_CITIES = [
  { name: 'New York', state: 'New York' },
  { name: 'Los Angeles', state: 'California' },
  { name: 'Chicago', state: 'Illinois' },
  { name: 'Houston', state: 'Texas' },
  { name: 'Phoenix', state: 'Arizona' },
  { name: 'Philadelphia', state: 'Pennsylvania' },
  { name: 'San Antonio', state: 'Texas' },
  { name: 'San Diego', state: 'California' },
  { name: 'Dallas', state: 'Texas' },
  { name: 'San Jose', state: 'California' },
  { name: 'Austin', state: 'Texas' },
  { name: 'Jacksonville', state: 'Florida' },
  { name: 'Fort Worth', state: 'Texas' },
  { name: 'Columbus', state: 'Ohio' },
  { name: 'Charlotte', state: 'North Carolina' },
  { name: 'San Francisco', state: 'California' },
  { name: 'Indianapolis', state: 'Indiana' },
  { name: 'Seattle', state: 'Washington' },
  { name: 'Denver', state: 'Colorado' },
  { name: 'Boston', state: 'Massachusetts' },
  { name: 'El Paso', state: 'Texas' },
  { name: 'Detroit', state: 'Michigan' },
  { name: 'Nashville', state: 'Tennessee' },
  { name: 'Portland', state: 'Oregon' },
  { name: 'Memphis', state: 'Tennessee' },
  { name: 'Oklahoma City', state: 'Oklahoma' },
  { name: 'Las Vegas', state: 'Nevada' },
  { name: 'Louisville', state: 'Kentucky' },
  { name: 'Baltimore', state: 'Maryland' },
  { name: 'Milwaukee', state: 'Wisconsin' },
  { name: 'Albuquerque', state: 'New Mexico' },
  { name: 'Tucson', state: 'Arizona' },
  { name: 'Fresno', state: 'California' },
  { name: 'Mesa', state: 'Arizona' },
  { name: 'Sacramento', state: 'California' },
  { name: 'Atlanta', state: 'Georgia' },
  { name: 'Kansas City', state: 'Missouri' },
  { name: 'Colorado Springs', state: 'Colorado' },
  { name: 'Miami', state: 'Florida' },
  { name: 'Raleigh', state: 'North Carolina' },
  { name: 'Omaha', state: 'Nebraska' },
  { name: 'Long Beach', state: 'California' },
  { name: 'Virginia Beach', state: 'Virginia' },
  { name: 'Oakland', state: 'California' },
  { name: 'Minneapolis', state: 'Minnesota' },
  { name: 'Tulsa', state: 'Oklahoma' },
  { name: 'Arlington', state: 'Texas' },
  { name: 'Tampa', state: 'Florida' },
  { name: 'New Orleans', state: 'Louisiana' }
];

const LocationPicker = ({ selectedLocation, onLocationChange }: LocationPickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCities = MAJOR_CITIES.filter(city =>
    city.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    city.state.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredStates = US_STATES.filter(state =>
    state.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDisplayName = () => {
    if (selectedLocation.type === 'city') {
      return `${selectedLocation.name}, ${selectedLocation.state}`;
    }
    return selectedLocation.name;
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="flex items-center gap-2 hover-scale bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20 hover:border-primary/40 transition-all duration-300 shadow-md hover:shadow-lg min-w-[200px] justify-between"
        >
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span className="font-medium">{getDisplayName()}</span>
          </div>
          <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80 animate-fade-in max-h-96 overflow-y-auto">
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search cities or states..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        
        {searchTerm && (
          <>
            {filteredStates.length > 0 && (
              <div className="p-2">
                <div className="text-xs font-medium text-muted-foreground mb-2">States</div>
                {filteredStates.slice(0, 5).map((state) => (
                  <DropdownMenuItem
                    key={state}
                    onClick={() => {
                      onLocationChange({ type: 'state', name: state });
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <MapPin className="h-4 w-4" />
                    <span>{state}</span>
                  </DropdownMenuItem>
                ))}
              </div>
            )}
            
            {filteredCities.length > 0 && (
              <div className="p-2">
                <div className="text-xs font-medium text-muted-foreground mb-2">Cities</div>
                {filteredCities.slice(0, 10).map((city) => (
                  <DropdownMenuItem
                    key={`${city.name}-${city.state}`}
                    onClick={() => {
                      onLocationChange({ type: 'city', name: city.name, state: city.state });
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <MapPin className="h-4 w-4" />
                    <span>{city.name}, {city.state}</span>
                  </DropdownMenuItem>
                ))}
              </div>
            )}
          </>
        )}
        
        {!searchTerm && (
          <div className="p-2">
            <div className="text-xs font-medium text-muted-foreground mb-2">Popular Locations</div>
            {MAJOR_CITIES.slice(0, 10).map((city) => (
              <DropdownMenuItem
                key={`${city.name}-${city.state}`}
                onClick={() => {
                  onLocationChange({ type: 'city', name: city.name, state: city.state });
                  setIsOpen(false);
                }}
                className="flex items-center gap-2 cursor-pointer"
              >
                <MapPin className="h-4 w-4" />
                <span>{city.name}, {city.state}</span>
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LocationPicker;