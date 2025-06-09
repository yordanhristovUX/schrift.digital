import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, Type, Users, Settings, LogOut, CreditCard, Crown, Calendar, DollarSign, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';

interface Subscription {
  id: string;
  customer_id: string;
  subscription_id: string;
  price_id: string;
  current_period_start: number;
  current_period_end: number;
  cancel_at_period_end: boolean;
  payment_method_brand: string;
  payment_method_last4: string;
  status: string;
  created_at: string;
  updated_at: string;
  user_email?: string;
  user_name?: string;
}

const SubscriptionManager: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    canceled: 0,
    revenue: 0
  });

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      
      // Fetch subscriptions with user data
      const { data: subscriptionsData, error: subscriptionsError } = await supabase
        .from('stripe_subscriptions')
        .select(`
          *,
          stripe_customers!inner(
            user_id,
            users!inner(
              email,
              full_name
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (subscriptionsError) throw subscriptionsError;

      // Transform the data to flatten user information
      const transformedData = subscriptionsData?.map(sub => ({
        ...sub,
        user_email: sub.stripe_customers?.users?.email,
        user_name: sub.stripe_customers?.users?.full_name
      })) || [];

      setSubscriptions(transformedData);

      // Calculate stats
      const total = transformedData.length;
      const active = transformedData.filter(sub => sub.status === 'active').length;
      const canceled = transformedData.filter(sub => sub.status === 'canceled').length;
      
      // Estimate revenue (assuming €2 per month for active subscriptions)
      const revenue = active * 2;

      setStats({ total, active, canceled, revenue });

    } catch (err: any) {
      console.error('Error fetching subscriptions:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      active: 'bg-green-100 text-green-800',
      canceled: 'bg-red-100 text-red-800',
      past_due: 'bg-yellow-100 text-yellow-800',
      incomplete: 'bg-gray-100 text-gray-800',
      trialing: 'bg-blue-100 text-blue-800'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
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
                  className="flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-violet-50 text-violet-700"
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
                className="flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-violet-50 text-violet-700"
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
          <h1 className="text-2xl font-bold mb-6">Subscription Management</h1>
          
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
                <div className="p-2 bg-violet-100 rounded-lg">
                  <CreditCard size={24} className="text-violet-700" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold">Total Subscriptions</h3>
                  <p className="text-3xl font-bold text-violet-700">{stats.total}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Crown size={24} className="text-green-700" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold">Active</h3>
                  <p className="text-3xl font-bold text-green-700">{stats.active}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertCircle size={24} className="text-red-700" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold">Canceled</h3>
                  <p className="text-3xl font-bold text-red-700">{stats.canceled}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <DollarSign size={24} className="text-blue-700" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold">Monthly Revenue</h3>
                  <p className="text-3xl font-bold text-blue-700">€{stats.revenue}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Subscriptions Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">All Subscriptions</h2>
            </div>
            
            {subscriptions.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <CreditCard size={48} className="mx-auto mb-4 text-gray-300" />
                <p>No subscriptions found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Period
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Payment Method
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {subscriptions.map((subscription) => (
                      <tr key={subscription.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {subscription.user_name || 'Unknown'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {subscription.user_email || 'No email'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getStatusBadge(subscription.status)}
                            {subscription.cancel_at_period_end && (
                              <span className="ml-2 text-xs text-orange-600">
                                (Canceling)
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {subscription.current_period_start && subscription.current_period_end ? (
                            <div className="flex items-center">
                              <Calendar size={16} className="mr-2 text-gray-400" />
                              <span>
                                {format(new Date(subscription.current_period_start * 1000), 'MMM dd')} - {' '}
                                {format(new Date(subscription.current_period_end * 1000), 'MMM dd, yyyy')}
                              </span>
                            </div>
                          ) : (
                            'N/A'
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {subscription.payment_method_brand && subscription.payment_method_last4 ? (
                            <span className="capitalize">
                              {subscription.payment_method_brand} •••• {subscription.payment_method_last4}
                            </span>
                          ) : (
                            'N/A'
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {format(new Date(subscription.created_at), 'MMM dd, yyyy')}
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
    </div>
  );
};

export default SubscriptionManager;