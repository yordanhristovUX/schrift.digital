import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { User, Crown, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

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

  // Check for success parameter from Stripe redirect
  const success = searchParams.get('success');

  useEffect(() => {
    if (success === 'true') {
      setMessage({ 
        type: 'success', 
        text: 'Абонаментът е активиран успешно! Благодарим ви за подкрепата.' 
      });
      // Remove the success parameter from URL
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('success');
      navigate({ search: newSearchParams.toString() }, { replace: true });
    }
  }, [success, searchParams, navigate]);

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
          .single();

        if (error) throw error;

        // Get subscription info
        const { data: customerData } = await supabase
          .from('stripe_customers')
          .select('customer_id')
          .eq('user_id', session.user.id);

        if (customerData?.[0]?.customer_id) {
          const { data: subscriptionData } = await supabase
            .from('stripe_subscriptions')
            .select('*')
            .eq('customer_id', customerData[0].customer_id)
            .single();

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

      setMessage({ type: 'success', text: 'Профилът е обновен успешно' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSaving(false);
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

  return (
    <div className="min-h-screen pt-32 pb-16 bg-[#FFFFFC]">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#141204] mb-2 font-['Listopad']">Профил</h1>
            <p className="text-[#5E6572] font-['Listopad']">Управлявайте вашите лични данни и абонамент</p>
          </div>
          <div className="flex items-center">
            {isActiveSubscription ? (
              <div className="flex items-center text-[#141204] font-['Listopad']">
                <Crown className="w-5 h-5 mr-2 text-[#C40000]" />
                Активен абонамент
              </div>
            ) : (
              <button
                onClick={() => navigate('/supporter')}
                className="flex items-center px-4 py-2 bg-[#141204] text-[#FFFFFC] rounded-sm hover:bg-[#2D2B1F] transition-colors font-['Listopad']"
              >
                <Crown className="w-5 h-5 mr-2" />
                Стани поддръжник
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
          <h2 className="text-xl font-bold mb-6 text-[#141204] font-['Listopad']">Лични данни</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label 
                htmlFor="fullName" 
                className="block text-sm font-medium text-[#141204] mb-1 font-['Listopad']"
              >
                Име и фамилия
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
                Имейл
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
                {saving ? 'Запазване...' : 'Запази промените'}
              </button>
            </div>
          </form>
        </div>

        {isActiveSubscription && (
          <div className="bg-white rounded-sm shadow-md p-6">
            <h2 className="text-xl font-bold mb-6 text-[#141204] font-['Listopad']">Абонамент</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-[#D9D9D9]">
                <span className="text-[#5E6572] font-['Listopad']">Статус</span>
                <span className="text-[#141204] font-['Listopad'] capitalize">{subscription.status}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#D9D9D9]">
                <span className="text-[#5E6572] font-['Listopad']">Валиден до</span>
                <span className="text-[#141204] font-['Listopad']">
                  {subscriptionEnd ? format(subscriptionEnd, 'dd.MM.yyyy') : 'N/A'}
                </span>
              </div>
              {subscription?.payment_method_last4 && (
                <div className="flex justify-between items-center py-2 border-b border-[#D9D9D9]">
                  <span className="text-[#5E6572] font-['Listopad']">Метод на плащане</span>
                  <span className="text-[#141204] font-['Listopad']">
                    {subscription.payment_method_brand} •••• {subscription.payment_method_last4}
                  </span>
                </div>
              )}
              {subscription?.cancel_at_period_end && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-[#5E6572] font-['Listopad']">Прекратяване</span>
                  <span className="text-red-600 font-['Listopad']">Ще бъде прекратен в края на периода</span>
                </div>
              )}
            </div>
            
            <div className="mt-6 pt-6 border-t border-[#D9D9D9]">
              <button
                onClick={() => navigate('/supporter')}
                className="text-[#141204] hover:text-[#2D2B1F] font-['Listopad'] underline"
              >
                Управление на абонамента
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;