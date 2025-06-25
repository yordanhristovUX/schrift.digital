import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen pt-24 pb-12 bg-[#FFFFFC]">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-8xl font-bold text-[#141204] mb-6 font-['Listopad']">404</h1>
        <p className="text-2xl text-[#5E6572] mb-8 font-['Listopad']">
          Страницата не беше намерена
        </p>
        <Link 
          to="/"
          className="inline-flex items-center px-6 py-3 bg-[#141204] text-[#FFFFFC] rounded-sm hover:bg-[#2D2B1F] transition-colors font-['Listopad']"
        >
          <Home size={20} className="mr-2" />
          Към началната страница
        </Link>
      </div>
    </div>
  );
}

export default NotFound;