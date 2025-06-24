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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedColor, setSelectedColor] = useState(currentColor);
  const [isDragging, setIsDragging] = useState(false);

  const swatchColors = [
    '#22C55E', '#EAB308', '#F97316', '#EF4444', '#EC4899', '#8B5CF6',
    '#6366F1', '#3B82F6', '#06B6D4', '#10B981', '#84CC16', '#F59E0B'
  ];

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

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      drawColorWheel();
    }
  }, [isOpen]);

  const drawColorWheel = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw color wheel
    for (let angle = 0; angle < 360; angle += 1) {
      const startAngle = (angle - 1) * Math.PI / 180;
      const endAngle = angle * Math.PI / 180;
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.lineWidth = 20;
      ctx.strokeStyle = `hsl(${angle}, 100%, 50%)`;
      ctx.stroke();
    }

    // Draw saturation/lightness gradient
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius - 20);
    gradient.addColorStop(0, 'white');
    gradient.addColorStop(0.7, 'rgba(255,255,255,0)');
    gradient.addColorStop(1, 'black');

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius - 20, 0, 2 * Math.PI);
    ctx.fillStyle = gradient;
    ctx.fill();
  };

  const getColorFromPosition = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return '#000000';

    const rect = canvas.getBoundingClientRect();
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const canvasX = x - rect.left;
    const canvasY = y - rect.top;

    const deltaX = canvasX - centerX;
    const deltaY = canvasY - centerY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
    const hue = (angle + 360) % 360;
    
    const maxRadius = Math.min(centerX, centerY) - 30;
    const saturation = Math.min(distance / maxRadius * 100, 100);
    const lightness = 50;

    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const color = getColorFromPosition(event.clientX, event.clientY);
    setSelectedColor(color);
    onColorSelect(color);
  };

  const handleSwatchClick = (color: string) => {
    setSelectedColor(color);
    onColorSelect(color);
  };

  const hexToHsl = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-10">
      <div
        ref={wheelRef}
        className="relative bg-white rounded-2xl p-6 shadow-2xl border border-gray-100"
        style={{
          width: '320px',
          animation: 'fadeInScale 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-700 font-['Listopad'] uppercase tracking-wide">
            PICK A SWATCH:
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Color swatches */}
        <div className="flex justify-center space-x-2 mb-6">
          {swatchColors.map((color, index) => (
            <button
              key={color}
              onClick={() => handleSwatchClick(color)}
              className={`w-6 h-6 rounded-full border-2 transition-all duration-200 hover:scale-110 ${
                selectedColor === color 
                  ? 'border-gray-600 scale-105 shadow-md' 
                  : 'border-white shadow-sm hover:border-gray-300'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>

        {/* Color wheel */}
        <div className="flex justify-center mb-4">
          <div className="relative">
            <canvas
              ref={canvasRef}
              width={200}
              height={200}
              onClick={handleCanvasClick}
              className="cursor-crosshair rounded-full"
              style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.1))' }}
            />
            {/* Center circle showing selected color */}
            <div
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-3 border-white shadow-lg"
              style={{ backgroundColor: selectedColor }}
            />
          </div>
        </div>

        {/* Color info */}
        <div className="text-center mb-4">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <span className="text-xs text-gray-500 font-mono">
              {selectedColor.startsWith('#') ? selectedColor.toUpperCase() : selectedColor}
            </span>
          </div>
        </div>

        {/* UI Contrast section */}
        <div className="border-t border-gray-100 pt-4">
          <div className="text-xs text-gray-500 uppercase tracking-wide text-center mb-3 font-['Listopad']">
            UI CONTRAST
          </div>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => handleSwatchClick('#F8F9FA')}
              className={`px-4 py-2 text-xs font-medium rounded-lg transition-all ${
                selectedColor === '#F8F9FA' 
                  ? 'bg-gray-200 text-gray-800' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-150'
              }`}
            >
              LIGHT
            </button>
            <button
              onClick={() => handleSwatchClick('#1F2937')}
              className={`px-4 py-2 text-xs font-medium rounded-lg transition-all ${
                selectedColor === '#1F2937' 
                  ? 'bg-gray-800 text-white' 
                  : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
              }`}
            >
              DARK
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInScale {
          0% {
            opacity: 0;
            transform: scale(0.8) translateY(20px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default ColorPickerWheel;