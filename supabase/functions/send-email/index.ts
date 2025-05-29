import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.39.3';
import { Resend } from 'npm:resend@2.1.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  try {
    const { type, email, data } = await req.json();

    let template;
    let subject;

    switch (type) {
      case 'confirmation':
        template = 'confirmation';
        subject = 'Confirm your email address';
        break;
      case 'recovery':
        template = 'recovery';
        subject = 'Reset your password';
        break;
      case 'magic-link':
        template = 'magic-link';
        subject = 'Your magic link';
        break;
      default:
        throw new Error('Invalid email type');
    }

    const { error: templateError, data: templateData } = await supabase
      .storage
      .from('email-templates')
      .download(`${template}.html`);

    if (templateError) {
      throw templateError;
    }

    const templateContent = await templateData.text();
    const htmlContent = templateContent.replace(/\${([^}]+)}/g, (_, key) => data[key] || '');

    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'Schrift.Digital <noreply@schrift.digital>',
      to: email,
      subject: subject,
      html: htmlContent
    });

    if (emailError) {
      throw emailError;
    }

    return new Response(JSON.stringify(emailData), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400
    });
  }
});