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
  const [red, setRed] = useState(255);
  const [green, setGreen] = useState(255);
  const [blue, setBlue] = useState(255);
  const [opacity, setOpacity] = useState(100);
  const [hexInput, setHexInput] = useState('#FFFFFF');
  const [isDragging, setIsDragging] = useState<'square' | 'hue' | 'opacity' | null>(null);

  // Predefined colors - mix of dark and light with different hues
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
        const { r, g, b } = hexToRgb(currentColor);
        setRed(r);
        setGreen(g);
        setBlue(b);
        setHexInput(currentColor);
        setOpacity(100);
        
        // Calculate hue from RGB for the hue bar
        const hueValue = rgbToHue(r, g, b);
        setHue(hueValue);
      } catch (error) {
        console.error('Error parsing color:', error);
        // Default to white if parsing fails
        setRed(255);
        setGreen(255);
        setBlue(255);
        setHue(0);
        setHexInput('#FFFFFF');
        setOpacity(100);
      }
    }
  }, [isOpen, currentColor]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Only close if clicking outside AND not on the trigger button
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node) && 
          !(event.target as Element).closest('[data-color-picker-trigger]')) {
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
  }, [isOpen, isDragging]);

  useEffect(() => {
    if (isOpen) {
      drawSquare();
      drawHueBar();
      drawOpacityBar();
    }
  }, [isOpen, hue, red, green, blue, opacity]);

  useEffect(() => {
    const hexColor = rgbToHex(red, green, blue);
    setHexInput(hexColor);
    onColorSelect(hexColor);
  }, [red, green, blue, opacity, onColorSelect]);

  const drawSquare = () => {
    const canvas = squareRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Get pure hue color
    const pureHue = hueToRgb(hue);
    
    // Create the color square with proper RGB gradients
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        // Calculate saturation (0 to 1 from left to right)
        const saturation = x / width;
        // Calculate brightness (1 to 0 from top to bottom)
        const brightness = 1 - (y / height);
        
        // Mix white -> pure hue -> black
        let r, g, b;
        
        if (saturation === 0) {
          // Left edge: white to black
          r = g = b = Math.round(brightness * 255);
        } else {
          // Mix pure hue with white/black based on brightness
          r = Math.round(pureHue.r * saturation * brightness + 255 * (1 - saturation) * brightness);
          g = Math.round(pureHue.g * saturation * brightness + 255 * (1 - saturation) * brightness);
          b = Math.round(pureHue.b * saturation * brightness + 255 * (1 - saturation) * brightness);
        }
        
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  };

  const drawHueBar = () => {
    const canvas = hueRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Create hue gradient using RGB
    for (let x = 0; x < width; x++) {
      const hueValue = (x / width) * 360;
      const rgb = hueToRgb(hueValue);
      ctx.fillStyle = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
      ctx.fillRect(x, 0, 1, height);
    }
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
    for (let x = 0; x < width; x++) {
      const alpha = x / width;
      ctx.fillStyle = `rgba(${red}, ${green}, ${blue}, ${alpha})`;
      ctx.fillRect(x, 0, 1, height);
    }
  };

  const getCanvasPosition = (canvas: HTMLCanvasElement, event: MouseEvent | React.MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(canvas.width, event.clientX - rect.left)),
      y: Math.max(0, Math.min(canvas.height, event.clientY - rect.top))
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
    // Calculate saturation (0 to 1 from left to right)
    const saturation = x / canvas.width;
    // Calculate brightness (1 to 0 from top to bottom)
    const brightness = 1 - (y / canvas.height);
    
    // Get pure hue color
    const pureHue = hueToRgb(hue);
    
    // Calculate RGB based on saturation and brightness
    let r, g, b;
    
    if (saturation === 0) {
      // Left edge: white to black
      r = g = b = Math.round(brightness * 255);
    } else {
      // Mix pure hue with white/black based on brightness
      r = Math.round(pureHue.r * saturation * brightness + 255 * (1 - saturation) * brightness);
      g = Math.round(pureHue.g * saturation * brightness + 255 * (1 - saturation) * brightness);
      b = Math.round(pureHue.b * saturation * brightness + 255 * (1 - saturation) * brightness);
    }
    
    setRed(Math.max(0, Math.min(255, r)));
    setGreen(Math.max(0, Math.min(255, g)));
    setBlue(Math.max(0, Math.min(255, b)));
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
    
    // Update RGB based on new hue
    const pureHue = hueToRgb(newHue);
    
    // Preserve saturation and brightness by recalculating RGB
    const hsv = rgbToHsv(red, green, blue);
    const newRgb = hsvToRgb(newHue, hsv.s, hsv.v);
    
    setRed(newRgb.r);
    setGreen(newRgb.g);
    setBlue(newRgb.b);
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
    const newOpacity = Math.round((x / canvas.width) * 100);
    setOpacity(Math.max(0, Math.min(100, newOpacity)));
  };

  const handleHexInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setHexInput(value);

    if (value.match(/^#[0-9A-Fa-f]{6}$/)) {
      const { r, g, b } = hexToRgb(value);
      setRed(r);
      setGreen(g);
      setBlue(b);
      
      // Update hue based on new RGB
      const newHue = rgbToHue(r, g, b);
      setHue(newHue);
    }
  };

  const handlePredefinedColorClick = (color: string) => {
    try {
      const { r, g, b } = hexToRgb(color);
      setRed(r);
      setGreen(g);
      setBlue(b);
      setHexInput(color);
      
      // Update hue based on new RGB
      const newHue = rgbToHue(r, g, b);
      setHue(newHue);
      
      onColorSelect(color);
    } catch (error) {
      console.error('Error parsing predefined color:', error);
    }
  };

  // RGB to Hex conversion
  const rgbToHex = (r: number, g: number, b: number) => {
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();
  };

  // Hex to RGB conversion
  const hexToRgb = (hex: string) => {
    // Remove # if present
    hex = hex.replace('#', '');

    // Ensure we have a valid hex color
    if (!/^[0-9A-Fa-f]{6}$/.test(hex)) {
      console.warn('Invalid hex color:', hex);
      hex = 'FFFFFF'; // Default to white
    }
    
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);

    return { r, g, b };
  };

  // Hue to RGB conversion
  const hueToRgb = (hue: number) => {
    const h = hue / 60;
    const c = 255;
    const x = c * (1 - Math.abs((h % 2) - 1));

    let r = 0, g = 0, b = 0;

    if (h >= 0 && h < 1) { r = c; g = x; b = 0; }
    else if (h >= 1 && h < 2) { r = x; g = c; b = 0; }
    else if (h >= 2 && h < 3) { r = 0; g = c; b = x; }
    else if (h >= 3 && h < 4) { r = 0; g = x; b = c; }
    else if (h >= 4 && h < 5) { r = x; g = 0; b = c; }
    else { r = c; g = 0; b = x; }

    return { r: Math.round(r), g: Math.round(g), b: Math.round(b) };
  };

  // RGB to Hue conversion
  const rgbToHue = (r: number, g: number, b: number) => {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    
    if (max === min) {
      return 0; // achromatic
    }
    
    const d = max - min;
    
    if (max === r) {
      h = (g - b) / d + (g < b ? 6 : 0);
    } else if (max === g) {
      h = (b - r) / d + 2;
    } else {
      h = (r - g) / d + 4;
    }
    
    h *= 60;
    
    return h;
  };

  // RGB to HSV conversion (for preserving saturation and brightness when changing hue)
  const rgbToHsv = (r: number, g: number, b: number) => {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    const v = max;
    
    const d = max - min;
    const s = max === 0 ? 0 : d / max;
    
    if (max === min) {
      h = 0; // achromatic
    } else {
      if (max === r) {
        h = (g - b) / d + (g < b ? 6 : 0);
      } else if (max === g) {
        h = (b - r) / d + 2;
      } else {
        h = (r - g) / d + 4;
      }
      h *= 60;
    }
    
    return { h, s, v };
  };

  // HSV to RGB conversion
  const hsvToRgb = (h: number, s: number, v: number) => {
    const c = v * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v - c;
    
    let r = 0, g = 0, b = 0;
    
    if (h >= 0 && h < 60) {
      r = c; g = x; b = 0;
    } else if (h >= 60 && h < 120) {
      r = x; g = c; b = 0;
    } else if (h >= 120 && h < 180) {
      r = 0; g = c; b = x;
    } else if (h >= 180 && h < 240) {
      r = 0; g = x; b = c;
    } else if (h >= 240 && h < 300) {
      r = x; g = 0; b = c;
    } else {
      r = c; g = 0; b = x;
    }
    
    return {
      r: Math.round((r + m) * 255),
      g: Math.round((g + m) * 255),
      b: Math.round((b + m) * 255)
    };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div
        ref={pickerRef}
        className="relative bg-white rounded-lg p-4 shadow-2xl border border-gray-200"
        style={{
          width: '280px',
          animation: 'fadeInScale 0.2s ease-out',
          position: 'absolute',
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: 'translate(-50%, -10px)',
          pointerEvents: 'auto'
        }}
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
              left: `${(red / 255) * 100}%`,
              top: `${100 - (blue / 255) * 100}%`,
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
              left: `${(opacity / 100) * 100}%`,
              top: '50%',
              transform: 'translate(-50%, -50%)'
            }}
          />
        </div>

        {/* Color Input */}
        <div className="flex items-center space-x-2 mb-4">
          <div
            className="w-8 h-8 rounded border border-gray-200 flex-shrink-0"
            style={{ backgroundColor: `rgb(${red}, ${green}, ${blue})` }}
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