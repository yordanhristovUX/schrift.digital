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

  // Sync selectedColor when currentColor changes
  useEffect(() => {
    setSelectedColor(currentColor);
  }, [currentColor]);

  // Close on click outside
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
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div
        ref={wheelRef}
        className="absolute bg-white rounded-full p-6 shadow-2xl transition-all duration-300 ease-out animate-scale-in pointer-events-auto"
        style={{
          top: `${position.y}px`,
          left: `${position.x}px`,
          width: '320px',
          height: '320px',
          transform: 'translate(-50%, -50%)',
          animation: 'colorWheelAppear 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors z-10"
        >
          <X size={16} />
        </button>

        {/* Title */}
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800 font-['Listopad']">
            {type === 'background' ? 'Background Color' : 'Text Color'}
          </h3>
        </div>

        {/* Color wheel */}
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="relative w-48 h-48">
            {colors.map((color, index) => {
              const angle = (index * 360) / colors.length;
              const radius = 85;
              const x = Math.cos((angle * Math.PI) / 180) * radius;
              const y = Math.sin((angle * Math.PI) / 180) * radius;

              return (
                <button
                  key={color}
                  onClick={() => handleColorClick(color)}
                  className={`absolute w-6 h-6 rounded-full border-2 transition-all duration-200 hover:scale-125 hover:z-10 ${
                    selectedColor === color 
                      ? 'border-gray-800 scale-110 shadow-lg' 
                      : 'border-gray-300 hover:border-gray-500'
                  }`}
                  style={{
                    backgroundColor: color,
                    left: `calc(50% + ${x}px - 12px)`,
                    top: `calc(50% + ${y}px - 12px)`,
                    animationDelay: `${index * 20}ms`,
                    animation: 'colorDotAppear 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
                  }}
                  title={color}
                />
              );
            })}

            {/* Center preview */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="w-12 h-12 rounded-full border-4 border-white shadow-lg"
                style={{ backgroundColor: selectedColor }}
              />
            </div>
          </div>
        </div>

        {/* Current color display */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          <div className="text-center">
            <div className="text-xs text-gray-500 font-mono">{selectedColor}</div>
          </div>
        </div>
      </div>

      {/* Animations */}
      <style jsx>{`
        @keyframes colorWheelAppear {
          0% {
            transform: scale(0.3) rotate(-180deg) translate(-50%, -50%);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: scale(1) rotate(0deg) translate(-50%, -50%);
            opacity: 1;
          }
        }

        @keyframes colorDotAppear {
          0% {
            transform: scale(0) rotate(180deg);
            opacity: 0;
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default ColorPickerWheel;
