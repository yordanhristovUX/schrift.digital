import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const signature = req.headers.get('stripe-signature');
    const body = await req.text();
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    if (!signature || !webhookSecret) {
      return new Response('Missing signature or webhook secret', { status: 400 });
    }

    // Verify webhook signature
    const crypto = await import('node:crypto');
    const elements = signature.split(',');
    const signatureElements: Record<string, string> = {};
    
    for (const element of elements) {
      const [key, value] = element.split('=');
      signatureElements[key] = value;
    }

    const timestamp = signatureElements.t;
    const expectedSignature = signatureElements.v1;

    const payload = `${timestamp}.${body}`;
    const computedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload, 'utf8')
      .digest('hex');

    if (computedSignature !== expectedSignature) {
      return new Response('Invalid signature', { status: 400 });
    }

    const event = JSON.parse(body);
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        
        if (session.mode === 'subscription') {
          // Handle subscription creation
          const subscription = session.subscription;
          const customerId = session.customer;

          await supabaseClient
            .from('stripe_subscriptions')
            .upsert({
              customer_id: customerId,
              subscription_id: subscription,
              price_id: session.line_items?.data[0]?.price?.id,
              status: 'active',
              current_period_start: Math.floor(Date.now() / 1000),
              current_period_end: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days
            });
        } else if (session.mode === 'payment') {
          // Handle one-time payment
          await supabaseClient
            .from('stripe_orders')
            .insert({
              checkout_session_id: session.id,
              payment_intent_id: session.payment_intent,
              customer_id: session.customer,
              amount_subtotal: session.amount_subtotal,
              amount_total: session.amount_total,
              currency: session.currency,
              payment_status: session.payment_status,
              status: 'completed',
            });
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        
        await supabaseClient
          .from('stripe_subscriptions')
          .update({
            status: subscription.status,
            current_period_start: subscription.current_period_start,
            current_period_end: subscription.current_period_end,
            cancel_at_period_end: subscription.cancel_at_period_end,
          })
          .eq('subscription_id', subscription.id);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        
        await supabaseClient
          .from('stripe_subscriptions')
          .update({
            status: 'canceled',
            deleted_at: new Date().toISOString(),
          })
          .eq('subscription_id', subscription.id);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        
        if (invoice.subscription) {
          await supabaseClient
            .from('stripe_subscriptions')
            .update({
              status: 'active',
              current_period_start: invoice.period_start,
              current_period_end: invoice.period_end,
            })
            .eq('subscription_id', invoice.subscription);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        
        if (invoice.subscription) {
          await supabaseClient
            .from('stripe_subscriptions')
            .update({
              status: 'past_due',
            })
            .eq('subscription_id', invoice.subscription);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ 
      error: 'Webhook processing failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});