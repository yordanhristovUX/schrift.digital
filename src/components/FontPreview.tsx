import React, { useState, useEffect, useRef } from 'react';
import { Font, FontWeight, LanguageOption } from '../types/font';
import { Crown } from 'lucide-react';
import { Download } from 'lucide-react';
import { downloadFont, getWeightValue } from '../lib/fontService';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface FontPreviewProps {
  font: Font;
  requireAuth?: boolean;
}

const unicodeRanges = {
  bulgarian: 'U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116',
  russian: 'U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116',
  english: 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD'
};

const FontPreview: React.FC<FontPreviewProps> = ({ font, requireAuth = false }) => {
  const [previewText, setPreviewText] = useState(font.sample_text || 'Всички хора се раждат свободни и равни по достойнство и права.');
  const [fontSize, setFontSize] = useState(32);
  const [selectedWeight, setSelectedWeight] = useState<string>('Regular');
  const [selectedStyle, setSelectedStyle] = useState<string>('Normal');
  const [language, setLanguage] = useState<LanguageOption>('bulgarian');
  const [hasSubscription, setHasSubscription] = useState(false);
  const navigate = useNavigate();
  
  const previewRef = useRef<HTMLDivElement>(null);

  const languageExamples = {
    bulgarian: 'Всички хора се раждат свободни и равни по достойнство и права.',
    russian: 'Все люди рождаются свободными и равными в своем достоинстве и правах.',
    english: 'All human beings are born free and equal in dignity and rights.'
  };

  useEffect(() => {
    const checkSubscription = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase.rpc('has_active_premium');
        setHasSubscription(!!data);
      }
    };

    if (font.subscriber_only) {
      checkSubscription();
    }
  }, [font.subscriber_only]);

  useEffect(() => {
    if (font.weight_files) {
      const style = document.createElement('style');
      document.head.appendChild(style);

      const fontFaces = Object.entries(font.weight_files).map(([key, file]) => `
        /* ${language.charAt(0).toUpperCase() + language.slice(1)} */
        @font-face {
          font-family: "${font.name}";
          src: url("${file.path}");
          font-weight: ${getWeightValue(file.weight)};
          font-style: ${file.style.toLowerCase()};
          unicode-range: ${unicodeRanges[language]};
          font-display: swap;
        }
      `).join('\n');

      style.textContent = fontFaces;

      const availableWeights = Object.values(font.weight_files).map(f => f.weight);
      const availableStyles = Object.values(font.weight_files).map(f => f.style);
      
      if (availableWeights.includes('Regular')) {
        setSelectedWeight('Regular');
      } else if (availableWeights.length > 0) {
        setSelectedWeight(availableWeights[0]);
      }

      if (availableStyles.includes('Normal')) {
        setSelectedStyle('Normal');
      } else if (availableStyles.length > 0) {
        setSelectedStyle(availableStyles[0]);
      }

      return () => {
        document.head.removeChild(style);
      };
    }
  }, [font, language]);

  useEffect(() => {
    if (previewRef.current) {
      previewRef.current.setAttribute('lang', language === 'bulgarian' ? 'bg' : language === 'russian' ? 'ru' : 'en');
    }
  }, [language]);

  const handleLanguageChange = (option: LanguageOption) => {
    setLanguage(option);
    setPreviewText(languageExamples[option]);
  };

  const handleDownload = async () => {
    // Check if font requires subscription and user doesn't have one
    if (font.subscriber_only && !hasSubscription) {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login', { state: { from: `/fonts/${font.id}` } });
        return;
      }
      navigate('/supporter');
      return;
    }

    if (requireAuth) {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login', { state: { from: `/fonts/${font.id}` } });
        return;
      }
    }
    downloadFont(font, selectedWeight, selectedStyle);
  };

  const availableWeights = font.weight_files ? 
    [...new Set(Object.values(font.weight_files)
      .filter(f => f.style === selectedStyle)
      .map(f => f.weight))]
      .sort((a, b) => getWeightValue(a) - getWeightValue(b)) : 
    ['Regular'];

  const availableStyles = font.weight_files ? 
    [...new Set(Object.values(font.weight_files).map(f => f.style))]
      .sort((a, b) => a === 'Normal' ? -1 : b === 'Normal' ? 1 : a.localeCompare(b)) : 
    ['Normal'];

  return (
    <div className="bg-[#FFFFFC] rounded-sm shadow-md p-6 mb-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Preview {font.name}</h2>
        {font.subscriber_only && (
          <div className="flex items-center text-red-600 text-sm font-medium mb-2">
            <Crown size={16} className="mr-1" />
            Subscriber Only
          </div>
        )}
        <div className="flex items-center gap-4">
          <button
            onClick={handleDownload}
            className={`flex items-center px-4 py-2 rounded-sm text-sm font-medium ${
              font.subscriber_only && !hasSubscription
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-[#141204] text-[#FFFFFC] hover:bg-[#2D2B1F]'
            }`}
          >
            {font.subscriber_only && !hasSubscription && (
              <Crown size={16} className="mr-2" />
            )}
            <Download size={16} className="mr-2" />
            {font.subscriber_only && !hasSubscription
              ? 'Become Subscriber'
              : font.is_paid 
              ? `Purchase Family $${font.price}` 
              : `Download ${font.name}, ${selectedWeight}${selectedStyle !== 'Normal' ? `, ${selectedStyle}` : ''}`}
          </button>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row mb-6 gap-4">
        <div className="flex-1">
          <label htmlFor="previewText" className="block text-sm font-medium text-[#141204] mb-1 font-['Listopad']">
            Preview Text
          </label>
          <textarea
            id="previewText"
            value={previewText}
            onChange={(e) => setPreviewText(e.target.value)}
            className="w-full p-3 border border-[#D9D9D9] rounded-sm focus:ring-[#141204] focus:border-[#141204] font-['Listopad']"
            rows={3}
          />
        </div>
        
        <div className="flex flex-col space-y-4 md:w-64">
          <div>
            <label htmlFor="fontSize" className="block text-sm font-medium text-[#141204] mb-1 font-['Listopad']">
              Font Size: {fontSize}px
            </label>
            <input
              id="fontSize"
              type="range"
              min="8"
              max="72"
              value={fontSize}
              onChange={(e) => setFontSize(parseInt(e.target.value))}
              className="w-full h-2 bg-[#D9D9D9] rounded-sm appearance-none cursor-pointer"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[#141204] mb-1 font-['Listopad']">
              Font Style
            </label>
            <div className="flex flex-wrap gap-2">
              {availableStyles.map((style) => (
                <button
                  key={style}
                  onClick={() => setSelectedStyle(style)}
                  className={`px-3 py-1 text-sm rounded-sm font-['Listopad'] ${
                    selectedStyle === style
                      ? 'bg-[#141204] text-[#FFFFFC]'
                      : 'bg-[#D9D9D9] text-[#141204] hover:bg-[#BCBDC0]'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#141204] mb-1 font-['Listopad']">
              Font Weight
            </label>
            <div className="flex flex-wrap gap-2">
              {availableWeights.map((weight) => (
                <button
                  key={weight}
                  onClick={() => setSelectedWeight(weight)}
                  className={`px-3 py-1 text-sm rounded-sm font-['Listopad'] ${
                    selectedWeight === weight
                      ? 'bg-[#141204] text-[#FFFFFC]'
                      : 'bg-[#D9D9D9] text-[#141204] hover:bg-[#BCBDC0]'
                  }`}
                >
                  {weight}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[#141204] mb-1 font-['Listopad']">
              Language
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleLanguageChange('bulgarian')}
                className={`px-3 py-1 text-sm rounded-sm font-['Listopad'] ${
                  language === 'bulgarian'
                    ? 'bg-[#141204] text-[#FFFFFC]'
                    : 'bg-[#D9D9D9] text-[#141204] hover:bg-[#BCBDC0]'
                }`}
              >
                Bulgarian
              </button>
              <button
                onClick={() => handleLanguageChange('russian')}
                className={`px-3 py-1 text-sm rounded-sm font-['Listopad'] ${
                  language === 'russian'
                    ? 'bg-[#141204] text-[#FFFFFC]'
                    : 'bg-[#D9D9D9] text-[#141204] hover:bg-[#BCBDC0]'
                }`}
              >
                Russian
              </button>
              <button
                onClick={() => handleLanguageChange('english')}
                className={`px-3 py-1 text-sm rounded-sm font-['Listopad'] ${
                  language === 'english'
                    ? 'bg-[#141204] text-[#FFFFFC]'
                    : 'bg-[#D9D9D9] text-[#141204] hover:bg-[#BCBDC0]'
                }`}
              >
                English
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div 
        ref={previewRef}
        className="border border-[#D9D9D9] rounded-sm p-6 overflow-hidden"
        style={{ 
          fontFamily: `"${font.name}", sans-serif`,
          fontSize: `${fontSize}px`,
          fontWeight: getWeightValue(selectedWeight),
          fontStyle: selectedStyle.toLowerCase(),
          lineHeight: '1.5',
          minHeight: '200px'
        }}
      >
        {previewText}
      </div>
      
      <div className="mt-6 flex gap-4 flex-wrap">
        <div>
          <span className="block text-sm font-medium text-[#141204] mb-1 font-['Listopad']">Alphabet</span>
          <div 
            className="text-base text-[#141204]"
            style={{ 
              fontFamily: `"${font.name}", sans-serif`,
              fontWeight: getWeightValue(selectedWeight),
              fontStyle: selectedStyle.toLowerCase()
            }}
          >
            АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЬЮЯ
          </div>
          <div 
            className="text-base text-[#141204] mt-1"
            style={{ 
              fontFamily: `"${font.name}", sans-serif`,
              fontWeight: getWeightValue(selectedWeight),
              fontStyle: selectedStyle.toLowerCase()
            }}
          >
            абвгдежзийклмнопрстуфхцчшщъьюя
          </div>
        </div>
        
        <div>
          <span className="block text-sm font-medium text-[#141204] mb-1 font-['Listopad']">Numbers & Symbols</span>
          <div 
            className="text-base text-[#141204]"
            style={{ 
              fontFamily: `"${font.name}", sans-serif`,
              fontWeight: getWeightValue(selectedWeight),
              fontStyle: selectedStyle.toLowerCase()
            }}
          >
            0123456789
          </div>
          <div 
            className="text-base text-[#141204] mt-1"
            style={{ 
              fontFamily: `"${font.name}", sans-serif`,
              fontWeight: getWeightValue(selectedWeight),
              fontStyle: selectedStyle.toLowerCase()
            }}
          >
            {'!@#$%^&*()_+-={}[]|:;"\'<>,.?/'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FontPreview;