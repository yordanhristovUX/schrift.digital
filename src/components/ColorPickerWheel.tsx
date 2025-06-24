import React, { useState, useRef, useEffect } from 'react';
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
  const wheelRef = useRef<HTMLDivElement>(null);
  const [selectedColor, setSelectedColor] = useState(currentColor);

  const backgroundColors = [
    '#FFFFFF', '#F8F9FA', '#F1F3F4', '#E8EAED', '#DADCE0', '#BDC1C6',
    '#9AA0A6', '#80868B', '#5F6368', '#3C4043', '#202124', '#000000',
    '#FFF3E0', '#FFE0B2', '#FFCC80', '#FFB74D', '#FFA726', '#FF9800',
    '#F57C00', '#E65100', '#FFEBEE', '#FFCDD2', '#EF9A9A', '#E57373',
    '#EF5350', '#F44336', '#E53935', '#D32F2F', '#E8F5E8', '#C8E6C8',
    '#A5D6A7', '#81C784', '#66BB6A', '#4CAF50', '#43A047', '#388E3C'
  ];

  const textColors = [
    '#000000', '#212121', '#424242', '#616161', '#757575', '#9E9E9E',
    '#BDBDBD', '#E0E0E0', '#F5F5F5', '#FAFAFA', '#FFFFFF', '#141204',
    '#2D2B1F', '#5E6572', '#8B4513', '#A0522D', '#CD853F', '#DEB887',
    '#F4A460', '#D2691E', '#B22222', '#DC143C', '#FF0000', '#FF6347',
    '#FF4500', '#FF8C00', '#FFA500', '#FFD700', '#FFFF00', '#ADFF2F',
    '#32CD32', '#00FF00', '#00FA9A', '#00CED1', '#00BFFF', '#0000FF'
  ];

  const colors = type === 'background' ? backgroundColors : textColors;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wheelRef.current && !wheelRef.current.contains(event.target as Node)) {
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

  const handleColorClick = (color: string) => {
    setSelectedColor(color);
    onColorSelect(color);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-10">
      <div
        ref={wheelRef}
        className="relative bg-white rounded-lg p-4 shadow-lg border border-gray-200"
        style={{
          width: '280px',
          animation: 'fadeInScale 0.2s ease-out'
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X size={14} />
        </button>

        {/* Title */}
        <div className="text-center mb-3">
          <h3 className="text-sm font-medium text-gray-700 font-['Listopad']">
            {type === 'background' ? 'Background' : 'Text Color'}
          </h3>
        </div>

        {/* Color grid */}
        <div className="grid grid-cols-6 gap-2 mb-3">
          {colors.slice(0, 24).map((color, index) => (
            <button
              key={color}
              onClick={() => handleColorClick(color)}
              className={`w-8 h-8 rounded border-2 transition-all duration-150 hover:scale-110 ${
                selectedColor === color 
                  ? 'border-gray-600 scale-105' 
                  : 'border-gray-200 hover:border-gray-400'
              }`}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>

        {/* Current color display */}
        <div className="flex items-center justify-center space-x-2">
          <div
            className="w-6 h-6 rounded border border-gray-300"
            style={{ backgroundColor: selectedColor }}
          />
          <span className="text-xs text-gray-500 font-mono">{selectedColor}</span>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInScale {
          0% {
            opacity: 0;
            transform: scale(0.9);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default ColorPickerWheel;