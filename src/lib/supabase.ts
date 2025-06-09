import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Test email configuration
export const testEmailConfig = async () => {
  try {
    // First verify SMTP settings are configured
    const { data: settings, error: settingsError } = await supabase
      .from('_email_settings')
      .select('*')
      .maybeSingle();

    if (settingsError) {
      console.error('Failed to fetch email settings:', settingsError);
      return false;
    }

    // Test sending a test email
    const { error: emailError } = await supabase.auth.resetPasswordForEmail(
      'test@example.com',
      {
        redirectTo: `${window.location.origin}/reset-password`,
      }
    );

    if (emailError) {
      console.error('Failed to send test email:', emailError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Email configuration test error:', error);
    return false;
  }
};

export const checkAdminRole = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return false;
  
  const { data, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .maybeSingle();
    
  if (error || !data) return false;
  return data.role === 'admin';
};

export const isAuthenticated = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return !!session;
};

export const getSession = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
};

export const onAuthStateChange = (callback: (session: any) => void) => {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
};