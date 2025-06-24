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
  const pickerRef = useRef<HTMLDivElement>(null);
  const squareRef = useRef<HTMLCanvasElement>(null);
  const hueRef = useRef<HTMLCanvasElement>(null);
  const opacityRef = useRef<HTMLCanvasElement>(null);
  
  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(0);
  const [lightness, setLightness] = useState(50);
  const [opacity, setOpacity] = useState(100);
  const [hexInput, setHexInput] = useState('#FFFFFF');
  const [isDragging, setIsDragging] = useState<'square' | 'hue' | 'opacity' | null>(null);

  // Predefined colors - mix of dark and light with different hues and low saturation
  const predefinedColors = [
    '#4F46E5', // Indigo
    '#10B981', // Emerald  
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#EC4899', // Pink
    '#8B5CF6', // Purple
    '#2D3748', // Dark gray
    '#4A5568', // Medium gray
    '#718096', // Light gray
    '#E2E8F0', // Very light gray
    '#FED7D7', // Light red
    '#C6F6D5', // Light green
  ];

  // Initialize with current color when picker opens
  useEffect(() => {
    if (isOpen && currentColor) {
      try {
        console.log('Initializing with color:', currentColor);
        const { h, s, l } = hexToHsl(currentColor);
        setHue(h);
        setSaturation(s);
        setLightness(l);
        setHexInput(currentColor);
        setOpacity(100);
      } catch (error) {
        console.error('Error parsing color:', error);
        // Default to white if parsing fails
        setHue(0);
        setSaturation(0);
        setLightness(100);
        setHexInput('#FFFFFF');
        setOpacity(100);
      }
    }
  }, [isOpen, currentColor]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!isDragging) return;

      if (isDragging === 'square') {
        handleSquareMove(event);
      } else if (isDragging === 'hue') {
        handleHueMove(event);
      } else if (isDragging === 'opacity') {
        handleOpacityMove(event);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(null);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isOpen, onClose, isDragging]);

  useEffect(() => {
    if (isOpen) {
      drawSquare();
      drawHueBar();
      drawOpacityBar();
    }
  }, [isOpen, hue, saturation, lightness, opacity]);

  useEffect(() => {
    const color = `hsla(${hue}, ${saturation}%, ${lightness}%, ${opacity / 100})`;
    const hexColor = hslToHex(hue, saturation, lightness);
    setHexInput(hexColor);
    onColorSelect(opacity === 100 ? hexColor : color);
  }, [hue, saturation, lightness, opacity, onColorSelect]);

  const drawSquare = () => {
    const canvas = squareRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Create base color from hue
    const baseColor = `hsl(${hue}, 100%, 50%)`;
    
    // Fill with base color
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, width, height);

    // Add white to transparent gradient (left to right for saturation)
    const satGradient = ctx.createLinearGradient(0, 0, width, 0);
    satGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    satGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = satGradient;
    ctx.fillRect(0, 0, width, height);

    // Add black gradient (top to bottom for lightness)
    const lightGradient = ctx.createLinearGradient(0, 0, 0, height);
    lightGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    lightGradient.addColorStop(1, 'rgba(0, 0, 0, 1)');
    ctx.fillStyle = lightGradient;
    ctx.fillRect(0, 0, width, height);
  };

  const drawHueBar = () => {
    const canvas = hueRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Create hue gradient
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    for (let i = 0; i <= 360; i += 60) {
      gradient.addColorStop(i / 360, `hsl(${i}, 100%, 50%)`);
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  };

  const drawOpacityBar = () => {
    const canvas = opacityRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw checkerboard pattern
    const checkSize = 8;
    for (let x = 0; x < width; x += checkSize) {
      for (let y = 0; y < height; y += checkSize) {
        const isEven = (Math.floor(x / checkSize) + Math.floor(y / checkSize)) % 2 === 0;
        ctx.fillStyle = isEven ? '#ffffff' : '#e5e5e5';
        ctx.fillRect(x, y, checkSize, checkSize);
      }
    }

    // Add opacity gradient
    const currentColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(1, currentColor);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  };

  const getCanvasPosition = (canvas: HTMLCanvasElement, event: MouseEvent | React.MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  };

  const handleSquareClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = squareRef.current;
    if (!canvas) return;

    const { x, y } = getCanvasPosition(canvas, event);
    updateSquarePosition(x, y, canvas);
    setIsDragging('square');
  };

  const handleSquareMove = (event: MouseEvent) => {
    const canvas = squareRef.current;
    if (!canvas) return;

    const { x, y } = getCanvasPosition(canvas, event);
    updateSquarePosition(x, y, canvas);
  };

  const updateSquarePosition = (x: number, y: number, canvas: HTMLCanvasElement) => {
    const newSaturation = 100 - (x / canvas.width) * 100;
    const newLightness = 100 - (y / canvas.height) * 100;

    setSaturation(Math.max(0, Math.min(100, newSaturation)));
    setLightness(Math.max(0, Math.min(100, newLightness)));
  };

  const handleHueClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = hueRef.current;
    if (!canvas) return;

    const { x } = getCanvasPosition(canvas, event);
    updateHuePosition(x, canvas);
    setIsDragging('hue');
  };

  const handleHueMove = (event: MouseEvent) => {
    const canvas = hueRef.current;
    if (!canvas) return;

    const { x } = getCanvasPosition(canvas, event);
    updateHuePosition(x, canvas);
  };

  const updateHuePosition = (x: number, canvas: HTMLCanvasElement) => {
    const newHue = (x / canvas.width) * 360;
    setHue(Math.max(0, Math.min(360, newHue)));
  };

  const handleOpacityClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = opacityRef.current;
    if (!canvas) return;

    const { x } = getCanvasPosition(canvas, event);
    updateOpacityPosition(x, canvas);
    setIsDragging('opacity');
  };

  const handleOpacityMove = (event: MouseEvent) => {
    const canvas = opacityRef.current;
    if (!canvas) return;

    const { x } = getCanvasPosition(canvas, event);
    updateOpacityPosition(x, canvas);
  };

  const updateOpacityPosition = (x: number, canvas: HTMLCanvasElement) => {
    const newOpacity = (x / canvas.width) * 100;
    setOpacity(Math.max(0, Math.min(100, newOpacity)));
  };

  const handleHexInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setHexInput(value);

    if (value.match(/^#[0-9A-Fa-f]{6}$/)) {
      const { h, s, l } = hexToHsl(value);
      setHue(h);
      setSaturation(s);
      setLightness(l);
    }
  };

  const handlePredefinedColorClick = (color: string) => {
    const { h, s, l } = hexToHsl(color);
    setHue(h);
    setSaturation(s);
    setLightness(l);
    setHexInput(color);
    onColorSelect(color);
  };

  const hslToHex = (h: number, s: number, l: number) => {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  };

  const hexToHsl = (hex: string) => {
    // Remove # if present
    hex = hex.replace('#', '');

    // Ensure we have a valid hex color
    if (!/^[0-9A-Fa-f]{6}$/.test(hex)) {
      console.warn('Invalid hex color:', hex);
      hex = 'FFFFFF'; // Default to white
    }
    
    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const b = parseInt(hex.slice(4, 6), 16) / 255;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        ref={pickerRef}
        className="relative bg-white rounded-lg p-4 shadow-2xl border border-gray-200"
        style={{
          width: '280px',
          animation: 'fadeInScale 0.2s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-700 font-['Listopad']">
            Color Picker
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Color Square */}
        <div className="relative mb-4">
          <canvas
            ref={squareRef}
            width={240}
            height={160}
            onMouseDown={handleSquareClick}
            className="cursor-crosshair rounded border border-gray-200 w-full"
          />
          {/* Picker circle */}
          <div
            className="absolute w-3 h-3 border-2 border-white rounded-full shadow-md pointer-events-none"
            style={{
              left: `${100 - saturation}%`,
              top: `${100 - lightness}%`,
              transform: 'translate(-50%, -50%)'
            }}
          />
        </div>

        {/* Hue Bar */}
        <div className="relative mb-3">
          <canvas
            ref={hueRef}
            width={240}
            height={16}
            onMouseDown={handleHueClick}
            className="cursor-pointer rounded border border-gray-200 w-full"
          />
          {/* Hue indicator */}
          <div
            className="absolute w-3 h-4 border-2 border-white rounded-sm shadow-md pointer-events-none"
            style={{
              left: `${(hue / 360) * 100}%`,
              top: '50%',
              transform: 'translate(-50%, -50%)'
            }}
          />
        </div>

        {/* Opacity Bar */}
        <div className="relative mb-4">
          <canvas
            ref={opacityRef}
            width={240}
            height={16}
            onMouseDown={handleOpacityClick}
            className="cursor-pointer rounded border border-gray-200 w-full"
          />
          {/* Opacity indicator */}
          <div
            className="absolute w-3 h-4 border-2 border-white rounded-sm shadow-md pointer-events-none"
            style={{
              left: `${opacity}%`,
              top: '50%',
              transform: 'translate(-50%, -50%)'
            }}
          />
        </div>

        {/* Color Input */}
        <div className="flex items-center space-x-2 mb-4">
          <div
            className="w-8 h-8 rounded border border-gray-200 flex-shrink-0"
            style={{ backgroundColor: `hsl(${hue}, ${saturation}%, ${lightness}%)` }}
          />
          <input
            type="text"
            value={hexInput}
            onChange={handleHexInputChange}
            className="flex-1 px-2 py-1 text-sm border border-gray-200 rounded font-mono"
            placeholder="#000000"
          />
          <span className="text-sm text-gray-500 font-mono">{Math.round(opacity)}%</span>
        </div>

        {/* Predefined Colors */}
        <div>
          <div className="text-xs text-gray-500 mb-2 font-['Listopad']">Default Colors</div>
          <div className="grid grid-cols-6 gap-2">
            {predefinedColors.map((color, index) => (
              <button
                key={index}
                onClick={() => handlePredefinedColorClick(color)}
                className="w-8 h-8 rounded border border-gray-200 hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInScale {
          0% {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
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