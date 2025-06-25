import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';

const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const handlePasswordReset = async () => {
      try {
        // Check if we have hash parameters (from email link)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        console.log('Hash params:', { accessToken: !!accessToken, refreshToken: !!refreshToken, type });

        if (accessToken && refreshToken) {
          // Set the session using the tokens from the URL
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error('Session error:', error);
            throw error;
          }

          console.log('Session set successfully:', data);

          // Clear the hash from the URL for security
          window.history.replaceState(null, '', window.location.pathname);
          
          setInitializing(false);
          return;
        }

        // If no tokens in URL, check if we already have a valid session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session check error:', sessionError);
          throw sessionError;
        }

        if (!session) {
          // No valid session and no tokens in URL
          throw new Error('No valid password reset session found');
        }

        console.log('Existing session found:', session);
        setInitializing(false);

      } catch (err: any) {
        console.error('Password reset initialization error:', err);
        
        // Handle specific error codes
        let errorMessage = t('errors:auth.unknown');
        
        if (err?.code === 'over_email_send_rate_limit') {
          errorMessage = t('errors:auth.over_email_send_rate_limit');
        } else if (err?.code === 'expired_token') {
          errorMessage = t('errors:auth.expired_token');
        } else if (err?.code === 'invalid_token') {
          errorMessage = t('errors:auth.invalid_token');
        } else if (err?.message) {
          errorMessage = err.message;
        }
        
        setError(errorMessage);
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } finally {
        setInitializing(false);
      }
    };

    handlePasswordReset();
  }, [navigate, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError(t('errors:auth.passwords_not_match'));
      return;
    }

    if (password.length < 6) {
      setError(t('errors:auth.weak_password'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Check if we have a valid session before updating password
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No valid session found. Please request a new password reset link.');
      }

      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      setSuccess(true);
      setTimeout(() => {
        navigate('/login', { 
          state: { message: 'Password updated successfully! You can now log in with your new password.' }
        });
      }, 2000);
    } catch (err: any) {
      console.error('Password update error:', err);
      
      // Handle specific error codes
      let errorMessage = t('errors:auth.unknown');
      
      if (err?.code === 'over_email_send_rate_limit') {
        errorMessage = t('errors:auth.over_email_send_rate_limit');
      } else if (err?.code === 'weak_password') {
        errorMessage = t('errors:auth.weak_password');
      } else if (err?.code === 'invalid_credentials') {
        errorMessage = t('errors:auth.invalid_credentials');
      } else if (err?.code === 'expired_token') {
        errorMessage = t('errors:auth.expired_token');
      } else if (err?.code === 'invalid_token') {
        errorMessage = t('errors:auth.invalid_token');
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (initializing) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-4 bg-[#141204]">
        <div className="container mx-auto max-w-md">
          <div className="bg-[#FFFFFC] rounded-sm shadow-lg p-8 text-center">
            <div className="animate-spin rounded-sm h-8 w-8 border-b-2 border-[#141204] mx-auto mb-4"></div>
            <p className="text-[#141204] font-['Listopad']">Initializing password reset...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 bg-[#141204]">
      <div className="container mx-auto max-w-md">
        <div className="bg-[#FFFFFC] rounded-sm shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6 text-[#141204] font-['Listopad']">
            Задаване на нова парола
          </h2>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-sm font-['Listopad']">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-sm font-['Listopad']">
              Паролата е променена успешно! Пренасочване към страницата за вход...
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label 
                htmlFor="password" 
                className="block text-sm font-medium text-[#141204] mb-1 font-['Listopad']"
              >
                Нова парола
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 border border-[#D9D9D9] rounded-sm focus:ring-[#141204] focus:border-[#141204]"
                required
                minLength={6}
                disabled={loading || !!error}
              />
            </div>

            <div>
              <label 
                htmlFor="confirmPassword" 
                className="block text-sm font-medium text-[#141204] mb-1 font-['Listopad']"
              >
                Потвърди паролата
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-3 border border-[#D9D9D9] rounded-sm focus:ring-[#141204] focus:border-[#141204]"
                required
                minLength={6}
                disabled={loading || !!error}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !!error}
              className="w-full py-3 px-4 bg-[#141204] text-[#FFFFFC] rounded-sm hover:bg-[#2D2B1F] disabled:opacity-50 font-['Listopad']"
            >
              {loading ? 'Обработка...' : 'Задай нова парола'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;