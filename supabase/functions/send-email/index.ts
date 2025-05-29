import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { Resend } from 'npm:resend@2.1.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { type, email, data } = await req.json();

    let subject;
    let html;

    switch (type) {
      case 'confirmation':
        subject = 'Confirm your email address';
        html = `
          <h1>Confirm your email address</h1>
          <p>Hello ${data.full_name},</p>
          <p>Please confirm your email address by clicking the link below:</p>
          <p><a href="${data.confirmation_url}">Confirm Email</a></p>
        `;
        break;
      case 'recovery':
        subject = 'Reset your password';
        html = `
          <h1>Reset your password</h1>
          <p>Hello,</p>
          <p>Click the link below to reset your password:</p>
          <p><a href="${data.reset_url}">Reset Password</a></p>
        `;
        break;
      default:
        throw new Error('Invalid email type');
    }

    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'Schrift.Digital <noreply@schrift.digital>',
      to: email,
      subject,
      html
    });

    if (emailError) throw emailError;

    return new Response(JSON.stringify(emailData), {
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