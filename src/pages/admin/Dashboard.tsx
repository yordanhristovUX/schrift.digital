import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Type, Users, Settings, LogOut, CreditCard } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface DashboardStats {
  totalFonts: number;
  totalUsers: number;
  totalDownloads: number;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalFonts: 0,
    totalUsers: 0,
    totalDownloads: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      // Get total fonts
      const { count: fontsCount } = await supabase
        .from('fonts')
        .select('*', { count: 'exact', head: true });

      // Get total users
      const { count: usersCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      // Get total downloads (sum of downloads column from fonts table)
      const { data: downloadsData } = await supabase
        .from('fonts')
        .select('downloads')
        .gt('downloads', 0);

      const totalDownloads = downloadsData?.reduce((sum, font) => sum + (font.downloads || 0), 0) || 0;

      setStats({
        totalFonts: fontsCount || 0,
        totalUsers: usersCount || 0,
        totalDownloads: totalDownloads
      });
    };

    fetchStats();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Sidebar */}
      <aside className="fixed top-0 left-0 w-64 h-screen bg-white shadow-md z-30">
        <div className="flex flex-col h-full">
          <div className="p-6 border-b">
            <div className="flex items-center">
              <Type size={24} className="text-violet-700 mr-3" />
              <h1 className="text-xl font-bold">Admin Panel</h1>
            </div>
          </div>
          
          <nav className="flex-1 p-4">
            <div className="space-y-2">
              <Link
                to="/admin"
                className="flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-violet-50 text-violet-700"
              >
                <LayoutDashboard size={20} />
                <span>Dashboard</span>
              </Link>
              <Link
                to="/admin/fonts"
                className="flex items-center space-x-2 px-4 py-2.5 rounded-lg hover:bg-gray-50 text-gray-700"
              >
                <Type size={20} />
                <span>Fonts</span>
              </Link>
              <Link
                to="/admin/subscriptions"
                className="flex items-center space-x-2 px-4 py-2.5 rounded-lg hover:bg-gray-50 text-gray-700"
              >
                <CreditCard size={20} />
                <span>Subscriptions</span>
              </Link>
              <Link
                to="/admin/users"
                className="flex items-center space-x-2 px-4 py-2.5 rounded-lg hover:bg-gray-50 text-gray-700"
              >
                <Users size={20} />
                <span>Users</span>
              </Link>
              <Link
                to="/admin/settings"
                className="flex items-center space-x-2 px-4 py-2.5 rounded-lg hover:bg-gray-50 text-gray-700"
              >
                <Settings size={20} />
                <span>Settings</span>
              </Link>
            </div>
          </nav>

          <div className="p-4 border-t">
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-lg hover:bg-red-50 text-red-600 w-full"
            >
              <LogOut size={20} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Dashboard Overview</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-2">Total Fonts</h3>
              <p className="text-3xl font-bold text-violet-700">{stats.totalFonts}</p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-2">Total Users</h3>
              <p className="text-3xl font-bold text-violet-700">{stats.totalUsers}</p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-2">Total Downloads</h3>
              <p className="text-3xl font-bold text-violet-700">{stats.totalDownloads}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
              <div className="text-gray-500 text-center py-8">
                No recent activity to display
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;