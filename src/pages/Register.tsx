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
          emailRedirectTo: `${window.location.origin}/email-confirmed`
        }
      });

      console.log('Sign up response:', { authData, signUpError });

      if (signUpError) throw signUpError;

      setConfirmationSent(true);
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (confirmationSent) {
    return (
      <div className="min-h-screen section bg-[#141204]">
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
    <div className="min-h-screen section bg-[#141204]">
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