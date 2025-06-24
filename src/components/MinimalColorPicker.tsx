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

const MinimalColorPicker: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedBgColor, setSelectedBgColor] = useState('default');
  const [showBgPicker, setShowBgPicker] = useState(false);
  const bgPickerRef = useRef<HTMLDivElement>(null);

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (bgPickerRef.current && !bgPickerRef.current.contains(event.target as Node)) {
        setShowBgPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    // Apply theme to document root (html element)
    const root = document.documentElement;
    
    if (isDarkMode) {
      root.setAttribute('data-theme', 'dark');
      // Remove background color variations in dark mode
      root.removeAttribute('data-bg-color');
    } else {
      root.removeAttribute('data-theme');
      // Apply background color only in light mode
      if (selectedBgColor !== 'default') {
        root.setAttribute('data-bg-color', selectedBgColor);
      } else {
        root.removeAttribute('data-bg-color');
      }
    }

    // Force a complete page repaint to ensure all elements update
    setTimeout(() => {
      document.body.style.display = 'none';
      document.body.offsetHeight; // Trigger reflow
      document.body.style.display = '';
      
      // Force update of all elements with inline styles
      const elementsWithInlineStyles = document.querySelectorAll('[style*="color"]');
      elementsWithInlineStyles.forEach(element => {
        const htmlElement = element as HTMLElement;
        if (htmlElement.style.color) {
          htmlElement.style.color = 'var(--color-text-primary)';
        }
      });
    }, 50);
  }, [isDarkMode, selectedBgColor]);

  const handleThemeToggle = () => {
    setIsDarkMode(!isDarkMode);
    setShowBgPicker(false);
  };

  const handleBgColorSelect = (colorId: string) => {
    setSelectedBgColor(colorId);
    setShowBgPicker(false);
  };

  const currentBgColor = backgroundColors.find(c => c.id === selectedBgColor)?.color || '#F5F5F5';

  return (
    <div className="flex items-center space-x-4">
      {/* First Circle: Background Color Picker (Light Mode Only) */}
      <div className="relative" ref={bgPickerRef}>
        <button
          onClick={() => !isDarkMode && setShowBgPicker(!showBgPicker)}
          className={`w-10 h-10 rounded-full border-2 border-gray-400 hover:border-gray-600 transition-all duration-200 shadow-md hover:shadow-lg ${
            isDarkMode ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
          }`}
          style={{ 
            backgroundColor: isDarkMode ? '#666' : currentBgColor,
          }}
          title={isDarkMode ? "Background color picker (disabled in dark mode)" : "Change background color"}
          disabled={isDarkMode}
        />

        {/* Background Color Options (Light Mode Only) */}
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

      {/* Second Circle: Dark/Light Mode Toggle */}
      <div className="relative">
        <button
          onClick={handleThemeToggle}
          className="w-10 h-10 rounded-full border-2 border-gray-400 hover:border-gray-600 transition-all duration-200 shadow-md hover:shadow-lg relative overflow-hidden"
          title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {/* Split circle design - always shows light/dark split */}
          <div 
            className="absolute inset-0 w-1/2"
            style={{ backgroundColor: '#FFFFFC' }}
          />
          <div 
            className="absolute inset-0 left-1/2 w-1/2"
            style={{ backgroundColor: '#141204' }}
          />
          
          {/* Indicator dot to show current mode */}
          <div 
            className={`absolute top-1/2 transform -translate-y-1/2 w-2 h-2 rounded-full transition-all duration-300 ${
              isDarkMode ? 'left-1 bg-white' : 'right-1 bg-black'
            }`}
          />
        </button>
      </div>
    </div>
  );
};

export default MinimalColorPicker;