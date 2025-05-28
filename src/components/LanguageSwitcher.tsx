import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'bg' ? 'en' : 'bg';
    i18n.changeLanguage(newLang);
    document.documentElement.lang = newLang;
  };

  return (
    <button
      onClick={toggleLanguage}
      className="px-4 py-2 rounded-sm text-sm font-medium bg-[#FFFFFC] text-[#141204] hover:bg-[#D9D9D9] transition-colors font-['Listopad']"
    >
      {i18n.language === 'bg' ? 'EN' : 'БГ'}
    </button>
  );
};

export default LanguageSwitcher;