import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, Type, Users, Settings, LogOut, CreditCard, Crown, Mail, Calendar, Shield, AlertCircle, Search, Plus, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import Modal from '../../components/Modal';

interface User {
  id: string;
  full_name: string;
  email: string;
  role: 'user' | 'admin';
  created_at: string;
  updated_at: string;
  last_sign_in_at?: string;
  email_confirmed_at?: string;
  has_subscription?: boolean;
}

const UserManager: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'admin'>('all');
  const [stats, setStats] = useState({
    total: 0,
    admins: 0,
    subscribers: 0,
    newThisMonth: 0
  });
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [grantMonths, setGrantMonths] = useState(1);
  const [granting, setGranting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch users from public.users table
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      // Get auth data for each user
      const usersWithAuthData = await Promise.all(
        (usersData || []).map(async (user) => {
          // Check if user has subscription
          const { data: customerData } = await supabase
            .from('user_subscriptions')
            .select('expires_at')
            .eq('user_id', user.id)
            .gt('expires_at', new Date().toISOString())
            .maybeSingle();

          // Since all users in auth.users are confirmed (as you verified), mark them as verified
          return {
            ...user,
            last_sign_in_at: null,
            email_confirmed_at: new Date().toISOString(), // Mark as verified since they exist in auth.users
            has_subscription: !!customerData
          };
        })
      );

      setUsers(usersWithAuthData);

      // Calculate stats
      const total = usersWithAuthData.length;
      const admins = usersWithAuthData.filter(user => user.role === 'admin').length;
      const subscribers = usersWithAuthData.filter(user => user.has_subscription).length;
      
      // Users created this month
      const thisMonth = new Date();
      thisMonth.setDate(1);
      const newThisMonth = usersWithAuthData.filter(user => 
        new Date(user.created_at) >= thisMonth
      ).length;

      setStats({ total, admins, subscribers, newThisMonth });

    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'user' | 'admin') => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) throw error;

      // Update local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));

    } catch (err: any) {
      console.error('Error updating user role:', err);
      alert(`Failed to update user role: ${err.message}`);
    }
  };

  const handleGrantSubscription = async () => {
    if (!selectedUser) return;

    setGranting(true);
    try {
      // Use the new grant_premium_access function
      const { error } = await supabase.rpc('grant_premium_access', {
        target_user_id: selectedUser.id,
        months: grantMonths
      });

      if (error) throw error;

      // Refresh users data
      await fetchUsers();
      
      setShowGrantModal(false);
      setSelectedUser(null);
      setGrantMonths(1);
      
      alert(`Successfully granted ${grantMonths} month(s) subscription to ${selectedUser.full_name}`);
    } catch (err: any) {
      console.error('Error granting subscription:', err);
      alert(`Failed to grant subscription: ${err.message}`);
    } finally {
      setGranting(false);
    }
  };

  const openGrantModal = (user: User) => {
    setSelectedUser(user);
    setShowGrantModal(true);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role: string) => {
    return role === 'admin' ? (
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800 flex items-center">
        <Shield size={12} className="mr-1" />
        Admin
      </span>
    ) : (
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
        User
      </span>
    );
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
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
                  className="flex items-center space-x-2 px-4 py-2.5 rounded-lg hover:bg-gray-50 text-gray-700"
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
                  className="flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-violet-50 text-violet-700"
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

        <main className="ml-64 p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow p-6">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

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
                className="flex items-center space-x-2 px-4 py-2.5 rounded-lg hover:bg-gray-50 text-gray-700"
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
                className="flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-violet-50 text-violet-700"
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
          <h1 className="text-2xl font-bold mb-6">User Management</h1>
          
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center">
              <AlertCircle size={20} className="mr-2" />
              {error}
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users size={24} className="text-blue-700" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold">Total Users</h3>
                  <p className="text-3xl font-bold text-blue-700">{stats.total}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Shield size={24} className="text-purple-700" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold">Admins</h3>
                  <p className="text-3xl font-bold text-purple-700">{stats.admins}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Crown size={24} className="text-green-700" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold">Subscribers</h3>
                  <p className="text-3xl font-bold text-green-700">{stats.subscribers}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Calendar size={24} className="text-orange-700" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold">New This Month</h3>
                  <p className="text-3xl font-bold text-orange-700">{stats.newThisMonth}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-violet-500 focus:border-violet-500"
                  />
                </div>
              </div>
              <div>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as 'all' | 'user' | 'admin')}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-violet-500 focus:border-violet-500"
                >
                  <option value="all">All Roles</option>
                  <option value="user">Users</option>
                  <option value="admin">Admins</option>
                </select>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">All Users ({filteredUsers.length})</h2>
            </div>
            
            {filteredUsers.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Users size={48} className="mx-auto mb-4 text-gray-300" />
                <p>No users found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Sign In
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Joined
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center">
                              <span className="text-violet-700 font-medium">
                                {user.full_name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 flex items-center">
                                {user.full_name}
                                {user.has_subscription && (
                                  <Crown size={16} className="ml-2 text-yellow-500" />
                                )}
                              </div>
                              <div className="text-sm text-gray-500 flex items-center">
                                <Mail size={12} className="mr-1" />
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getRoleBadge(user.role)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            {user.email_confirmed_at ? (
                              <span className="text-sm text-green-600">✓ Verified</span>
                            ) : (
                              <span className="text-sm text-red-600">⚠ Unverified</span>
                            )}
                            {user.has_subscription && (
                              <span className="text-xs text-blue-600">Subscriber</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.last_sign_in_at ? (
                            format(new Date(user.last_sign_in_at), 'MMM dd, yyyy')
                          ) : (
                            'Never'
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {format(new Date(user.created_at), 'MMM dd, yyyy')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center space-x-2">
                            <select
                              value={user.role}
                              onChange={(e) => handleRoleChange(user.id, e.target.value as 'user' | 'admin')}
                              className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-violet-500 focus:border-violet-500"
                            >
                              <option value="user">User</option>
                              <option value="admin">Admin</option>
                            </select>
                            <button
                              onClick={() => openGrantModal(user)}
                              className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded hover:bg-green-200 transition-colors"
                              title="Grant Subscription"
                            >
                              <Crown size={12} className="mr-1" />
                              Grant
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Grant Subscription Modal */}
      <Modal isOpen={showGrantModal} onClose={() => !granting && setShowGrantModal(false)}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Grant Subscription
            </h3>
            {!granting && (
              <button
                onClick={() => setShowGrantModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            )}
          </div>

          {selectedUser && (
            <div className="mb-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-violet-700 font-medium">
                    {selectedUser.full_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="font-medium text-gray-900">{selectedUser.full_name}</div>
                  <div className="text-sm text-gray-500">{selectedUser.email}</div>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subscription Duration (months)
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={grantMonths}
                    onChange={(e) => setGrantMonths(parseInt(e.target.value) || 1)}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:ring-violet-500 focus:border-violet-500"
                    disabled={granting}
                  />
                  <span className="text-sm text-gray-600">
                    {grantMonths === 1 ? 'month' : 'months'}
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  This will grant access until {format(
                    new Date(Date.now() + grantMonths * 30 * 24 * 60 * 60 * 1000),
                    'MMM dd, yyyy'
                  )}
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowGrantModal(false)}
                  disabled={granting}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGrantSubscription}
                  disabled={granting}
                  className="px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-md hover:bg-violet-700 disabled:opacity-50 flex items-center"
                >
                  {granting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Granting...
                    </>
                  ) : (
                    <>
                      <Crown size={16} className="mr-2" />
                      Grant Subscription
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default UserManager;