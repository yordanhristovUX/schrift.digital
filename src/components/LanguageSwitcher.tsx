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
      className="px-3 py-1 text-sm rounded-sm font-['Listopad'] bg-[#D9D9D9] text-[#141204] hover:bg-[#BCBDC0]"
    >
      {i18n.language === 'bg' ? 'EN' : 'БГ'}
    </button>
  );
};

export default LanguageSwitcher;