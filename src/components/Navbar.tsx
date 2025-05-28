import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, User, ChevronDown, Crown, LogOut } from 'lucide-react';
import { Logo } from './Logo';
import { supabase } from '../lib/supabase';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const isAboutPage = location.pathname === '/about';
  const isFontDetailPage = location.pathname.startsWith('/fonts/');
  
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
          .single();
        setUser(userData);
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

  // Close dropdown when clicking outside
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
          : 'mt-6 py-4 bg-[#141204] md:bg-transparent'
      } ${
        isFontDetailPage && isScrolled
          ? '!bg-[#FFFFFC] !bg-opacity-95 border-b border-[#D9D9D9]'
          : ''
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <Link to="/" className={`flex items-center transition-transform duration-300 ${isScrolled ? 'scale-75 -translate-y-1' : ''}`}>
            <Logo className="h-8 w-auto" variant={isFontDetailPage && isScrolled ? 'dark' : 'light'} />
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <Link 
              to="/" 
              className={`px-4 py-2 rounded-sm transition-colors font-['Listopad'] ${
                isHomePage
                  ? 'bg-[#D9D9D9] text-[#141204] cursor-default'
                  : isFontDetailPage && isScrolled
                    ? 'bg-[#FFFFFC] text-[#141204] border border-[#141204] hover:bg-[#D9D9D9]'
                    : 'bg-[#FFFFFC] text-[#141204] hover:bg-[#D9D9D9]'
              }`}
            >
              ШРИФТОВЕ
            </Link>
            <Link 
              to="/about" 
              className={`px-4 py-2 rounded-sm transition-colors font-['Listopad'] ${
                isAboutPage
                  ? 'bg-[#D9D9D9] text-[#141204] cursor-default'
                  : isFontDetailPage && isScrolled
                    ? 'bg-[#FFFFFC] text-[#141204] border border-[#141204] hover:bg-[#D9D9D9]'
                    : 'bg-[#FFFFFC] text-[#141204] hover:bg-[#D9D9D9]'
              }`}
            >
              ЗА НАС
            </Link>
            {user ? (
              <div className="relative user-dropdown">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className={`flex items-center px-4 py-2 transition-colors font-['Listopad'] ${
                    isFontDetailPage && isScrolled
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
                        Админ панел
                      </Link>
                    )}
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-[#141204] hover:bg-[#D9D9D9] font-['Listopad'] flex items-center"
                      onClick={() => setShowDropdown(false)}
                    >
                      <User size={16} className="mr-2" />
                      Профил
                    </Link>
                    <Link
                      to="/supporter"
                      className="block px-4 py-2 text-[#141204] hover:bg-[#D9D9D9] font-['Listopad'] flex items-center"
                      onClick={() => setShowDropdown(false)}
                    >
                      <Crown size={16} className="mr-2" />
                      Стани поддръжник
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-[#141204] hover:bg-[#D9D9D9] font-['Listopad'] flex items-center"
                    >
                      <LogOut size={16} className="mr-2" />
                      Изход
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link 
                to="/login" 
                className={`px-4 py-2 transition-colors font-['Listopad'] ${
                  isFontDetailPage && isScrolled
                    ? 'text-[#141204] hover:text-[#5E6572]'
                    : 'text-[#FFFFFC] hover:text-[#BCBDC0]'
                }`}
              >
                ВХОД
              </Link>
            )}
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`transition-colors ${
                isFontDetailPage && isScrolled
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
                ШРИФТОВЕ
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
                ЗА НАС
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
                      Админ панел
                    </Link>
                  )}
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-[#FFFFFC] hover:text-[#BCBDC0] text-center font-['Listopad']"
                    onClick={() => setIsOpen(false)}
                  >
                    Профил
                  </Link>
                  <Link
                    to="/supporter"
                    className="block px-4 py-2 text-[#FFFFFC] hover:text-[#BCBDC0] text-center font-['Listopad']"
                    onClick={() => setIsOpen(false)}
                  >
                    Стани поддръжник
                  </Link>
                  <button 
                    onClick={() => {
                      handleLogout();
                      setIsOpen(false);
                    }}
                    className="w-full px-4 py-2 text-[#FFFFFC] hover:text-[#BCBDC0] text-center font-['Listopad']"
                  >
                    Изход
                  </button>
                </div>
              ) : (
                <Link 
                  to="/login" 
                  className="px-4 py-2 text-[#FFFFFC] hover:text-[#BCBDC0] transition-colors text-center font-['Listopad']"
                  onClick={() => setIsOpen(false)}
                >
                  ВХОД
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