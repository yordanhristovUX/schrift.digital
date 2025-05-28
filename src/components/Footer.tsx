import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Facebook, Twitter, Instagram } from 'lucide-react';
import { Logo } from './Logo';

const Footer: React.FC = () => {
  return (
    <footer className="bg-[#141204] text-[#FFFFFC] py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
          <div className="col-span-1">
            <Logo className="h-8 w-auto mb-6" />
            <p className="text-[#BCBDC0] mb-6 font-['Listopad']">
             Библиотека от шрифтове с българска кирилица, работещи във Фигма.
            </p>
            <div className="flex space-x-4">
              <a 
                href="mailto:contact@schrift.digital"
                className="text-[#BCBDC0] hover:text-[#FFFFFC] transition-colors"
                aria-label="Email"
              >
                <Mail size={20} />
              </a>
              <a 
                href="https://facebook.com/schrift.digital"
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[#BCBDC0] hover:text-[#FFFFFC] transition-colors"
                aria-label="Facebook"
              >
                <Facebook size={20} />
              </a>
              <a 
                href="https://instagram.com/schrift.digital"
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[#BCBDC0] hover:text-[#FFFFFC] transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={20} />
              </a>
            </div>
          </div>
          
          <div className="col-span-1">
            <h3 className="text-lg font-semibold mb-4 font-['Listopad']">Шрифтове</h3>
            <ul className="space-y-2 font-['Listopad']">
              <li>
                <Link to="/" className="text-[#BCBDC0] hover:text-[#FFFFFC] transition-colors">
                  Всички шрифтове
                </Link>
              </li>
            </ul>
          </div>
          
          <div className="col-span-1">
            <h3 className="text-lg font-semibold mb-4 font-['Listopad']">За нас</h3>
            <ul className="space-y-2 font-['Listopad']">
              <li>
                <Link to="/about" className="text-[#BCBDC0] hover:text-[#FFFFFC] transition-colors">
                  За проекта
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-[#BCBDC0] hover:text-[#FFFFFC] transition-colors">
                  Вход
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-[#BCBDC0] hover:text-[#FFFFFC] transition-colors">
                  Регистрация
                </Link>
              </li>
            </ul>
          </div>
          
          <div className="col-span-1">
            <h3 className="text-lg font-semibold mb-4 font-['Listopad']">Контакти</h3>
            <ul className="space-y-2 font-['Listopad']">
              <li>
                <a href="mailto:contact@schrift.digital" className="text-[#BCBDC0] hover:text-[#FFFFFC] transition-colors">
                  contact@schrift.digital
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-[#5E6572] mt-12 pt-8 text-center sm:text-left sm:flex sm:justify-between font-['Listopad']">
          <p className="text-[#BCBDC0] text-sm">
            &copy; {new Date().getFullYear()} Schrift.Digital. Всички права запазени.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;