import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Check, Settings } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { PRODUCTS } from '../stripe-config';
import { createCheckoutSession, manageSubscription, getPrice, formatPrice } from '../lib/stripe';
import { format } from 'date-fns';

const benefits = [
  'Достъп до всички шрифтове',
  'Приоритетна поддръжка',
  'Ранен достъп до нови шрифтове',
  'Без реклами',
];

const Supporter: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [priceData, setPriceData] = useState<any>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login', { state: { from: '/supporter' } });
        return;
      }

      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      setUser(profile);

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
    };

    const fetchPrice = async () => {
      try {
        const data = await getPrice(PRODUCTS.PREMIUM.priceId);
        setPriceData(data);
      } catch (err) {
        console.error('Error fetching price:', err);
        // Fallback price data
        setPriceData({
          unit_amount: 200, // 2.00 EUR in cents
          currency: 'eur',
        });
      }
    };

    getUser();
    fetchPrice();
  }, [navigate]);

  const handleSubscribe = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const checkoutUrl = await createCheckoutSession({
        priceId: PRODUCTS.PREMIUM.priceId,
        successUrl: `${window.location.origin}/profile?success=true`,
        cancelUrl: `${window.location.origin}/supporter`,
        mode: 'subscription',
      });

      window.location.href = checkoutUrl;
    } catch (err: any) {
      console.error('Checkout Error:', err);
      setError(err.message || 'Something went wrong while creating the checkout session');
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setLoading(true);
    setError(null);

    try {
      const portalUrl = await manageSubscription({
        action: 'portal',
        returnUrl: `${window.location.origin}/profile`,
      });

      window.location.href = portalUrl;
    } catch (err: any) {
      console.error('Portal Error:', err);
      setError(err.message || 'Something went wrong while opening the customer portal');
    } finally {
      setLoading(false);
    }
  };

  const isActiveSubscription = subscription?.status === 'active';
  const subscriptionEnd = subscription?.current_period_end 
    ? new Date(subscription.current_period_end * 1000)
    : null;

  const displayPrice = priceData ? formatPrice(priceData.unit_amount, priceData.currency) : '€2.00';

  return (
    <div className="min-h-screen pt-32 pb-16 bg-[#FFFFFC]">
      <div className="container mx-auto px-4 max-w-4xl text-center">
        <div className="flex justify-center mb-8">
          <Crown className="w-16 h-16 text-[#C40000]" />
        </div>
        
        <h1 className="text-4xl font-bold text-[#141204] mb-4 font-['Listopad']">
          {isActiveSubscription ? 'Активен абонамент' : 'Стани поддръжник'}
        </h1>
        
        {isActiveSubscription ? (
          <div className="text-xl text-[#5E6572] mb-12 max-w-2xl mx-auto font-['Listopad']">
            <p>Вашият абонамент е активен до {subscriptionEnd ? format(subscriptionEnd, 'dd.MM.yyyy') : 'N/A'}</p>
            <p className="mt-4">Благодарим ви за подкрепата!</p>
          </div>
        ) : (
          <p className="text-xl text-[#5E6572] mb-12 max-w-2xl mx-auto font-['Listopad']">
            Подкрепете проекта и се насладете на българска кирилица във Фигма
          </p>
        )}

        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 text-red-700 rounded-sm font-['Listopad']">
            {error}
          </div>
        )}

        <div className="bg-white rounded-sm shadow-lg p-8 mb-12">
          {!isActiveSubscription ? (
            <>
              <div className="flex items-center justify-center mb-8">
                <span className="text-4xl font-bold text-[#141204] font-['Listopad']">{displayPrice}</span>
                <span className="text-[#5E6572] ml-2 font-['Listopad']">/ месец</span>
              </div>

              <ul className="space-y-4 mb-8">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-center text-[#141204] font-['Listopad']">
                    <Check className="w-5 h-5 text-[#C40000] mr-3 flex-shrink-0" />
                    {benefit}
                  </li>
                ))}
              </ul>

              <button
                onClick={handleSubscribe}
                disabled={loading}
                className="w-full py-3 px-6 bg-[#141204] text-[#FFFFFC] rounded-sm hover:bg-[#2D2B1F] disabled:opacity-50 transition-colors font-['Listopad']"
              >
                {loading ? 'Обработка...' : 'Абонирай се сега'}
              </button>
            </>
          ) : (
            <>
              <div className="mb-8">
                <div className="flex items-center justify-center mb-4">
                  <Crown className="w-8 h-8 text-[#C40000] mr-2" />
                  <span className="text-2xl font-bold text-[#141204] font-['Listopad']">Премиум абонамент</span>
                </div>
                <p className="text-[#5E6572] font-['Listopad']">
                  Активен до {subscriptionEnd ? format(subscriptionEnd, 'dd.MM.yyyy') : 'N/A'}
                </p>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center py-2 border-b border-[#D9D9D9]">
                  <span className="text-[#5E6572] font-['Listopad']">Статус</span>
                  <span className="text-[#141204] font-['Listopad'] capitalize">{subscription.status}</span>
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

              <button
                onClick={handleManageSubscription}
                disabled={loading}
                className="flex items-center justify-center w-full py-3 px-6 bg-[#141204] text-[#FFFFFC] rounded-sm hover:bg-[#2D2B1F] disabled:opacity-50 transition-colors font-['Listopad']"
              >
                <Settings className="w-5 h-5 mr-2" />
                {loading ? 'Обработка...' : 'Управление на абонамента'}
              </button>
            </>
          )}
        </div>

        {!isActiveSubscription && (
          <p className="text-sm text-[#5E6572] max-w-lg mx-auto font-['Listopad']">
            Можете да прекратите абонамента си по всяко време. При прекратяване ще запазите достъп до услугата до края на текущия период.
          </p>
        )}
      </div>
    </div>
  );
};

export default Supporter;