import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Check, ExternalLink, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';

const X_PROFILE_URL = 'https://x.com/Culturenstudio';

const benefits = [
  'Достъп до всички шрифтове',
  'Приоритетна поддръжка',
  'Ранен достъп до нови шрифтове',
  'Без реклами',
];

const Supporter: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [premiumInfo, setPremiumInfo] = useState<any>(null);
  const [pendingRequest, setPendingRequest] = useState<any>(null);
  const [xHandle, setXHandle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login', { state: { from: '/supporter' } });
        return;
      }

      // Premium status (admin-granted subscriptions)
      const { data: premiumData } = await supabase.rpc('get_user_premium_info');
      if (premiumData && premiumData.length > 0 && premiumData[0].is_active) {
        setPremiumInfo(premiumData[0]);
      }

      // Existing pending request
      const { data: requestData } = await supabase
        .from('premium_requests')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('status', 'pending')
        .maybeSingle();

      if (requestData) {
        setPendingRequest(requestData);
      }
    };

    load();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login', { state: { from: '/supporter' } });
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/request-premium`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ x_handle: xHandle }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Нещо се обърка. Опитайте отново.');
      }

      setSubmitted(true);
      setPendingRequest({ x_handle: xHandle.replace(/^@/, '') });
    } catch (err: any) {
      console.error('Premium request error:', err);
      setError(err.message || 'Нещо се обърка. Опитайте отново.');
    } finally {
      setLoading(false);
    }
  };

  const isActivePremium = !!premiumInfo;
  const expiresAt = premiumInfo?.expires_at ? new Date(premiumInfo.expires_at) : null;

  return (
    <div className="min-h-screen pt-24 pb-12 bg-[#FFFFFC]">
      <div className="container max-w-4xl text-center">
        <div className="flex justify-center mb-8">
          <Crown className="w-16 h-16 text-[#C40000]" />
        </div>

        <h1 className="text-4xl font-bold text-[#141204] mb-4 font-['Listopad']">
          {isActivePremium ? 'Активен премиум достъп' : 'Стани поддръжник'}
        </h1>

        {isActivePremium ? (
          <div className="text-xl text-[#5E6572] mb-12 max-w-2xl mx-auto font-['Listopad']">
            <p>Вашият премиум достъп е активен до {expiresAt ? format(expiresAt, 'dd.MM.yyyy') : 'N/A'}</p>
            <p className="mt-4">Благодарим ви за подкрепата!</p>
          </div>
        ) : (
          <p className="text-xl text-[#5E6572] mb-12 max-w-2xl mx-auto font-['Listopad']">
            Проектът е в безсрочна алфа версия — докато трае тя, премиум достъпът е напълно безплатен.
          </p>
        )}

        {error && (
          <div className="alert alert-error mb-8">
            {error}
          </div>
        )}

        {!isActivePremium && (
          <div className="card max-w-lg mx-auto mb-12">
            {pendingRequest || submitted ? (
              <>
                <div className="card-header">
                  <div className="flex items-center justify-center mb-4">
                    <Check className="w-8 h-8 text-[#C40000] mr-2" />
                    <span className="text-2xl font-bold text-[#141204] font-['Listopad']">Заявката е получена</span>
                  </div>
                </div>
                <div className="card-content">
                  <p className="text-[#5E6572] font-['Listopad']">
                    Получихме вашата заявка{pendingRequest?.x_handle ? ` за профил @${pendingRequest.x_handle}` : ''}.
                    След като проверим, че следвате{' '}
                    <a href={X_PROFILE_URL} target="_blank" rel="noopener noreferrer" className="text-[#C40000] underline">
                      @Culturenstudio
                    </a>
                    , ще активираме премиум достъпа ви. Обикновено отнема до 24 часа.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="card-header">
                  <div className="flex items-center justify-center mb-4">
                    <span className="text-4xl font-bold text-[#141204] font-['Listopad']">Безплатно</span>
                    <span className="text-[#5E6572] ml-2 font-['Listopad']">/ в алфа</span>
                  </div>
                </div>

                <div className="card-content">
                  <ul className="space-y-4 mb-8">
                    {benefits.map((benefit, index) => (
                      <li key={index} className="flex items-center text-[#141204] font-['Listopad']">
                        <Check className="w-5 h-5 text-[#C40000] mr-3 flex-shrink-0" />
                        {benefit}
                      </li>
                    ))}
                  </ul>

                  <div className="text-left text-[#141204] font-['Listopad'] space-y-3 mb-8">
                    <p className="font-bold">Как да получите достъп:</p>
                    <p>1. Последвайте ни в X (Twitter)</p>
                    <p>2. Въведете вашия X профил по-долу</p>
                    <p>3. Ще активираме достъпа ви след проверка</p>
                  </div>

                  <a
                    href={X_PROFILE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary btn-lg btn-full mb-4"
                  >
                    <ExternalLink className="w-5 h-5 mr-2" />
                    Последвай @Culturenstudio
                  </a>
                </div>

                <div className="card-footer">
                  <form onSubmit={handleSubmit}>
                    <input
                      type="text"
                      value={xHandle}
                      onChange={(e) => setXHandle(e.target.value)}
                      placeholder="@вашият_x_профил"
                      required
                      className="form-input w-full mb-4 text-center font-['Listopad']"
                    />
                    <button
                      type="submit"
                      disabled={loading || !xHandle.trim()}
                      className="btn btn-primary btn-lg btn-full"
                    >
                      {loading ? (
                        <>
                          <div className="spinner mr-2"></div>
                          Изпращане...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5 mr-2" />
                          Последвах — искам достъп
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        )}

        {!isActivePremium && !pendingRequest && !submitted && (
          <p className="text-sm text-[#5E6572] max-w-lg mx-auto font-['Listopad']">
            Премиум достъпът се дава за периода на алфа версията. Няма скрити такси и не се изисква карта.
          </p>
        )}
      </div>
    </div>
  );
};

export default Supporter;
