import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Facebook } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Logo } from './Logo';

const Footer: React.FC = () => {
  const { t } = useTranslation(['common']);
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#141204] text-[#FFFFFC] py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
          <div className="col-span-1">
            <Logo className="h-8 w-auto mb-6" />
            <p className="text-[#BCBDC0] mb-6 font-['Listopad']">
              {t('footer.description')}
            </p>
            <div className="flex space-x-4">
              <a
                href="mailto:culturenteam@gmail.com"
                className="text-[#BCBDC0] hover:text-[#FFFFFC] transition-colors"
                aria-label="Email"
              >
                <Mail size={20} />
              </a>
              <a 
                href="https://www.facebook.com/profile.php?id=61568127719822"
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[#BCBDC0] hover:text-[#FFFFFC] transition-colors"
                aria-label="Facebook"
              >
                <Facebook size={20} />
              </a>
            </div>
          </div>
          
          <div className="col-span-1">
            <h3 className="text-lg font-semibold mb-4 font-['Listopad']">
              {t('footer.about.title')}
            </h3>
            <ul className="space-y-2 font-['Listopad']">
              <li>
                <Link to="/about" className="text-[#BCBDC0] hover:text-[#FFFFFC] transition-colors">
                  {t('footer.about.project')}
                </Link>
              </li>
            </ul>
          </div>
          
          <div className="col-span-1">
            <h3 className="text-lg font-semibold mb-4 font-['Listopad']">
              {t('footer.contact.title')}
            </h3>
            <ul className="space-y-2 font-['Listopad']">
              <li>
                <a href="mailto:culturenteam@gmail.com" className="text-[#BCBDC0] hover:text-[#FFFFFC] transition-colors">
                  {t('footer.contact.email')}
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-[#5E6572] mt-12 pt-8 text-center sm:text-left sm:flex sm:justify-between font-['Listopad']">
          <p className="text-[#BCBDC0] text-sm">
            {t('footer.copyright', { year: currentYear })}  Font: Listopad by Stefan Peev
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;