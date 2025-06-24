import React, { useState, useEffect } from 'react';

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

  useEffect(() => {
    // Apply theme to document
    const root = document.documentElement;
    
    if (isDarkMode) {
      root.setAttribute('data-theme', 'dark');
      root.setAttribute('data-text-color', selectedTextColor);
      root.removeAttribute('data-bg-color');
    } else {
      root.removeAttribute('data-theme');
      root.removeAttribute('data-text-color');
      root.setAttribute('data-bg-color', selectedBgColor);
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
    <div className="flex items-center space-x-3">
      {/* Background Color Picker (Light Mode) / Theme Toggle */}
      <div className="relative">
        <button
          onClick={isDarkMode ? handleThemeToggle : () => setShowBgPicker(!showBgPicker)}
          className="w-8 h-8 rounded-full border-2 border-gray-300 hover:border-gray-400 transition-colors shadow-sm"
          style={{ 
            backgroundColor: isDarkMode ? '#141204' : currentBgColor,
            position: 'relative'
          }}
          title={isDarkMode ? "Switch to light mode" : "Change background color"}
        >
          {isDarkMode && (
            <div 
              className="absolute inset-1 rounded-full"
              style={{ backgroundColor: currentTextColor }}
            />
          )}
        </button>

        {/* Background Color Options */}
        {showBgPicker && !isDarkMode && (
          <div className="absolute top-10 left-0 bg-white rounded-lg shadow-lg border border-gray-200 p-2 z-50">
            <div className="grid grid-cols-5 gap-2">
              {backgroundColors.map((color) => (
                <button
                  key={color.id}
                  onClick={() => handleBgColorSelect(color.id)}
                  className={`w-6 h-6 rounded-full border-2 hover:scale-110 transition-transform ${
                    selectedBgColor === color.id ? 'border-gray-600' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: color.color }}
                  title={color.name}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Dark Mode Toggle / Text Color Picker */}
      <div className="relative">
        <button
          onClick={isDarkMode ? () => setShowTextPicker(!showTextPicker) : handleThemeToggle}
          className="w-8 h-8 rounded-full border-2 border-gray-300 hover:border-gray-400 transition-colors shadow-sm relative overflow-hidden"
          title={isDarkMode ? "Change text color" : "Switch to dark mode"}
        >
          {/* Split circle design */}
          <div 
            className="absolute inset-0 w-1/2"
            style={{ backgroundColor: isDarkMode ? currentTextColor : '#F5F5F5' }}
          />
          <div 
            className="absolute inset-0 left-1/2 w-1/2"
            style={{ backgroundColor: isDarkMode ? '#141204' : '#141204' }}
          />
        </button>

        {/* Text Color Options (Dark Mode Only) */}
        {showTextPicker && isDarkMode && (
          <div className="absolute top-10 right-0 bg-white rounded-lg shadow-lg border border-gray-200 p-2 z-50">
            <div className="grid grid-cols-3 gap-2">
              {textColors.map((color) => (
                <button
                  key={color.id}
                  onClick={() => handleTextColorSelect(color.id)}
                  className={`w-6 h-6 rounded-full border-2 hover:scale-110 transition-transform ${
                    selectedTextColor === color.id ? 'border-gray-600' : 'border-gray-300'
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