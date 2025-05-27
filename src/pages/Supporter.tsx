import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';

const benefits = [
  'Достъп до всички шрифтове'
];

const Supporter: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

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
    };

    getUser();
  }, [navigate]);

  const handleSubscribe = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login', { state: { from: '/supporter' } });
        return;
      }

      // Call Supabase Edge Function to create Stripe checkout session
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: session.user.id,
          email: session.user.email,
          return_url: `${window.location.origin}/profile`
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      if (!data.url) {
        throw new Error('No checkout URL received from Stripe');
      }

      window.location.href = data.url;
    } catch (err: any) {
      console.error('Checkout Error:', err);
      setError(err.message || 'Something went wrong while creating the checkout session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-16 bg-[#FFFFFC]">
      <div className="container mx-auto px-4 max-w-4xl text-center">
        <div className="flex justify-center mb-8">
          <Crown className="w-16 h-16 text-[#C40000]" />
        </div>
        
        <h1 className="text-4xl font-bold text-[#141204] mb-4 font-['Listopad']">
          Стани поддръжник
        </h1>
        
        <p className="text-xl text-[#5E6572] mb-12 max-w-2xl mx-auto font-['Listopad']">
          Подкрепете проекта и се насладете на българска кирилица във Фигма
        </p>

        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 text-red-700 rounded-sm font-['Listopad']">
            {error}
          </div>
        )}

        <div className="bg-white rounded-sm shadow-lg p-8 mb-12">
          <div className="flex items-center justify-center mb-8">
            <span className="text-4xl font-bold text-[#141204] font-['Listopad']">19 лв</span>
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
        </div>

        <p className="text-sm text-[#5E6572] max-w-lg mx-auto font-['Listopad']">
          Можете да прекратите абонамента си по всяко време. При прекратяване ще запазите достъп до услугата до края на текущия период.
        </p>
      </div>
    </div>
  );
};

export default Supporter;