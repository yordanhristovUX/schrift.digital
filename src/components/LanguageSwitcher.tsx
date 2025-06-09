import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Globe } from 'lucide-react';

interface LanguageSwitcherProps {
  isScrolled: boolean;
  isWhiteHeader: boolean;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ isScrolled, isWhiteHeader }) => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const languages = [
    { code: 'bg', name: 'Български', flag: '🇧🇬' },
    { code: 'en', name: 'English', flag: '🇺🇸' }
  ];

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];
  
  const setLanguage = (lang: 'bg' | 'en') => {
    i18n.changeLanguage(lang);
    document.documentElement.lang = lang;
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Determine button styling based on header state
  const getButtonClasses = () => {
    const baseClasses = `
      flex items-center gap-2 px-3 py-2 rounded-sm transition-all duration-200 
      font-['Listopad'] text-sm font-medium border cursor-pointer
      ${isScrolled ? 'py-1.5' : 'py-2'}
    `;

    if (isWhiteHeader) {
      return `${baseClasses} 
        bg-white text-[#141204] border-[#D9D9D9] 
        hover:bg-[#F5F5F5] hover:border-[#141204]
        ${isOpen ? 'bg-[#F5F5F5] border-[#141204]' : ''}
      `;
    } else {
      return `${baseClasses} 
        bg-white text-[#141204] border-[#D9D9D9] 
        hover:bg-[#F5F5F5] hover:border-[#141204]
        ${isOpen ? 'bg-[#F5F5F5] border-[#141204]' : ''}
      `;
    }
  };

  const getDropdownClasses = () => {
    return `
      absolute top-full right-0 mt-1 min-w-[140px] 
      bg-white border border-[#D9D9D9] rounded-sm shadow-lg 
      z-50 overflow-hidden
    `;
  };

  const getOptionClasses = (isSelected: boolean) => {
    return `
      flex items-center gap-3 px-4 py-3 text-sm font-['Listopad'] 
      transition-colors duration-150 cursor-pointer
      ${isSelected 
        ? 'bg-[#141204] text-white' 
        : 'text-[#141204] hover:bg-[#F5F5F5]'
      }
    `;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={getButtonClasses()}
        aria-label="Select language"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Globe size={16} />
        <span>{currentLanguage.name}</span>
        <ChevronDown 
          size={14} 
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {isOpen && (
        <div className={getDropdownClasses()}>
          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => setLanguage(language.code as 'bg' | 'en')}
              className={getOptionClasses(language.code === currentLanguage.code)}
              role="option"
              aria-selected={language.code === currentLanguage.code}
            >
              <span className="text-lg">{language.flag}</span>
              <span className="flex-1 text-left">{language.name}</span>
              {language.code === currentLanguage.code && (
                <span className="text-xs">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;