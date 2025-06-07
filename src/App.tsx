import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import About from './pages/About';
import Login from './pages/Login';
import Register from './pages/Register';
import ResetPassword from './pages/ResetPassword';
import FontDetail from './pages/FontDetail';
import Profile from './pages/Profile';
import Supporter from './pages/Supporter';
import Dashboard from './pages/admin/Dashboard';
import FontManager from './pages/admin/FontManager';
import SubscriptionManager from './pages/admin/SubscriptionManager';
import NotFound from './pages/NotFound';
import AdminRoute from './components/AdminRoute';
import { supabase } from './lib/supabase';

// SEO component for dynamic meta tags
const SEO: React.FC<{ title?: string; description?: string }> = ({ 
  title = 'Български шрифтове с кирилица | Schrift.Digital',
  description = 'Открийте професионални български шрифтове с автентична кирилица и italic стилове. Безплатни и премиум шрифтове, оптимизирани за Figma.'
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

// Protected Route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    checkAuth();
  }, []);

  if (isAuthenticated === null) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
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
    <HelmetProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<><SEO /><Home /></>} />
            <Route path="/about" element={<><SEO title="За българската кирилица | Schrift.Digital\" description="Научете повече за мисията ни да върнем българската кирилица в съвременния дизайн с нашите професионални шрифтове." /><About /></>} />
            <Route path="/login" element={<><SEO title="Вход | Български шрифтове с кирилица\" description="Влезте в профила си за достъп до всички български шрифтове с кирилица." /><Login /></>} />
            <Route path="/register" element={<><SEO title="Регистрация | Български шрифтове с кирилица\" description="Създайте профил за достъп до всички български шрифтове с кирилица и italic стилове." /><Register /></>} />
            <Route path="/reset-password" element={<><SEO title="Възстановяване на парола | Български шрифтове с кирилица\" description="Задайте нова парола за вашия профил." /><ResetPassword /></>} />
            <Route path="/fonts/:id" element={<FontDetail />} />
            <Route path="/profile" element={<ProtectedRoute><SEO title="Профил | Български шрифтове с кирилица\" description="Управлявайте профила си и достъпа до български шрифтове с кирилица." /><Profile /></ProtectedRoute>} />
            <Route path="/supporter" element={<ProtectedRoute><SEO title="Поддръжник | Български шрифтове с кирилица\" description="Подкрепете проекта и получете достъп до всички премиум български шрифтове с кирилица." /><Supporter /></ProtectedRoute>} />
            <Route path="/admin" element={<AdminRoute><Dashboard /></AdminRoute>} />
            <Route path="/admin/fonts" element={<AdminRoute><FontManager /></AdminRoute>} />
            <Route path="/admin/subscriptions" element={<AdminRoute><SubscriptionManager /></AdminRoute>} />
            <Route path="*" element={<><SEO title="404 | Български шрифтове с кирилица\" description="Страницата не беше намерена." /><NotFound /></>} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </HelmetProvider>
  );
}

export default App;