import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface ThemeData {
  type: 'solid' | 'gradient' | 'image';
  colors: string[];
  imageUrl?: string;
}

interface ThemeSelectorProps {
  currentTheme: ThemeData;
  onThemeChange: (theme: ThemeData) => void;
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({ currentTheme, onThemeChange }) => {
  const [selectedType, setSelectedType] = useState<'solid' | 'gradient' | 'image'>(currentTheme.type);
  const [color1, setColor1] = useState(currentTheme.colors[0] || '#1a1a1a');
  const [color2, setColor2] = useState(currentTheme.colors[1] || '#2a2a2a');
  const [imageUrl, setImageUrl] = useState(currentTheme.imageUrl || '');

  const presetThemes = [
    { name: 'Dark Ocean', type: 'gradient', colors: ['#1e3a8a', '#1e40af'] },
    { name: 'Sunset', type: 'gradient', colors: ['#f59e0b', '#dc2626'] },
    { name: 'Forest', type: 'gradient', colors: ['#059669', '#0d9488'] },
    { name: 'Purple Haze', type: 'gradient', colors: ['#7c3aed', '#a855f7'] },
    { name: 'Dark Mode', type: 'solid', colors: ['#1a1a1a'] },
    { name: 'Light Mode', type: 'solid', colors: ['#f8fafc'] },
  ];

  const handleApplyTheme = () => {
    const theme: ThemeData = {
      type: selectedType,
      colors: selectedType === 'solid' ? [color1] : [color1, color2],
      ...(selectedType === 'image' && { imageUrl })
    };
    onThemeChange(theme);
  };

  const getPreviewStyle = () => {
    if (selectedType === 'solid') {
      return { backgroundColor: color1 };
    } else if (selectedType === 'gradient') {
      return { background: `linear-gradient(135deg, ${color1}, ${color2})` };
    } else if (selectedType === 'image' && imageUrl) {
      return { 
        backgroundImage: `url(${imageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      };
    }
    return { backgroundColor: '#1a1a1a' };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Background Theme</CardTitle>
        <CardDescription>
          Customize how your profile looks to visitors
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Theme Type Selection */}
        <div className="space-y-2">
          <Label>Theme Type</Label>
          <div className="flex gap-2">
            {['solid', 'gradient', 'image'].map((type) => (
              <Button
                key={type}
                variant={selectedType === type ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedType(type as any)}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Color Pickers */}
        {selectedType !== 'image' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="color1">
                {selectedType === 'solid' ? 'Background Color' : 'Start Color'}
              </Label>
              <div className="flex gap-2">
                <Input
                  id="color1"
                  type="color"
                  value={color1}
                  onChange={(e) => setColor1(e.target.value)}
                  className="w-16 h-10 p-1"
                />
                <Input
                  value={color1}
                  onChange={(e) => setColor1(e.target.value)}
                  placeholder="#1a1a1a"
                  className="flex-1"
                />
              </div>
            </div>
            
            {selectedType === 'gradient' && (
              <div className="space-y-2">
                <Label htmlFor="color2">End Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="color2"
                    type="color"
                    value={color2}
                    onChange={(e) => setColor2(e.target.value)}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={color2}
                    onChange={(e) => setColor2(e.target.value)}
                    placeholder="#2a2a2a"
                    className="flex-1"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Image URL Input */}
        {selectedType === 'image' && (
          <div className="space-y-2">
            <Label htmlFor="imageUrl">Background Image URL</Label>
            <Input
              id="imageUrl"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
          </div>
        )}

        {/* Theme Preview */}
        <div className="space-y-2">
          <Label>Preview</Label>
          <div 
            className="w-full h-24 rounded-lg border-2 border-border"
            style={getPreviewStyle()}
          />
        </div>

        {/* Preset Themes */}
        <div className="space-y-2">
          <Label>Quick Presets</Label>
          <div className="grid grid-cols-3 gap-2">
            {presetThemes.map((preset) => (
              <Button
                key={preset.name}
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedType(preset.type as any);
                  setColor1(preset.colors[0]);
                  if (preset.colors[1]) setColor2(preset.colors[1]);
                }}
                className="text-xs"
              >
                {preset.name}
              </Button>
            ))}
          </div>
        </div>

        <Button onClick={handleApplyTheme} className="w-full">
          Apply Theme
        </Button>
      </CardContent>
    </Card>
  );
};

export default ThemeSelector;