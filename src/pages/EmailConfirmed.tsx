import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

const EmailConfirmed: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRedirect, setAutoRedirect] = useState(false);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // Check if email confirmation is actually required
        const { data: { session } } = await supabase.auth.getSession();
        
        // If user is already logged in, they don't need confirmation
        if (session) {
          console.log('User already has active session, skipping confirmation');
          setLoading(false);
          return;
        }
        
        const hash = window.location.hash;
        
        if (hash && hash.includes('access_token')) {
          const hashParams = new URLSearchParams(hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          const type = hashParams.get('type');

          if (type === 'signup' && accessToken && refreshToken) {
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (error) throw error;

            // Clear the hash from the URL
            window.history.replaceState(null, '', window.location.pathname);
            
            setLoading(false);
            return;
          }
        }

        // Also check for confirmation in search params (alternative flow)
        const token = searchParams.get('token');
        const type = searchParams.get('type');
        
        if (token && type === 'signup') {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'signup'
          });

          if (error) throw error;

          // Clear the search params from the URL
          window.history.replaceState(null, '', window.location.pathname);
          
          setLoading(false);
          return;
        }

        // If we get here, check if the user just registered successfully
        // and email confirmation might be disabled
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user && user.email_confirmed_at) {
          console.log('User email already confirmed');
          setLoading(false);
          return;
        }
        
        // If no valid confirmation token and no confirmed user, show error
        throw new Error('No valid confirmation token found');

      } catch (err: any) {
        console.error('Error confirming email:', err);
        setError(err.message || 'Failed to confirm email');
        setLoading(false);
      }
    };

    handleEmailConfirmation();
  }, [searchParams]);

  useEffect(() => {
    if (!loading && !error) {
      // Start countdown after confirmation is successful
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setAutoRedirect(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [loading, error]);

  useEffect(() => {
    if (autoRedirect) {
      navigate('/', { replace: true });
    }
  }, [autoRedirect, navigate]);

  const handleProceed = () => {
    navigate('/', { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-12 bg-[#141204]">
        <div className="container mx-auto max-w-md">
          <div className="bg-[#FFFFFC] rounded-sm shadow-lg p-8 text-center">
            <div className="animate-spin rounded-sm h-8 w-8 border-b-2 border-[#141204] mx-auto mb-4"></div>
            <p className="text-[#141204] font-['Listopad']">Потвърждаване на имейла...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pt-24 pb-12 bg-[#141204]">
        <div className="container mx-auto max-w-md">
          <div className="bg-[#FFFFFC] rounded-sm shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-4 text-[#141204] font-['Listopad']">
              Грешка при потвърждаване
            </h2>
            <p className="text-[#5E6572] mb-6 font-['Listopad']">
              {error}
            </p>
            <button
              onClick={() => navigate('/login')}
              className="w-full py-3 px-4 bg-[#141204] text-[#FFFFFC] rounded-sm hover:bg-[#2D2B1F] transition-colors font-['Listopad']"
            >
              Обратно към вход
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 bg-[#141204]">
      <div className="container mx-auto max-w-md">
        <div className="bg-[#FFFFFC] rounded-sm shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          
          <h2 className="text-2xl font-bold mb-4 text-[#141204] font-['Listopad']">
            Имейлът е потвърден успешно!
          </h2>
          
          <p className="text-[#5E6572] mb-8 font-['Listopad']">
            Добре дошли в Schrift.Digital! Вашият акаунт е активиран и можете да започнете да използвате всички функции на платформата.
          </p>

          <div className="space-y-4">
            <button
              onClick={handleProceed}
              className="w-full py-3 px-4 bg-[#141204] text-[#FFFFFC] rounded-sm hover:bg-[#2D2B1F] transition-colors font-['Listopad'] flex items-center justify-center"
            >
              Влез в Schrift.Digital
              <ArrowRight className="w-5 h-5 ml-2" />
            </button>
            
            <p className="text-sm text-[#5E6572] font-['Listopad']">
              Автоматично пренасочване след {countdown} секунди...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailConfirmed;