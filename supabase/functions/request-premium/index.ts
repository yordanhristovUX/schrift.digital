import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const ADMIN_NOTIFY_EMAIL = 'yhristov.xyz@gmail.com';

function jsonResponse(body: object, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Identify the calling user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ error: 'No authorization header' }, 401);
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return jsonResponse({ error: 'Invalid token' }, 401);
    }

    const { x_handle } = await req.json();
    const handle = (x_handle || '').toString().trim().replace(/^@/, '');

    if (!/^[A-Za-z0-9_]{1,15}$/.test(handle)) {
      return jsonResponse({ error: 'Invalid X handle' }, 400);
    }

    // Record the request (one pending request per user, enforced by unique index)
    const { error: insertError } = await supabase
      .from('premium_requests')
      .insert({ user_id: user.id, x_handle: handle });

    if (insertError) {
      if (insertError.code === '23505') {
        return jsonResponse({ success: true, already_pending: true });
      }
      console.error('Failed to save premium request:', insertError);
      return jsonResponse({ error: 'Failed to save request' }, 500);
    }

    // Notify the admin on Telegram (requires TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID secrets)
    const telegramToken = Deno.env.get('TELEGRAM_BOT_TOKEN')?.trim();
    const telegramChatId = Deno.env.get('TELEGRAM_CHAT_ID')?.trim();
    if (telegramToken && telegramChatId) {
      try {
        const text = [
          '🔔 Нова заявка за премиум достъп',
          '',
          `Потребител: ${user.email}`,
          `X профил: https://x.com/${handle}`,
          '',
          'Провери дали следва @Culturenstudio и одобри от:',
          'https://schrift.culturen.design/admin',
        ].join('\n');

        const tgResponse = await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: telegramChatId,
            text,
            disable_web_page_preview: true,
          }),
        });
        if (!tgResponse.ok) {
          console.error('Failed to send Telegram notification:', await tgResponse.text());
        }
      } catch (tgError) {
        console.error('Error sending Telegram notification:', tgError);
      }
    } else {
      console.log('Telegram secrets not set — skipping Telegram notification');
    }

    // Notify the admin by email (optional — requires RESEND_API_KEY secret)
    const resendKey = Deno.env.get('RESEND_API_KEY')?.trim();
    if (resendKey) {
      try {
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Schrift.Digital <onboarding@resend.dev>',
            to: [ADMIN_NOTIFY_EMAIL],
            subject: `Нова заявка за премиум достъп: @${handle}`,
            html: [
              '<h2>Нова заявка за премиум достъп</h2>',
              `<p><strong>Потребител:</strong> ${user.email}</p>`,
              `<p><strong>X профил:</strong> <a href="https://x.com/${handle}">@${handle}</a></p>`,
              `<p>Провери дали профилът следва <a href="https://x.com/Culturenstudio">@Culturenstudio</a>,`,
              ` след което одобри достъпа от <a href="https://schrift.culturen.design/admin">админ панела</a>.</p>`,
            ].join(''),
          }),
        });
        if (!emailResponse.ok) {
          console.error('Failed to send notification email:', await emailResponse.text());
        }
      } catch (emailError) {
        console.error('Error sending notification email:', emailError);
      }
    } else {
      console.log('RESEND_API_KEY not set — skipping email notification');
    }

    return jsonResponse({ success: true });
  } catch (error) {
    console.error('request-premium error:', error);
    return jsonResponse({ error: error.message }, 500);
  }
});
