import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Modal from '../components/Modal';
import { getAuthErrorMessage } from '../lib/authErrorHandler';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [emailResent, setEmailResent] = useState(false);
  const [resetPassword, setResetPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const message = (location.state as any)?.message;

  // Handle email confirmation
  useEffect(() => {
    const handleEmailConfirmation = async () => {
      const hash = window.location.hash;
      if (hash && hash.includes('access_token')) {
        try {
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
            
            // Show success message and redirect
            navigate('/login', {
              replace: true,
              state: { message: 'Email confirmed successfully! You can now log in.' }
            });
          }
        } catch (err: any) {
          console.error('Error confirming email:', err);
          setError(getAuthErrorMessage(err));
        }
      }
    };

    handleEmailConfirmation();
  }, [navigate]);

  const handleResendConfirmation = async () => {
    setResendingEmail(true);
    setError(null);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: window.location.origin
        }
      });
      
      if (error) throw error;
      
      setEmailResent(true);
    } catch (err: any) {
      setError(getAuthErrorMessage(err));
    } finally {
      setResendingEmail(false);
    }
  };

  const handleResetPassword = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
      
      setResetSent(true);
      setError(null);
    } catch (err: any) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resetPassword) {
      handleResetPassword();
      return;
    }

    setLoading(true);
    setError(null);
    setEmailResent(false);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        setError(getAuthErrorMessage(authError));
        return;
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', authData.user?.id)
        .single();

      if (userError) throw userError;

      if (userData.role === 'admin') {
        setShowAdminModal(true);
        return;
      }

      const from = (location.state as any)?.from || '/';
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleAdminChoice = (goToAdmin: boolean) => {
    setShowAdminModal(false);
    if (goToAdmin) {
      navigate('/admin');
    } else {
      const from = (location.state as any)?.from || '/';
      navigate(from, { replace: true });
    }
  };

  const isInvalidCredentialsError = error?.includes('Invalid email or password');

  return (
    <div className="min-h-screen pt-32 pb-16 px-4 bg-[#141204]">
      <div className="container mx-auto max-w-md">
        <div className="bg-[#FFFFFC] rounded-sm shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6 text-[#141204] font-['Listopad']">
            {resetPassword ? 'Възстановяване на парола' : 'Вход'}
          </h2>
          
          {message && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-sm font-['Listopad']">
              {message}
            </div>
          )}

          {error && (
            <div className="mb-6">
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-sm font-['Listopad']">
                {error}
                {error.includes('not been confirmed') && (
                  <div className="mt-2">
                    <button
                      onClick={handleResendConfirmation}
                      disabled={resendingEmail || emailResent}
                      className="text-red-700 underline hover:no-underline disabled:opacity-50 font-['Listopad']"
                    >
                      {resendingEmail ? 'Изпращане...' : emailResent ? 'Имейлът е изпратен!' : 'Изпрати отново имейл за потвърждение'}
                    </button>
                  </div>
                )}
              </div>
              {isInvalidCredentialsError && (
                <div className="mt-2 text-sm text-gray-600 font-['Listopad']">
                  <p>Възможни причини:</p>
                  <ul className="list-disc ml-5 mt-1">
                    <li>Грешно въведен имейл или парола</li>
                    <li>Все още нямате регистрация</li>
                  </ul>
                </div>
              )}
            </div>
          )}

          {emailResent && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-sm font-['Listopad']">
              Нов имейл за потвърждение беше изпратен на {email}. Моля, проверете входящата си поща и папката със спам.
            </div>
          )}

          {resetSent && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-sm font-['Listopad']">
              Инструкции за възстановяване на паролата бяха изпратени на {email}. Моля, проверете входящата си поща.
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
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
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 border border-[#D9D9D9] rounded-sm focus:ring-[#141204] focus:border-[#141204]"
                required
              />
            </div>
            
            {!resetPassword && (
              <div>
                <label 
                  htmlFor="password" 
                  className="block text-sm font-medium text-[#141204] mb-1 font-['Listopad']"
                >
                  Парола
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 border border-[#D9D9D9] rounded-sm focus:ring-[#141204] focus:border-[#141204]"
                  required
                />
              </div>
            )}
            
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-[#141204] text-[#FFFFFC] rounded-sm hover:bg-[#2D2B1F] disabled:opacity-50 font-['Listopad']"
            >
              {loading ? 'Обработка...' : resetPassword ? 'Изпрати инструкции' : 'Влез'}
            </button>

            <div className="text-center space-y-2">
              <div className="text-sm text-[#5E6572] font-['Listopad']">
                {resetPassword ? (
                  <button 
                    type="button"
                    onClick={() => setResetPassword(false)}
                    className="text-[#141204] hover:text-[#2D2B1F]"
                  >
                    Обратно към вход
                  </button>
                ) : (
                  <>
                    <button 
                      type="button"
                      onClick={() => setResetPassword(true)}
                      className="text-[#141204] hover:text-[#2D2B1F]"
                    >
                      Забравена парола?
                    </button>
                    <span className="mx-2">•</span>
                    <Link to="/register" className="text-[#141204] hover:text-[#2D2B1F]">
                      Регистрирайте се
                    </Link>
                  </>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>

      <Modal isOpen={showAdminModal} onClose={() => handleAdminChoice(false)}>
        <div className="p-6">
          <h3 className="text-xl font-bold mb-4 text-[#141204] font-['Listopad']">
            Изберете начин на влизане
          </h3>
          <p className="mb-6 text-[#5E6572] font-['Listopad']">
            Как искате да продължите?
          </p>
          <div className="flex justify-end space-x-4">
            <button
              onClick={() => handleAdminChoice(false)}
              className="px-4 py-2 text-[#141204] hover:text-[#2D2B1F] font-['Listopad']"
            >
              Влез като потребител
            </button>
            <button
              onClick={() => handleAdminChoice(true)}
              className="px-4 py-2 bg-[#141204] text-[#FFFFFC] rounded-sm hover:bg-[#2D2B1F] font-['Listopad']"
            >
              Отвори админ панел
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Login;