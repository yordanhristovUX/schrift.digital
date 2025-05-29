import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

console.log('Initializing Supabase client with URL:', supabaseUrl);

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
    // Test auth settings by attempting to send a password reset email
    const { error } = await supabase.auth.resetPasswordForEmail(
      'test@example.com',
      {
        redirectTo: `${window.location.origin}/reset-password`,
      }
    );

    if (error) {
      console.error('Email configuration test failed:', error);
      return false;
    }

    console.log('Email configuration test successful');
    return true;
  } catch (error) {
    console.error('Email configuration test error:', error);
    return false;
  }
};

export const testConnection = async () => {
  try {
    console.log('Testing Supabase connection...');
    
    // First test basic connection
    const { data: fontsData, error: fontsError } = await supabase
      .from('fonts')
      .select('count')
      .single();
      
    if (fontsError) {
      console.error('Fonts query error:', fontsError);
      throw fontsError;
    }

    console.log('Fonts count:', fontsData);

    // Test featured fonts query
    const { data: featuredData, error: featuredError } = await supabase
      .from('fonts')
      .select('*')
      .eq('featured', true)
      .limit(3);

    if (featuredError) {
      console.error('Featured fonts query error:', featuredError);
      throw featuredError;
    }

    console.log('Featured fonts:', featuredData);
    
    // Test email configuration
    const emailConfigWorking = await testEmailConfig();
    console.log('Email configuration working:', emailConfigWorking);
    
    return true;
  } catch (error) {
    console.error('Supabase connection test failed:', error);
    return false;
  }
};

// Test connection immediately
testConnection().then(success => {
  console.log('Connection test result:', success);
});

export const checkAdminRole = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return false;
  
  const { data, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single();
    
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