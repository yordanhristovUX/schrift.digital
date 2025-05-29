import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from 'npm:resend@2.1.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'Schrift.Digital <noreply@schrift.digital>',
      to: 'test@example.com',
      subject: 'Test Email',
      html: `
        <h1>Test Email</h1>
        <p>This is a test email from Schrift.Digital.</p>
        <p>If you received this, email sending is working correctly!</p>
      `
    });

    if (error) throw error;

    return new Response(JSON.stringify(data), {
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