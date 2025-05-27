import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
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
import AdminRoute from './components/AdminRoute';
import { supabase } from './lib/supabase';

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
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/fonts/:id" element={<FontDetail />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/supporter" element={<Supporter />} />
          <Route path="/admin" element={<AdminRoute><Dashboard /></AdminRoute>} />
          <Route path="/admin/fonts" element={<AdminRoute><FontManager /></AdminRoute>} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;