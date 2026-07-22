import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { getAuthErrorMessage } from '../lib/authErrorHandler';

const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [resendingReset, setResendingReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation(['auth', 'errors']);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      console.log('Starting registration process...');

      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          },
          emailRedirectTo: `${window.location.origin}/email-confirmed`,
          // Add this to handle cases where email confirmation might be disabled
          captchaToken: undefined
        }
      });

      console.log('Sign up response:', { authData, signUpError });

      if (signUpError) throw signUpError;

      // Check if the user is immediately confirmed (email confirmation disabled)
      if (authData.user && authData.session) {
        console.log('User immediately confirmed, redirecting to home');
        navigate('/', { replace: true });
      } else if (authData.user && (!authData.user.identities || authData.user.identities.length === 0)) {
        // Supabase returns a 200 with an obfuscated user (empty identities) instead of an
        // error when the email is already registered + confirmed, to prevent account
        // enumeration. This is the documented way to detect that case client-side.
        console.log('Email already registered');
        setAlreadyRegistered(true);
      } else {
        console.log('Email confirmation required');
        setConfirmationSent(true);
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResendReset = async () => {
    setResendingReset(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setResetSent(true);
    } catch (err: any) {
      setError(getAuthErrorMessage(err));
    } finally {
      setResendingReset(false);
    }
  };

  if (alreadyRegistered) {
    return (
      <div className="min-h-screen pt-24 pb-12 bg-[#141204]">
        <div className="container max-w-md">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title text-center">
                {t('auth:register.alreadyRegisteredTitle')}
              </h2>
            </div>
            <div className="card-content">
              <p className="text-[#5E6572] mb-6 font-['Listopad'] text-center">
                {t('auth:register.alreadyRegisteredMessage', { email })}
              </p>

              {resetSent ? (
                <p className="text-[#5E6572] font-['Listopad'] text-center">
                  {t('auth:login.resetInstructionsSent', { email })}
                </p>
              ) : (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                  <Link to="/login" className="btn btn-primary btn-md">
                    {t('auth:register.login')}
                  </Link>
                  <button
                    type="button"
                    onClick={handleResendReset}
                    disabled={resendingReset}
                    className="btn btn-link"
                  >
                    {resendingReset ? t('auth:login.sending') : t('auth:login.forgotPassword')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (confirmationSent) {
    return (
      <div className="min-h-screen pt-24 pb-12 bg-[#141204]">
        <div className="container max-w-md">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title text-center">
                {t('auth:register.confirmation_sent')}
              </h2>
            </div>
            <div className="card-content">
              <p className="text-[#5E6572] mb-6 font-['Listopad'] text-center">
                {t('auth:register.check_email', { email })}
              </p>
              <p className="text-[#5E6572] font-['Listopad'] text-center">
                {t('auth:register.spam_notice')}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 bg-[#141204]">
      <div className="container max-w-md">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title text-center">
              {t('auth:register.title')}
            </h2>
          </div>
          
          {error && (
            <div className="alert alert-error mb-6">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="card-content space-y-6">
              <div className="form-group">
                <label htmlFor="fullName" className="form-label">
                  {t('auth:register.fullName')}
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
                  {t('auth:register.email')}
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
              
              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  {t('auth:register.password')}
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                  required
                  minLength={6}
                />
                <p className="form-help">
                  {t('auth:register.minLength')}
                </p>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary btn-md btn-full"
              >
                {loading ? (
                  <>
                    <div className="spinner mr-2"></div>
                    {t('auth:register.processing')}
                  </>
                ) : (
                  t('auth:register.submit')
                )}
              </button>
            </div>

            <div className="card-footer">
              <div className="text-center text-sm text-[#5E6572] font-['Listopad']">
                {t('auth:register.hasAccount')}{' '}
                <Link to="/login" className="btn btn-link">
                  {t('auth:register.login')}
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;