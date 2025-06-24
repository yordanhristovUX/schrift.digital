import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { User, Crown, CheckCircle, Trash2, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import Modal from '../components/Modal';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleting, setDeleting] = useState(false);
  const { t } = useTranslation(['profile']);

  // Check for success parameter from Stripe redirect
  const success = searchParams.get('success');

  useEffect(() => {
    if (success === 'true') {
      setMessage({ 
        type: 'success', 
        text: t('profile:subscription_activated')
      });
      // Remove the success parameter from URL
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('success');
      navigate({ search: newSearchParams.toString() }, { replace: true });
    }
  }, [success, searchParams, navigate, t]);

  useEffect(() => {
    const getProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate('/login');
          return;
        }

        // Get user profile
        const { data: profile, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (error) throw error;

        if (!profile) {
          console.error('User profile not found');
          navigate('/login');
          return;
        }

        // Get subscription info
        const { data: subscriptionData } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (subscriptionData) {
          setSubscription(subscriptionData);
        }

        setUser(profile);
        setFullName(profile.full_name);
        setEmail(profile.email);
      } catch (error) {
        console.error('Error loading user profile:', error);
      } finally {
        setLoading(false);
      }
    };

    getProfile();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const { error } = await supabase
        .from('users')
        .update({
          full_name: fullName,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.user.id);

      if (error) throw error;

      setMessage({ type: 'success', text: t('profile:profile_updated') });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== (t('profile:delete_confirmation.placeholder') === 'Type DELETE' ? 'DELETE' : 'ИЗТРИЙ')) {
      return;
    }

    setDeleting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      // Call the delete-user edge function - it handles all data cleanup
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: session.user.id
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete account');
      }

      // Sign out the user
      await supabase.auth.signOut();

      // Redirect to home page with a message
      navigate('/', { 
        replace: true,
        state: { message: 'Your account has been successfully deleted.' }
      });

    } catch (error: any) {
      console.error('Error deleting account:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to delete account' });
      setShowDeleteModal(false);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen section bg-[#FFFFFC]">
        <div className="container">
          <div className="loading">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="space-y-4">
              <div className="h-12 bg-gray-200 rounded"></div>
              <div className="h-12 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isActiveSubscription = subscription && new Date(subscription.expires_at) > new Date();
  const subscriptionEnd = subscription?.expires_at 
    ? new Date(subscription.expires_at)
    : null;

  const deleteConfirmationText = t('profile:delete_confirmation.placeholder') === 'Type DELETE' ? 'DELETE' : 'ИЗТРИЙ';

  return (
    <div className="min-h-screen section bg-[#FFFFFC]">
      <div className="container max-w-4xl">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div className="mb-6 md:mb-0">
            <h1 className="text-3xl font-bold text-[#141204] mb-2 font-['Listopad']">{t('profile:title')}</h1>
            <p className="text-[#5E6572] font-['Listopad']">{t('profile:subtitle')}</p>
          </div>
          <div className="flex items-center">
            {isActiveSubscription ? (
              <div className="flex items-center text-[#141204] font-['Listopad']">
                <Crown className="w-5 h-5 mr-2 text-[#C40000]" />
                {t('profile:active_subscription')}
              </div>
            ) : (
              <button
                onClick={() => navigate('/supporter')}
                className="btn btn-primary btn-md"
              >
                <Crown className="w-5 h-5 mr-2" />
                {t('profile:become_supporter')}
              </button>
            )}
          </div>
        </div>

        {/* Success/Error Messages */}
        {message && (
          <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'} flex items-center`}>
            {message.type === 'success' && <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />}
            {message.text}
          </div>
        )}

        {/* Personal Data Card */}
        <div className="card mb-8">
          <div className="card-header">
            <h2 className="card-title">{t('profile:personal_data')}</h2>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="card-content space-y-6">
              <div className="form-group">
                <label htmlFor="fullName" className="form-label">
                  {t('profile:full_name')}
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  {t('profile:email')}
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  className="form-input"
                />
              </div>
            </div>

            <div className="card-footer">
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-primary btn-md"
                >
                  {saving ? (
                    <>
                      <div className="spinner mr-2"></div>
                      {t('profile:saving')}
                    </>
                  ) : (
                    t('profile:save_changes')
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Subscription Card */}
        {isActiveSubscription && (
          <div className="card mb-8">
            <div className="card-header">
              <h2 className="card-title">{t('profile:subscription')}</h2>
            </div>
            
            <div className="card-content">
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-[#D9D9D9]">
                  <span className="text-[#5E6572] font-['Listopad']">{t('profile:status')}</span>
                  <span className="text-[#141204] font-['Listopad'] capitalize">
                    {isActiveSubscription ? 'Active' : 'Expired'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-[#D9D9D9]">
                  <span className="text-[#5E6572] font-['Listopad']">{t('profile:valid_until')}</span>
                  <span className="text-[#141204] font-['Listopad']">
                    {subscriptionEnd ? format(subscriptionEnd, 'dd.MM.yyyy') : 'N/A'}
                  </span>
                </div>
                {subscription?.granted_by && (
                  <div className="flex justify-between items-center py-3">
                    <span className="text-[#5E6572] font-['Listopad']">Granted by</span>
                    <span className="text-[#141204] font-['Listopad']">Admin</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Danger Zone */}
        <div className="card card-danger">
          <div className="card-header">
            <h2 className="card-title flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              {t('profile:danger_zone')}
            </h2>
          </div>
          
          <div className="card-content">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-[#141204] font-['Listopad'] mb-2">
                  {t('profile:delete_account')}
                </h3>
                <p className="text-[#5E6572] font-['Listopad'] leading-relaxed">
                  {t('profile:delete_account_description')}
                </p>
              </div>
              <div className="flex-shrink-0">
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="btn btn-danger btn-md"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t('profile:delete_account')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => !deleting && setShowDeleteModal(false)}>
        <div className="p-8">
          <div className="flex items-start mb-6">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#141204] font-['Listopad'] mb-1">
                {t('profile:delete_confirmation.title')}
              </h3>
              <p className="text-red-600 font-['Listopad'] font-semibold">
                {t('profile:delete_confirmation.warning')}
              </p>
            </div>
          </div>

          <div className="mb-8">
            <p className="text-[#141204] font-['Listopad'] mb-4 leading-relaxed">
              {t('profile:delete_confirmation.consequences')}
            </p>
            <ul className="list-disc list-inside space-y-2 text-[#5E6572] font-['Listopad'] pl-4">
              <li>{t('profile:delete_confirmation.data_loss')}</li>
              <li>{t('profile:delete_confirmation.subscription_loss')}</li>
              <li>{t('profile:delete_confirmation.payment_loss')}</li>
              <li>{t('profile:delete_confirmation.favorites_loss')}</li>
            </ul>
          </div>

          <div className="mb-8">
            <p className="text-[#141204] font-['Listopad'] mb-3 font-medium">
              {t('profile:delete_confirmation.type_delete')}
            </p>
            <input
              type="text"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              placeholder={t('profile:delete_confirmation.placeholder')}
              className="form-input"
              disabled={deleting}
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <button
              onClick={() => setShowDeleteModal(false)}
              disabled={deleting}
              className="btn btn-secondary btn-md"
            >
              {t('profile:delete_confirmation.cancel')}
            </button>
            <button
              onClick={handleDeleteAccount}
              disabled={deleteConfirmation !== deleteConfirmationText || deleting}
              className="btn btn-danger btn-md"
            >
              {deleting ? (
                <>
                  <div className="spinner mr-2"></div>
                  {t('profile:delete_confirmation.deleting')}
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t('profile:delete_confirmation.confirm_delete')}
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Profile;