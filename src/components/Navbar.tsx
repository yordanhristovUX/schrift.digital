import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, User, ChevronDown, Crown, LogOut } from 'lucide-react';
import { Logo } from './Logo';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const location = useLocation();
  const { t } = useTranslation(['common', 'nav']);
  
  const isHomePage = location.pathname === '/';
  const isAboutPage = location.pathname === '/about';
  const isFontDetailPage = location.pathname.startsWith('/fonts/');
  const isWhiteHeader = isFontDetailPage || location.pathname === '/login' || 
                       location.pathname === '/profile' || location.pathname === '/supporter';
  
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: userData } = await supabase
          .from('users')
          .select('full_name, email, role')
          .eq('id', session.user.id)
          .maybeSingle();
        
        if (userData) {
          setUser(userData);
        }
      }
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        getUser();
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setShowDropdown(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showDropdown && !(event.target as Element).closest('.user-dropdown')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  return (
    <nav 
      className={`fixed w-full z-50 transition-all duration-300 ${
        isScrolled 
          ? 'mt-0 py-2 bg-[#141204] md:bg-opacity-95' 
          : 'mt-6 py-4'
      } ${
        isWhiteHeader && !isScrolled
          ? 'md:bg-[#FFFFFC]'
          : ''
      } ${
        isWhiteHeader && isScrolled
          ? '!bg-[#FFFFFC] !bg-opacity-95 border-b border-[#D9D9D9]'
          : ''
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <Link to="/" className={`flex items-center transition-transform duration-300 ${isScrolled ? 'scale-75 -translate-y-1' : ''}`}>
            <Logo 
              className="h-8 w-auto" 
              variant={isWhiteHeader ? 'dark' : 'light'} 
            />
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <Link 
              to="/" 
              className={`px-4 ${isScrolled ? 'py-1.5' : 'py-2'} rounded-sm transition-colors font-['Listopad'] ${
                isHomePage
                  ? 'bg-[#D9D9D9] text-[#141204] cursor-default'
                  : isWhiteHeader
                    ? 'bg-[#FFFFFC] text-[#141204] border border-[#141204] hover:bg-[#D9D9D9]'
                    : 'bg-[#FFFFFC] text-[#141204] hover:bg-[#D9D9D9]'
              }`}
            >
              {t('nav:fonts')}
            </Link>
            <Link 
              to="/about" 
              className={`px-4 ${isScrolled ? 'py-1.5' : 'py-2'} rounded-sm transition-colors font-['Listopad'] ${
                isAboutPage
                  ? 'bg-[#D9D9D9] text-[#141204] cursor-default'
                  : isWhiteHeader
                    ? 'bg-[#FFFFFC] text-[#141204] border border-[#141204] hover:bg-[#D9D9D9]'
                    : 'bg-[#FFFFFC] text-[#141204] hover:bg-[#D9D9D9]'
              }`}
            >
              {t('nav:about')}
            </Link>
            <LanguageSwitcher isScrolled={isScrolled} isWhiteHeader={isWhiteHeader} />
            {user ? (
              <div className="relative user-dropdown">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className={`flex items-center px-4 ${isScrolled ? 'py-1.5' : 'py-2'} transition-colors font-['Listopad'] ${
                    isWhiteHeader
                      ? 'text-[#141204] hover:text-[#5E6572]'
                      : 'text-[#FFFFFC] hover:text-[#BCBDC0]'
                  }`}
                >
                  <User size={20} className="mr-2" />
                  <span>{user.full_name}</span>
                  <ChevronDown size={16} className="ml-2" />
                </button>
                
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-[#FFFFFC] rounded-sm shadow-lg py-1">
                    {user.role === 'admin' && (
                      <Link
                        to="/admin"
                        className="block px-4 py-2 text-[#141204] hover:bg-[#D9D9D9] font-['Listopad'] flex items-center"
                        onClick={() => setShowDropdown(false)}
                      >
                        <User size={16} className="mr-2" />
                        {t('nav:admin_panel')}
                      </Link>
                    )}
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-[#141204] hover:bg-[#D9D9D9] font-['Listopad'] flex items-center"
                      onClick={() => setShowDropdown(false)}
                    >
                      <User size={16} className="mr-2" />
                      {t('nav:profile')}
                    </Link>
                    <Link
                      to="/supporter"
                      className="block px-4 py-2 text-[#141204] hover:bg-[#D9D9D9] font-['Listopad'] flex items-center"
                      onClick={() => setShowDropdown(false)}
                    >
                      <Crown size={16} className="mr-2" />
                      {t('nav:become_supporter')}
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-[#141204] hover:bg-[#D9D9D9] font-['Listopad'] flex items-center"
                    >
                      <LogOut size={16} className="mr-2" />
                      {t('nav:logout')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link 
                to="/login" 
                className={`px-4 ${isScrolled ? 'py-1.5' : 'py-2'} transition-colors font-['Listopad'] ${
                  isWhiteHeader
                    ? 'text-[#141204] hover:text-[#5E6572]'
                    : 'text-[#FFFFFC] hover:text-[#BCBDC0]'
                }`}
              >
                {t('nav:login')}
              </Link>
            )}
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            <LanguageSwitcher isScrolled={isScrolled} isWhiteHeader={isWhiteHeader} />
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`transition-colors ${
                isWhiteHeader
                  ? 'text-[#141204] hover:text-[#5E6572]'
                  : 'text-[#FFFFFC] hover:text-[#BCBDC0]'
              } focus:outline-none`}
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
        
        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4">
            <div className="flex flex-col space-y-2">
              <Link 
                to="/" 
                className={`px-4 py-2 rounded-sm transition-colors text-center font-['Listopad'] ${
                  isHomePage
                    ? 'bg-[#D9D9D9] text-[#141204] cursor-default'
                    : 'bg-[#FFFFFC] text-[#141204] hover:bg-[#D9D9D9]'
                }`}
                onClick={() => setIsOpen(false)}
              >
                {t('nav:fonts')}
              </Link>
              <Link 
                to="/about" 
                className={`px-4 py-2 rounded-sm transition-colors text-center font-['Listopad'] ${
                  isAboutPage
                    ? 'bg-[#D9D9D9] text-[#141204] cursor-default'
                    : 'bg-[#FFFFFC] text-[#141204] hover:bg-[#D9D9D9]'
                }`}
                onClick={() => setIsOpen(false)}
              >
                {t('nav:about')}
              </Link>
              {user ? (
                <div className="border-t border-[#5E6572] pt-2 mt-2">
                  <div className="px-4 py-2 text-[#FFFFFC] text-center font-['Listopad'] flex items-center justify-center">
                    <User size={20} className="mr-2" />
                    {user.full_name}
                  </div>
                  {user.role === 'admin' && (
                    <Link
                      to="/admin"
                      className="block px-4 py-2 text-[#FFFFFC] hover:text-[#BCBDC0] text-center font-['Listopad']"
                      onClick={() => setIsOpen(false)}
                    >
                      {t('nav:admin_panel')}
                    </Link>
                  )}
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-[#FFFFFC] hover:text-[#BCBDC0] text-center font-['Listopad']"
                    onClick={() => setIsOpen(false)}
                  >
                    {t('nav:profile')}
                  </Link>
                  <Link
                    to="/supporter"
                    className="block px-4 py-2 text-[#FFFFFC] hover:text-[#BCBDC0] text-center font-['Listopad']"
                    onClick={() => setIsOpen(false)}
                  >
                    {t('nav:become_supporter')}
                  </Link>
                  <button 
                    onClick={() => {
                      handleLogout();
                      setIsOpen(false);
                    }}
                    className="w-full px-4 py-2 text-[#FFFFFC] hover:text-[#BCBDC0] text-center font-['Listopad']"
                  >
                    {t('nav:logout')}
                  </button>
                </div>
              ) : (
                <Link 
                  to="/login" 
                  className="px-4 py-2 text-[#FFFFFC] hover:text-[#BCBDC0] transition-colors text-center font-['Listopad']"
                  onClick={() => setIsOpen(false)}
                >
                  {t('nav:login')}
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;