import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // First check if the email is already registered
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (existingUser) {
        setError('An account with this email already exists');
        return;
      }

      // Sign up the user with Supabase Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
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
            email,
            full_name: fullName,
            role: 'user'
          }
        ]);

      if (profileError) {
        // If profile creation fails, we should clean up the auth user
        await supabase.auth.admin.deleteUser(authData.user.id);
        throw profileError;
      }

      // Redirect to login with success message
      navigate('/login', { 
        replace: true,
        state: { 
          message: 'Registration successful! Please check your email to confirm your account.' 
        }
      });
    } catch (err: any) {
      setError(err.message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-16 px-4 bg-[#141204]">
      <div className="container mx-auto max-w-md">
        <div className="bg-[#FFFFFC] rounded-sm shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6 text-[#141204] font-['Listopad']">Регистрация</h2>
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label 
                htmlFor="fullName" 
                className="block text-sm font-medium text-[#141204] mb-1 font-['Listopad']"
              >
                Име и фамилия
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
                minLength={6}
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-[#141204] text-[#FFFFFC] rounded-sm hover:bg-[#2D2B1F] disabled:opacity-50 font-['Listopad']"
            >
              {loading ? 'Регистрация...' : 'Регистрирай се'}
            </button>

            <div className="text-center text-sm text-[#5E6572] font-['Listopad']">
              Вече имате акаунт?{' '}
              <Link to="/login" className="text-[#141204] hover:text-[#2D2B1F]">
                Влезте тук
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;