import React from 'react';
import { useTranslation } from 'react-i18next';

interface LanguageSwitcherProps {
  isScrolled: boolean;
  isWhiteHeader: boolean;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ isScrolled, isWhiteHeader }) => {
  const { i18n } = useTranslation();
  
  const setLanguage = (lang: 'bg' | 'en') => {
    const newLang = lang;
    i18n.changeLanguage(newLang);
    document.documentElement.lang = newLang;
  };

  return (
    <div className={`flex rounded-sm overflow-hidden ${
      isWhiteHeader
        ? 'bg-[#FFFFFC] border border-[#141204]'
        : 'bg-[#FFFFFC]'
    }`}>
      <button
        onClick={() => setLanguage('bg')}
        className={`px-3 ${isScrolled ? 'py-1.5' : 'py-2'} transition-colors font-['Listopad'] ${
          i18n.language === 'bg'
            ? 'bg-[#141204] text-[#FFFFFC]'
            : 'text-[#141204] hover:bg-[#D9D9D9]'
        }`}
      >
        БГ
      </button>
      <button
        onClick={() => setLanguage('en')}
        className={`px-3 ${isScrolled ? 'py-1.5' : 'py-2'} transition-colors font-['Listopad'] ${
          i18n.language === 'en'
            ? 'bg-[#141204] text-[#FFFFFC]'
            : 'text-[#141204] hover:bg-[#D9D9D9]'
        }`}
      >
        EN
      </button>
    </div>
  );
};

export default LanguageSwitcher;