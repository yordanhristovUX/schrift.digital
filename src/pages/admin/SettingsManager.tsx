import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, Type, Users, Settings, LogOut, CreditCard, Database, Mail, Globe, Shield, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface SystemSettings {
  site_name: string;
  site_description: string;
  contact_email: string;
  maintenance_mode: boolean;
  registration_enabled: boolean;
  email_verification_required: boolean;
  max_fonts_per_user: number;
  stripe_public_key: string;
  stripe_webhook_secret: string;
}

const SettingsManager: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings>({
    site_name: 'Schrift.Digital',
    site_description: 'Библиотека от професионални шрифтове с българска кирилица',
    contact_email: 'contact@schrift.digital',
    maintenance_mode: false,
    registration_enabled: true,
    email_verification_required: true,
    max_fonts_per_user: 100,
    stripe_public_key: '',
    stripe_webhook_secret: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'email' | 'payments' | 'security'>('general');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      // In a real app, you would load these from a settings table
      // For now, we'll use environment variables and defaults
      setSettings({
        site_name: 'Schrift.Digital',
        site_description: 'Библиотека от професионални шрифтове с българска кирилица',
        contact_email: 'contact@schrift.digital',
        maintenance_mode: false,
        registration_enabled: true,
        email_verification_required: true,
        max_fonts_per_user: 100,
        stripe_public_key: import.meta.env.VITE_STRIPE_PUBLIC_KEY || '',
        stripe_webhook_secret: ''
      });
    } catch (err: any) {
      console.error('Error loading settings:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // In a real app, you would save these to a settings table
      // For now, we'll just simulate a save
      await new Promise(resolve => setTimeout(resolve, 1000));

      setSuccess('Settings saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error saving settings:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof SystemSettings, value: string | boolean | number) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const tabs = [
    { id: 'general', name: 'General', icon: Globe },
    { id: 'email', name: 'Email', icon: Mail },
    { id: 'payments', name: 'Payments', icon: CreditCard },
    { id: 'security', name: 'Security', icon: Shield }
  ];

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
                  className="flex items-center space-x-2 px-4 py-2.5 rounded-lg hover:bg-gray-50 text-gray-700"
                >
                  <Users size={20} />
                  <span>Users</span>
                </Link>
                <Link
                  to="/admin/settings"
                  className="flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-violet-50 text-violet-700"
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
            <div className="bg-white rounded-lg shadow p-6">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-200 rounded"></div>
                ))}
              </div>
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
                className="flex items-center space-x-2 px-4 py-2.5 rounded-lg hover:bg-gray-50 text-gray-700"
              >
                <Users size={20} />
                <span>Users</span>
              </Link>
              <Link
                to="/admin/settings"
                className="flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-violet-50 text-violet-700"
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
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">System Settings</h1>
            <button
              onClick={saveSettings}
              disabled={saving}
              className="flex items-center px-4 py-2 bg-violet-700 text-white rounded-lg hover:bg-violet-800 disabled:opacity-50"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save size={16} className="mr-2" />
              )}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
          
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center">
              <AlertCircle size={20} className="mr-2" />
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg flex items-center">
              <CheckCircle size={20} className="mr-2" />
              {success}
            </div>
          )}

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="border-b border-gray-200">
              <nav className="flex">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 ${
                        activeTab === tab.id
                          ? 'border-violet-500 text-violet-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Icon size={16} className="mr-2" />
                      {tab.name}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="p-6">
              {/* General Settings */}
              {activeTab === 'general' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Site Name
                    </label>
                    <input
                      type="text"
                      value={settings.site_name}
                      onChange={(e) => handleInputChange('site_name', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-violet-500 focus:border-violet-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Site Description
                    </label>
                    <textarea
                      value={settings.site_description}
                      onChange={(e) => handleInputChange('site_description', e.target.value)}
                      rows={3}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-violet-500 focus:border-violet-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Email
                    </label>
                    <input
                      type="email"
                      value={settings.contact_email}
                      onChange={(e) => handleInputChange('contact_email', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-violet-500 focus:border-violet-500"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="maintenance_mode"
                      checked={settings.maintenance_mode}
                      onChange={(e) => handleInputChange('maintenance_mode', e.target.checked)}
                      className="h-4 w-4 text-violet-600 focus:ring-violet-500 border-gray-300 rounded"
                    />
                    <label htmlFor="maintenance_mode" className="ml-2 block text-sm text-gray-900">
                      Enable Maintenance Mode
                    </label>
                  </div>
                </div>
              )}

              {/* Email Settings */}
              {activeTab === 'email' && (
                <div className="space-y-6">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="email_verification_required"
                      checked={settings.email_verification_required}
                      onChange={(e) => handleInputChange('email_verification_required', e.target.checked)}
                      className="h-4 w-4 text-violet-600 focus:ring-violet-500 border-gray-300 rounded"
                    />
                    <label htmlFor="email_verification_required" className="ml-2 block text-sm text-gray-900">
                      Require Email Verification
                    </label>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-blue-800 mb-2">Email Configuration</h3>
                    <p className="text-sm text-blue-700">
                      Email settings are configured through Supabase Auth. Visit your Supabase dashboard to configure SMTP settings, email templates, and authentication providers.
                    </p>
                  </div>
                </div>
              )}

              {/* Payment Settings */}
              {activeTab === 'payments' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stripe Public Key
                    </label>
                    <input
                      type="text"
                      value={settings.stripe_public_key}
                      onChange={(e) => handleInputChange('stripe_public_key', e.target.value)}
                      placeholder="pk_..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-violet-500 focus:border-violet-500"
                    />
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-yellow-800 mb-2">Stripe Configuration</h3>
                    <p className="text-sm text-yellow-700">
                      Stripe secret keys and webhook secrets are configured as environment variables for security. Update these in your deployment environment.
                    </p>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-800 mb-2">Current Environment Variables</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>STRIPE_SECRET_KEY:</span>
                        <span className="text-green-600">
                          {import.meta.env.VITE_STRIPE_SECRET_KEY ? 'Configured' : 'Not Set'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>STRIPE_WEBHOOK_SECRET:</span>
                        <span className="text-green-600">
                          {import.meta.env.VITE_STRIPE_WEBHOOK_SECRET ? 'Configured' : 'Not Set'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Settings */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="registration_enabled"
                      checked={settings.registration_enabled}
                      onChange={(e) => handleInputChange('registration_enabled', e.target.checked)}
                      className="h-4 w-4 text-violet-600 focus:ring-violet-500 border-gray-300 rounded"
                    />
                    <label htmlFor="registration_enabled" className="ml-2 block text-sm text-gray-900">
                      Allow New User Registration
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Fonts Per User
                    </label>
                    <input
                      type="number"
                      value={settings.max_fonts_per_user}
                      onChange={(e) => handleInputChange('max_fonts_per_user', parseInt(e.target.value))}
                      min="1"
                      max="1000"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-violet-500 focus:border-violet-500"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Maximum number of fonts a user can favorite or download
                    </p>
                  </div>

                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-red-800 mb-2">Security Notice</h3>
                    <p className="text-sm text-red-700">
                      Always use HTTPS in production. Ensure your Supabase RLS policies are properly configured to protect user data.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SettingsManager;