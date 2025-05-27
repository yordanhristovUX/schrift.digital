import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { checkAdminRole } from '../lib/supabase';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const location = useLocation();

  useEffect(() => {
    const checkAdmin = async () => {
      const isAdminUser = await checkAdminRole();
      setIsAdmin(isAdminUser);
    };
    checkAdmin();
  }, []);

  if (isAdmin === null) {
    return <div>Loading...</div>;
  }

  if (!isAdmin) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;