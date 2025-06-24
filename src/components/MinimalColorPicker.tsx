import React, { useState, useEffect, useRef } from 'react';

interface ColorOption {
  id: string;
  name: string;
  color: string;
}

const backgroundColors: ColorOption[] = [
  { id: 'default', name: 'Default', color: '#F5F5F5' },
  { id: 'warm', name: 'Warm', color: '#FEF7ED' },
  { id: 'cool', name: 'Cool', color: '#EFF6FF' },
  { id: 'nature', name: 'Nature', color: '#F0FDF4' },
  { id: 'sunset', name: 'Sunset', color: '#FFF7ED' }
];

const textColors: ColorOption[] = [
  { id: 'default', name: 'Default', color: '#FFFFFC' },
  { id: 'warm', name: 'Warm', color: '#FEF7ED' },
  { id: 'cool', name: 'Cool', color: '#E0F2FE' },
  { id: 'nature', name: 'Nature', color: '#ECFDF5' },
  { id: 'sunset', name: 'Sunset', color: '#FFF7ED' }
];

const MinimalColorPicker: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedBgColor, setSelectedBgColor] = useState('default');
  const [selectedTextColor, setSelectedTextColor] = useState('default');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
        setShowColorPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleThemeToggle = () => {
    const root = document.documentElement;
    
    if (!isDarkMode) {
      // Switch to dark mode - swap the variables
      root.style.setProperty('--color-background-primary', '#141204');
      root.style.setProperty('--color-text-primary', '#FFFFFC');
      setIsDarkMode(true);
    } else {
      // Switch to light mode - restore original values
      const selectedBgColorValue = backgroundColors.find(c => c.id === selectedBgColor)?.color || '#F5F5F5';
      root.style.setProperty('--color-background-primary', selectedBgColorValue);
      root.style.setProperty('--color-text-primary', '#141204');
      setIsDarkMode(false);
    }
    
    setShowColorPicker(false);
  };

  const handleColorSelect = (colorId: string) => {
    const root = document.documentElement;
    
    if (isDarkMode) {
      // In dark mode, change text color
      const selectedColor = textColors.find(c => c.id === colorId)?.color || '#FFFFFC';
      root.style.setProperty('--color-text-primary', selectedColor);
      setSelectedTextColor(colorId);
    } else {
      // In light mode, change background color
      const selectedColor = backgroundColors.find(c => c.id === colorId)?.color || '#F5F5F5';
      root.style.setProperty('--color-background-primary', selectedColor);
      setSelectedBgColor(colorId);
    }
    
    setShowColorPicker(false);
  };

  const currentDisplayColor = isDarkMode 
    ? textColors.find(c => c.id === selectedTextColor)?.color || '#FFFFFC'
    : backgroundColors.find(c => c.id === selectedBgColor)?.color || '#F5F5F5';

  const colorsToShow = isDarkMode ? textColors : backgroundColors;
  const selectedColorId = isDarkMode ? selectedTextColor : selectedBgColor;

  return (
    <div className="flex items-center space-x-4">
      {/* Color Picker */}
      <div className="relative" ref={colorPickerRef}>
        <button
          onClick={() => setShowColorPicker(!showColorPicker)}
          className="w-10 h-10 rounded-full border-2 border-gray-400 hover:border-gray-600 transition-all duration-200 shadow-md hover:shadow-lg cursor-pointer"
          style={{ 
            backgroundColor: currentDisplayColor,
          }}
          title={isDarkMode ? "Change text color" : "Change background color"}
        />

        {showColorPicker && (
          <div className="absolute top-12 left-0 bg-white rounded-lg shadow-xl border border-gray-300 p-3 z-50 min-w-max">
            <div className="text-xs text-gray-600 mb-2 font-medium">
              {isDarkMode ? 'Text Color' : 'Background Color'}
            </div>
            <div className="flex space-x-2">
              {colorsToShow.map((color) => (
                <button
                  key={color.id}
                  onClick={() => handleColorSelect(color.id)}
                  className={`w-8 h-8 rounded-full border-2 hover:scale-110 transition-transform duration-200 ${
                    selectedColorId === color.id ? 'border-gray-800 ring-2 ring-gray-300' : 'border-gray-400'
                  }`}
                  style={{ backgroundColor: color.color }}
                  title={color.name}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Dark/Light Mode Toggle */}
      <button
        onClick={handleThemeToggle}
        className="w-10 h-10 rounded-full border-2 border-gray-400 hover:border-gray-600 transition-all duration-200 shadow-md hover:shadow-lg relative overflow-hidden"
        title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
      >
        <div 
          className="absolute inset-0 w-1/2 bg-white"
        />
        <div 
          className="absolute inset-0 left-1/2 w-1/2 bg-black"
        />
        <div 
          className={`absolute top-1/2 transform -translate-y-1/2 w-2 h-2 rounded-full transition-all duration-300 ${
            isDarkMode ? 'left-1 bg-white' : 'right-1 bg-black'
          }`}
        />
      </button>
    </div>
  );
};

export default MinimalColorPicker;