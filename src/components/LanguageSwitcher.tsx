import React from 'react';
import { useTranslation } from 'react-i18next';

interface LanguageSwitcherProps {
  isScrolled: boolean;
  isWhiteHeader: boolean;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ isScrolled, isWhiteHeader }) => {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'bg' ? 'en' : 'bg';
    i18n.changeLanguage(newLang);
    document.documentElement.lang = newLang;
  };

  return (
    <button
      onClick={toggleLanguage}
      className={`px-4 ${isScrolled ? 'py-1.5' : 'py-2'} rounded-sm transition-colors font-['Listopad'] ${
        isWhiteHeader
          ? 'bg-[#FFFFFC] text-[#141204] border border-[#141204] hover:bg-[#D9D9D9]'
          : 'bg-[#FFFFFC] text-[#141204] hover:bg-[#D9D9D9]'
      }`}
    >
      {i18n.language === 'bg' ? 'EN' : 'БГ'}
    </button>
  );
};

export default LanguageSwitcher;