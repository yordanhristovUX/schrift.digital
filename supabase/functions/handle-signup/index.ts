import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { record } = await req.json();

    if (!record?.id || !record?.email) {
      throw new Error('Missing user data');
    }

    // Insert into public.users table
    const { error: insertError } = await supabase
      .from('users')
      .insert([
        {
          id: record.id,
          email: record.email,
          full_name: record.raw_user_meta_data?.full_name || '',
          role: 'user'
        }
      ]);

    if (insertError) throw insertError;

    return new Response(JSON.stringify({ message: 'User created successfully' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    });
  }
});