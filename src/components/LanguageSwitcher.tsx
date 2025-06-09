import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';

interface LanguageSwitcherProps {
  isScrolled: boolean;
  isWhiteHeader: boolean;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ isScrolled, isWhiteHeader }) => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const languages = [
    { code: 'bg', name: 'БГ' },
    { code: 'en', name: 'EN' }
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
      flex items-center gap-1 px-4 transition-colors font-['Listopad'] cursor-pointer
      ${isScrolled ? 'py-1.5' : 'py-2'}
    `;

    if (isWhiteHeader) {
      return `${baseClasses} text-[#141204] hover:text-[#5E6572]`;
    } else {
      return `${baseClasses} text-[#FFFFFC] hover:text-[#BCBDC0]`;
    }
  };

  const getDropdownClasses = () => {
    return `
      absolute top-full right-0 mt-2 w-32
      bg-[#FFFFFC] rounded-sm shadow-lg py-1
      z-50 overflow-hidden
    `;
  };

  const getOptionClasses = () => {
    return `
      block px-4 py-2 text-[#141204] hover:bg-[#D9D9D9] font-['Listopad'] 
      transition-colors cursor-pointer text-center
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
        <span>{currentLanguage.name}</span>
        <ChevronDown 
          size={16} 
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {isOpen && (
        <div className={getDropdownClasses()}>
          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => setLanguage(language.code as 'bg' | 'en')}
              className={getOptionClasses()}
              role="option"
              aria-selected={language.code === currentLanguage.code}
            >
              {language.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;