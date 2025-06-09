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
  const [rawError, setRawError] = useState<any>(null);
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
      const searchParams = new URLSearchParams(window.location.search);
      
      // Check for confirmation tokens in both hash and search params
      if (hash && hash.includes('access_token')) {
        try {
          const hashParams = new URLSearchParams(hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          const type = hashParams.get('type');

          if (type === 'signup' && accessToken && refreshToken) {
            // Redirect to email confirmation page instead of handling here
            navigate('/email-confirmed', {
              replace: true
            });
            return;
          }
        } catch (err: any) {
          console.error('Error confirming email:', err);
          setError(getAuthErrorMessage(err));
          setRawError(err);
        }
      }
      
      // Also check for confirmation in search params (alternative flow)
      const token = searchParams.get('token');
      const type = searchParams.get('type');
      
      if (token && type === 'signup') {
        // Redirect to email confirmation page
        navigate('/email-confirmed', {
          replace: true
        });
        return;
      }
    };

    handleEmailConfirmation();
  }, [navigate]);

  const handleResendConfirmation = async () => {
    if (!email) {
      setError('Please enter your email address first');
      return;
    }

    setResendingEmail(true);
    setError(null);
    setRawError(null);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/login`
        }
      });
      
      if (error) throw error;
      
      setEmailResent(true);
    } catch (err: any) {
      setError(getAuthErrorMessage(err));
      setRawError(err);
    } finally {
      setResendingEmail(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError('Please enter your email address first');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
      
      setResetSent(true);
      setError(null);
      setRawError(null);
    } catch (err: any) {
      setError(getAuthErrorMessage(err));
      setRawError(err);
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
    setRawError(null);
    setEmailResent(false);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        setError(getAuthErrorMessage(authError));
        setRawError(authError);
        return;
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', authData.user?.id)
        .maybeSingle();

      if (userError) throw userError;

      if (userData && userData.role === 'admin') {
        setShowAdminModal(true);
        return;
      }

      const from = (location.state as any)?.from || '/';
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(getAuthErrorMessage(err));
      setRawError(err);
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
  const isEmailNotConfirmedError = rawError?.code === 'email_not_confirmed' || 
    error?.toLowerCase().includes('email not confirmed') ||
    error?.toLowerCase().includes('имейлът не е потвърден');

  return (
    <div className="min-h-screen section bg-[#141204]">
      <div className="container max-w-md">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title text-center">
              {resetPassword ? 'Възстановяване на парола' : 'Вход'}
            </h2>
          </div>
          
          {message && (
            <div className="alert alert-success mb-6">
              {message}
            </div>
          )}

          {error && (
            <div className="mb-6">
              <div className={`alert ${
                isEmailNotConfirmedError 
                  ? 'alert-info' 
                  : 'alert-error'
              }`}>
                {error}
                {isEmailNotConfirmedError && (
                  <div className="mt-3 space-y-2">
                    <p className="text-sm">
                      Моля, проверете входящата си поща (включително папката със спам) за имейл за потвърждение.
                    </p>
                    <button
                      onClick={handleResendConfirmation}
                      disabled={resendingEmail || emailResent || !email}
                      className="btn btn-link text-sm"
                    >
                      {resendingEmail ? 'Изпращане...' : emailResent ? 'Имейлът е изпратен!' : 'Изпрати отново имейл за потвърждение'}
                    </button>
                    {!email && (
                      <p className="text-xs">
                        Въведете имейл адреса си по-горе, за да можете да изпратите отново потвърждението.
                      </p>
                    )}
                  </div>
                )}
              </div>
              {isInvalidCredentialsError && (
                <div className="mt-4 text-sm text-gray-600 font-['Listopad']">
                  <p>Възможни причини:</p>
                  <ul className="list-disc ml-5 mt-2 space-y-1">
                    <li>Грешно въведен имейл или парола</li>
                    <li>Все още нямате регистрация</li>
                    <li>Имейлът не е потвърден</li>
                  </ul>
                </div>
              )}
            </div>
          )}

          {emailResent && (
            <div className="alert alert-success mb-6">
              Нов имейл за потвърждение беше изпратен на {email}. Моля, проверете входящата си поща и папката със спам.
            </div>
          )}

          {resetSent && (
            <div className="alert alert-success mb-6">
              Инструкции за възстановяване на паролата бяха изпратени на {email}. Моля, проверете входящата си поща.
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="card-content space-y-6">
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Имейл
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
              
              {!resetPassword && (
                <div className="form-group">
                  <label htmlFor="password" className="form-label">
                    Парола
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>
              )}
              
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary btn-md btn-full"
              >
                {loading ? (
                  <>
                    <div className="spinner mr-2"></div>
                    Обработка...
                  </>
                ) : (
                  resetPassword ? 'Изпрати инструкции' : 'Влез'
                )}
              </button>
            </div>

            <div className="card-footer">
              <div className="text-center space-y-3">
                <div className="text-sm text-[#5E6572] font-['Listopad']">
                  {resetPassword ? (
                    <button 
                      type="button"
                      onClick={() => setResetPassword(false)}
                      className="btn btn-link"
                    >
                      Обратно към вход
                    </button>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                      <button 
                        type="button"
                        onClick={() => setResetPassword(true)}
                        className="btn btn-link"
                      >
                        Забравена парола?
                      </button>
                      <span className="hidden sm:inline text-[#5E6572]">•</span>
                      <Link to="/register" className="btn btn-link">
                        Регистрирайте се
                      </Link>
                    </div>
                  )}
                </div>
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
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <button
              onClick={() => handleAdminChoice(false)}
              className="btn btn-secondary btn-md"
            >
              Влез като потребител
            </button>
            <button
              onClick={() => handleAdminChoice(true)}
              className="btn btn-primary btn-md"
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