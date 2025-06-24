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
  { id: 'warm', name: 'Warm', color: '#FED7AA' },
  { id: 'cool', name: 'Cool', color: '#93C5FD' },
  { id: 'nature', name: 'Nature', color: '#86EFAC' },
  { id: 'sunset', name: 'Sunset', color: '#FDBA74' },
  { id: 'purple', name: 'Purple', color: '#C4B5FD' }
];

const MinimalColorPicker: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedBgColor, setSelectedBgColor] = useState('default');
  const [selectedTextColor, setSelectedTextColor] = useState('default');
  const [showBgPicker, setShowBgPicker] = useState(false);
  const [showTextPicker, setShowTextPicker] = useState(false);
  const bgPickerRef = useRef<HTMLDivElement>(null);
  const textPickerRef = useRef<HTMLDivElement>(null);

  // Close pickers when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (bgPickerRef.current && !bgPickerRef.current.contains(event.target as Node)) {
        setShowBgPicker(false);
      }
      if (textPickerRef.current && !textPickerRef.current.contains(event.target as Node)) {
        setShowTextPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    // Apply theme to document
    const root = document.documentElement;
    
    if (isDarkMode) {
      root.setAttribute('data-theme', 'dark');
      if (selectedTextColor !== 'default') {
        root.setAttribute('data-text-color', selectedTextColor);
      } else {
        root.removeAttribute('data-text-color');
      }
      root.removeAttribute('data-bg-color');
    } else {
      root.removeAttribute('data-theme');
      root.removeAttribute('data-text-color');
      if (selectedBgColor !== 'default') {
        root.setAttribute('data-bg-color', selectedBgColor);
      } else {
        root.removeAttribute('data-bg-color');
      }
    }
  }, [isDarkMode, selectedBgColor, selectedTextColor]);

  const handleThemeToggle = () => {
    setIsDarkMode(!isDarkMode);
    setShowBgPicker(false);
    setShowTextPicker(false);
  };

  const handleBgColorSelect = (colorId: string) => {
    setSelectedBgColor(colorId);
    setShowBgPicker(false);
  };

  const handleTextColorSelect = (colorId: string) => {
    setSelectedTextColor(colorId);
    setShowTextPicker(false);
  };

  const currentBgColor = backgroundColors.find(c => c.id === selectedBgColor)?.color || '#F5F5F5';
  const currentTextColor = textColors.find(c => c.id === selectedTextColor)?.color || '#FFFFFC';

  return (
    <div className="flex items-center space-x-4">
      {/* First Circle: Background Color Picker (Light Mode) / Light Mode Toggle (Dark Mode) */}
      <div className="relative" ref={bgPickerRef}>
        <button
          onClick={isDarkMode ? handleThemeToggle : () => setShowBgPicker(!showBgPicker)}
          className="w-10 h-10 rounded-full border-2 border-gray-400 hover:border-gray-600 transition-all duration-200 shadow-md hover:shadow-lg relative"
          style={{ 
            backgroundColor: isDarkMode ? '#141204' : currentBgColor,
          }}
          title={isDarkMode ? "Switch to light mode" : "Change background color"}
        >
          {isDarkMode && (
            <div 
              className="absolute inset-1 rounded-full border border-gray-600"
              style={{ backgroundColor: '#F5F5F5' }}
            />
          )}
        </button>

        {/* Background Color Options */}
        {showBgPicker && !isDarkMode && (
          <div className="absolute top-12 left-0 bg-white rounded-lg shadow-xl border border-gray-300 p-3 z-50 min-w-max">
            <div className="flex space-x-2">
              {backgroundColors.map((color) => (
                <button
                  key={color.id}
                  onClick={() => handleBgColorSelect(color.id)}
                  className={`w-8 h-8 rounded-full border-2 hover:scale-110 transition-transform duration-200 ${
                    selectedBgColor === color.id ? 'border-gray-800 ring-2 ring-gray-300' : 'border-gray-400'
                  }`}
                  style={{ backgroundColor: color.color }}
                  title={color.name}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Second Circle: Dark Mode Toggle (Light Mode) / Text Color Picker (Dark Mode) */}
      <div className="relative" ref={textPickerRef}>
        <button
          onClick={isDarkMode ? () => setShowTextPicker(!showTextPicker) : handleThemeToggle}
          className="w-10 h-10 rounded-full border-2 border-gray-400 hover:border-gray-600 transition-all duration-200 shadow-md hover:shadow-lg relative overflow-hidden"
          title={isDarkMode ? "Change text color" : "Switch to dark mode"}
        >
          {/* Split circle design */}
          <div 
            className="absolute inset-0 w-1/2"
            style={{ backgroundColor: isDarkMode ? currentTextColor : '#FFFFFC' }}
          />
          <div 
            className="absolute inset-0 left-1/2 w-1/2"
            style={{ backgroundColor: '#141204' }}
          />
        </button>

        {/* Text Color Options (Dark Mode Only) */}
        {showTextPicker && isDarkMode && (
          <div className="absolute top-12 right-0 bg-white rounded-lg shadow-xl border border-gray-300 p-3 z-50 min-w-max">
            <div className="grid grid-cols-3 gap-2">
              {textColors.map((color) => (
                <button
                  key={color.id}
                  onClick={() => handleTextColorSelect(color.id)}
                  className={`w-8 h-8 rounded-full border-2 hover:scale-110 transition-transform duration-200 ${
                    selectedTextColor === color.id ? 'border-gray-800 ring-2 ring-gray-300' : 'border-gray-400'
                  }`}
                  style={{ backgroundColor: color.color }}
                  title={color.name}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MinimalColorPicker;