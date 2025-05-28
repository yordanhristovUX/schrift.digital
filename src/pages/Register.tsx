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
  const navigate = useNavigate();
  const { t } = useTranslation(['auth', 'errors']);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Sign up the user with Supabase Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          },
          emailRedirectTo: window.location.origin
        }
      });

      if (signUpError) throw signUpError;

      if (!authData.user?.id) {
        throw new Error('Failed to create user account');
      }

      // Create user profile in the users table
      const { error: profileError } = await supabase
        .from('users')
        .insert([
          {
            id: authData.user.id,
            email: email.toLowerCase(),
            full_name: fullName,
            role: 'user'
          }
        ]);

      if (profileError) {
        console.error('Failed to create user profile:', profileError);
        throw new Error('Failed to complete registration');
      }

      // Redirect to login with success message
      navigate('/login', { 
        replace: true,
        state: { 
          message: t('auth:register.success_message')
        }
      });
    } catch (err: any) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-16 px-4 bg-[#141204]">
      <div className="container mx-auto max-w-md">
        <div className="bg-[#FFFFFC] rounded-sm shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6 text-[#141204] font-['Listopad']">
            {t('auth:register.title')}
          </h2>
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-sm font-['Listopad']">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label 
                htmlFor="fullName" 
                className="block text-sm font-medium text-[#141204] mb-1 font-['Listopad']"
              >
                {t('auth:register.fullName')}
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full p-3 border border-[#D9D9D9] rounded-sm focus:ring-[#141204] focus:border-[#141204]"
                required
              />
            </div>

            <div>
              <label 
                htmlFor="email" 
                className="block text-sm font-medium text-[#141204] mb-1 font-['Listopad']"
              >
                {t('auth:register.email')}
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
            
            <div>
              <label 
                htmlFor="password" 
                className="block text-sm font-medium text-[#141204] mb-1 font-['Listopad']"
              >
                {t('auth:register.password')}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 border border-[#D9D9D9] rounded-sm focus:ring-[#141204] focus:border-[#141204]"
                required
                minLength={6}
              />
              <p className="mt-1 text-sm text-[#5E6572] font-['Listopad']">
                {t('auth:register.minLength')}
              </p>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-[#141204] text-[#FFFFFC] rounded-sm hover:bg-[#2D2B1F] disabled:opacity-50 font-['Listopad']"
            >
              {loading ? t('auth:register.processing') : t('auth:register.submit')}
            </button>

            <div className="text-center text-sm text-[#5E6572] font-['Listopad']">
              {t('auth:register.hasAccount')}{' '}
              <Link to="/login" className="text-[#141204] hover:text-[#2D2B1F]">
                {t('auth:register.login')}
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;