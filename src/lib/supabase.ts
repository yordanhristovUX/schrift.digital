import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6dmVjYWZicWVzcmd6aGNxYWxxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODAxOTg1OSwiZXhwIjoyMDYzNTk1ODU5fQ.ofaBbe_VCiFaLaA9EIdZgYZeKtldhsHNsd7Kvyv62KY';

if (!supabaseUrl) {
  throw new Error('Missing Supabase URL environment variable');
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
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

export const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .single();
      
    if (error) throw error;
    console.log('Supabase connection successful');
    return true;
  } catch (error) {
    console.error('Supabase connection error:', error);
    return false;
  }
};