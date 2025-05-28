import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import About from './pages/About';
import Login from './pages/Login';
import Register from './pages/Register';
import FontDetail from './pages/FontDetail';
import Profile from './pages/Profile';
import Supporter from './pages/Supporter';
import Dashboard from './pages/admin/Dashboard';
import FontManager from './pages/admin/FontManager';
import NotFound from './pages/NotFound';
import AdminRoute from './components/AdminRoute';
import { supabase } from './lib/supabase';

// SEO component for dynamic meta tags
const SEO: React.FC<{ title?: string; description?: string }> = ({ 
  title = 'Schrift.Digital | Културен шрифт',
  description = 'Открийте красиви български шрифтове с автентична кирилица. Безплатни и премиум шрифтове, оптимизирани за Figma с поддръжка на български букви.'
}) => {
  const location = useLocation();
  const canonicalUrl = `https://schrift.digital${location.pathname}`;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
    </Helmet>
  );
};

// Wrapper component to conditionally render navbar and footer
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  if (isAdminRoute) {
    return <div lang="bg">{children}</div>;
  }

  return (
    <div className="flex flex-col min-h-screen" lang="bg">
      <Navbar />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  );
};

function App() {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <BrowserRouter future={{ v7_relativeSplatPath: true }}>
      <Layout>
        <Routes>
          <Route path="/" element={<><SEO /><Home /></>} />
          <Route path="/about" element={<><SEO title="За нас | Schrift.Digital\" description="Научете повече за мисията ни да върнем българската кирилица в съвременния дизайн." /><About /></>} />
          <Route path="/login" element={<><SEO title="Вход | Schrift.Digital\" description="Влезте в профила си за достъп до всички шрифтове." /><Login /></>} />
          <Route path="/register" element={<><SEO title="Регистрация | Schrift.Digital\" description="Създайте профил за достъп до всички шрифтове." /><Register /></>} />
          <Route path="/fonts/:id" element={<FontDetail />} />
          <Route path="/profile" element={<><SEO title="Профил | Schrift.Digital\" description="Управлявайте профила си и абонамента си." /><Profile /></>} />
          <Route path="/supporter" element={<><SEO title="Стани поддръжник | Schrift.Digital\" description="Подкрепете проекта и получете достъп до всички премиум шрифтове." /><Supporter /></>} />
          <Route path="/admin" element={<AdminRoute><Dashboard /></AdminRoute>} />
          <Route path="/admin/fonts" element={<AdminRoute><FontManager /></AdminRoute>} />
          <Route path="*" element={<><SEO title="404 | Schrift.Digital\" description="Страницата не беше намерена." /><NotFound /></>} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;