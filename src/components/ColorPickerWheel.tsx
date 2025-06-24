import React, { useState, useRef, useEffect } from 'react';
import { ChromePicker, ColorResult } from 'react-color';
import { X } from 'lucide-react';

interface ColorPickerWheelProps {
  isOpen: boolean;
  onClose: () => void;
  onColorSelect: (color: string) => void;
  currentColor: string;
  type: 'background' | 'text';
  position: { x: number; y: number };
}

const ColorPickerWheel: React.FC<ColorPickerWheelProps> = ({
  isOpen,
  onClose,
  onColorSelect,
  currentColor,
  type,
  position
}) => {
  const pickerRef = useRef<HTMLDivElement>(null);
  const [color, setColor] = useState(currentColor);

  // Convert CSS variables to actual hex values for the picker
  const getActualColor = (colorValue: string) => {
    if (colorValue === 'var(--color-background-primary)') return '#F5F5F5';
    if (colorValue === 'var(--color-text-primary)') return '#141204';
    return colorValue;
  };

  // Sync color when currentColor changes
  useEffect(() => {
    setColor(getActualColor(currentColor));
  }, [currentColor]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleColorChange = (colorResult: ColorResult) => {
    const hexColor = colorResult.hex;
    setColor(hexColor);
    onColorSelect(hexColor);
  };

  if (!isOpen) return null;

  // Calculate position to keep picker on screen
  const pickerWidth = 225;
  const pickerHeight = 300;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  let adjustedX = position.x;
  let adjustedY = position.y;

  // Adjust horizontal position
  if (position.x + pickerWidth > viewportWidth) {
    adjustedX = viewportWidth - pickerWidth - 20;
  }
  if (adjustedX < 20) {
    adjustedX = 20;
  }

  // Adjust vertical position
  if (position.y + pickerHeight > viewportHeight) {
    adjustedY = position.y - pickerHeight - 20;
  }
  if (adjustedY < 20) {
    adjustedY = 20;
  }

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div
        ref={pickerRef}
        className="absolute pointer-events-auto"
        style={{
          top: `${adjustedY}px`,
          left: `${adjustedX}px`,
        }}
      >
        <div className="bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
            <h3 className="text-sm font-medium text-gray-800 font-['Listopad']">
              {type === 'background' ? 'Background Color' : 'Text Color'}
            </h3>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-200 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Color Picker */}
          <div className="p-3">
            <ChromePicker
              color={color}
              onChange={handleColorChange}
              disableAlpha={true}
              styles={{
                default: {
                  picker: {
                    boxShadow: 'none',
                    border: 'none',
                    borderRadius: '0',
                    fontFamily: 'Listopad, sans-serif'
                  }
                }
              }}
            />
          </div>

          {/* Preset colors for quick selection */}
          <div className="p-3 border-t border-gray-200">
            <div className="text-xs text-gray-500 mb-2 font-['Listopad']">Quick Colors:</div>
            <div className="flex flex-wrap gap-2">
              {type === 'background' ? [
                '#FFFFFF', '#F5F5F5', '#E5E7EB', '#D1D5DB', '#9CA3AF', '#6B7280', '#374151', '#1F2937', '#111827', '#000000'
              ] : [
                '#000000', '#141204', '#374151', '#6B7280', '#EF4444', '#F97316', '#EAB308', '#22C55E', '#3B82F6', '#8B5CF6'
              ].map(presetColor => (
                <button
                  key={presetColor}
                  onClick={() => handleColorChange({ hex: presetColor } as ColorResult)}
                  className={`w-6 h-6 rounded border-2 transition-all hover:scale-110 ${
                    color === presetColor ? 'border-gray-800' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: presetColor }}
                  title={presetColor}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColorPickerWheel;