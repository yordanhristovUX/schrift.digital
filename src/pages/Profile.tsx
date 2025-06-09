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
        const { data: customerData } = await supabase
          .from('stripe_customers')
          .select('customer_id')
          .eq('user_id', session.user.id);

        if (customerData?.[0]?.customer_id) {
          const { data: subscriptionData } = await supabase
            .from('stripe_subscriptions')
            .select('*')
            .eq('customer_id', customerData[0].customer_id);

          if (subscriptionData && subscriptionData.length > 0) {
            setSubscription(subscriptionData[0]);
          }
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

      // Call the delete-user edge function
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
      <div className="min-h-screen pt-32 pb-16 bg-[#FFFFFC]">
        <div className="container mx-auto px-4">
          <div className="animate-pulse">
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

  const isActiveSubscription = subscription?.status === 'active';
  const subscriptionEnd = subscription?.current_period_end 
    ? new Date(subscription.current_period_end * 1000)
    : null;

  const deleteConfirmationText = t('profile:delete_confirmation.placeholder') === 'Type DELETE' ? 'DELETE' : 'ИЗТРИЙ';

  return (
    <div className="min-h-screen pt-32 pb-16 bg-[#FFFFFC]">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="flex items-center justify-between mb-8">
          <div>
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
                className="flex items-center px-4 py-2 bg-[#141204] text-[#FFFFFC] rounded-sm hover:bg-[#2D2B1F] transition-colors font-['Listopad']"
              >
                <Crown className="w-5 h-5 mr-2" />
                {t('profile:become_supporter')}
              </button>
            )}
          </div>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-sm flex items-center ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-700' 
              : 'bg-red-50 border border-red-200 text-red-700'
          } font-['Listopad']`}>
            {message.type === 'success' && <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />}
            {message.text}
          </div>
        )}

        <div className="bg-white rounded-sm shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold mb-6 text-[#141204] font-['Listopad']">{t('profile:personal_data')}</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label 
                htmlFor="fullName" 
                className="block text-sm font-medium text-[#141204] mb-1 font-['Listopad']"
              >
                {t('profile:full_name')}
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full p-3 border border-[#D9D9D9] rounded-sm focus:ring-[#141204] focus:border-[#141204] font-['Listopad']"
                required
              />
            </div>

            <div>
              <label 
                htmlFor="email" 
                className="block text-sm font-medium text-[#141204] mb-1 font-['Listopad']"
              >
                {t('profile:email')}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                disabled
                className="w-full p-3 border border-[#D9D9D9] rounded-sm bg-gray-50 text-gray-500 font-['Listopad']"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-[#141204] text-[#FFFFFC] rounded-sm hover:bg-[#2D2B1F] disabled:opacity-50 transition-colors font-['Listopad']"
              >
                {saving ? t('profile:saving') : t('profile:save_changes')}
              </button>
            </div>
          </form>
        </div>

        {isActiveSubscription && (
          <div className="bg-white rounded-sm shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold mb-6 text-[#141204] font-['Listopad']">{t('profile:subscription')}</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-[#D9D9D9]">
                <span className="text-[#5E6572] font-['Listopad']">{t('profile:status')}</span>
                <span className="text-[#141204] font-['Listopad'] capitalize">{subscription.status}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#D9D9D9]">
                <span className="text-[#5E6572] font-['Listopad']">{t('profile:valid_until')}</span>
                <span className="text-[#141204] font-['Listopad']">
                  {subscriptionEnd ? format(subscriptionEnd, 'dd.MM.yyyy') : 'N/A'}
                </span>
              </div>
              {subscription?.payment_method_last4 && (
                <div className="flex justify-between items-center py-2 border-b border-[#D9D9D9]">
                  <span className="text-[#5E6572] font-['Listopad']">{t('profile:payment_method')}</span>
                  <span className="text-[#141204] font-['Listopad']">
                    {subscription.payment_method_brand} •••• {subscription.payment_method_last4}
                  </span>
                </div>
              )}
              {subscription?.cancel_at_period_end && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-[#5E6572] font-['Listopad']">{t('profile:cancellation')}</span>
                  <span className="text-red-600 font-['Listopad']">{t('profile:will_be_cancelled')}</span>
                </div>
              )}
            </div>
            
            <div className="mt-6 pt-6 border-t border-[#D9D9D9]">
              <button
                onClick={() => navigate('/supporter')}
                className="text-[#141204] hover:text-[#2D2B1F] font-['Listopad'] underline"
              >
                {t('profile:manage_subscription')}
              </button>
            </div>
          </div>
        )}

        {/* Danger Zone */}
        <div className="bg-white rounded-sm shadow-md p-6 border-l-4 border-red-500">
          <h2 className="text-xl font-bold mb-4 text-red-600 font-['Listopad'] flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            {t('profile:danger_zone')}
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-[#141204] font-['Listopad']">{t('profile:delete_account')}</h3>
              <p className="text-[#5E6572] font-['Listopad']">{t('profile:delete_account_description')}</p>
            </div>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-sm hover:bg-red-700 transition-colors font-['Listopad']"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {t('profile:delete_account')}
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => !deleting && setShowDeleteModal(false)}>
        <div className="p-6">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#141204] font-['Listopad']">
                {t('profile:delete_confirmation.title')}
              </h3>
              <p className="text-red-600 font-['Listopad'] font-semibold">
                {t('profile:delete_confirmation.warning')}
              </p>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-[#141204] font-['Listopad'] mb-3">
              {t('profile:delete_confirmation.consequences')}
            </p>
            <ul className="list-disc list-inside space-y-2 text-[#5E6572] font-['Listopad']">
              <li>{t('profile:delete_confirmation.data_loss')}</li>
              <li>{t('profile:delete_confirmation.subscription_loss')}</li>
              <li>{t('profile:delete_confirmation.payment_loss')}</li>
              <li>{t('profile:delete_confirmation.favorites_loss')}</li>
            </ul>
          </div>

          <div className="mb-6">
            <p className="text-[#141204] font-['Listopad'] mb-2">
              {t('profile:delete_confirmation.type_delete')}
            </p>
            <input
              type="text"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              placeholder={t('profile:delete_confirmation.placeholder')}
              className="w-full p-3 border border-[#D9D9D9] rounded-sm focus:ring-red-500 focus:border-red-500 font-['Listopad']"
              disabled={deleting}
            />
          </div>

          <div className="flex justify-end space-x-4">
            <button
              onClick={() => setShowDeleteModal(false)}
              disabled={deleting}
              className="px-4 py-2 text-[#141204] hover:text-[#2D2B1F] font-['Listopad'] disabled:opacity-50"
            >
              {t('profile:delete_confirmation.cancel')}
            </button>
            <button
              onClick={handleDeleteAccount}
              disabled={deleteConfirmation !== deleteConfirmationText || deleting}
              className="px-4 py-2 bg-red-600 text-white rounded-sm hover:bg-red-700 disabled:opacity-50 transition-colors font-['Listopad'] flex items-center"
            >
              {deleting ? (
                <>
                  <div className="animate-spin rounded-sm h-4 w-4 border-b-2 border-white mr-2"></div>
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