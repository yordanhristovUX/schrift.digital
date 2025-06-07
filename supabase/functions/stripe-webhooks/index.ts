import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, stripe-signature",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;

    if (!stripeWebhookSecret) {
      throw new Error('Stripe webhook secret not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      throw new Error('No stripe signature');
    }

    // Verify webhook signature
    const encoder = new TextEncoder();
    const data = encoder.encode(body);
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(stripeWebhookSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    // Parse signature
    const sigElements = signature.split(',');
    const timestamp = sigElements.find(el => el.startsWith('t='))?.split('=')[1];
    const sig = sigElements.find(el => el.startsWith('v1='))?.split('=')[1];

    if (!timestamp || !sig) {
      throw new Error('Invalid signature format');
    }

    // Create payload for verification
    const payload = `${timestamp}.${body}`;
    const expectedSig = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
    const expectedSigHex = Array.from(new Uint8Array(expectedSig))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    if (sig !== expectedSigHex) {
      throw new Error('Invalid signature');
    }

    const event = JSON.parse(body);

    console.log('Processing webhook event:', event.type);

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(supabase, event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(supabase, event.data.object);
        break;

      case 'checkout.session.completed':
        await handleCheckoutCompleted(supabase, event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(supabase, event.data.object);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(supabase, event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});

async function handleSubscriptionUpdate(supabase: any, subscription: any) {
  const subscriptionData = {
    customer_id: subscription.customer,
    subscription_id: subscription.id,
    price_id: subscription.items.data[0]?.price?.id,
    current_period_start: subscription.current_period_start,
    current_period_end: subscription.current_period_end,
    cancel_at_period_end: subscription.cancel_at_period_end,
    status: subscription.status,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('stripe_subscriptions')
    .upsert(subscriptionData, {
      onConflict: 'customer_id',
    });

  if (error) {
    console.error('Error updating subscription:', error);
    throw error;
  }
}

async function handleSubscriptionDeleted(supabase: any, subscription: any) {
  const { error } = await supabase
    .from('stripe_subscriptions')
    .update({
      status: 'canceled',
      deleted_at: new Date().toISOString(),
    })
    .eq('subscription_id', subscription.id);

  if (error) {
    console.error('Error deleting subscription:', error);
    throw error;
  }
}

async function handleCheckoutCompleted(supabase: any, session: any) {
  if (session.mode === 'subscription') {
    // Subscription checkout - handled by subscription events
    return;
  }

  // One-time payment
  const orderData = {
    checkout_session_id: session.id,
    payment_intent_id: session.payment_intent,
    customer_id: session.customer,
    amount_subtotal: session.amount_subtotal,
    amount_total: session.amount_total,
    currency: session.currency,
    payment_status: session.payment_status,
    status: 'completed',
  };

  const { error } = await supabase
    .from('stripe_orders')
    .insert(orderData);

  if (error) {
    console.error('Error creating order:', error);
    throw error;
  }
}

async function handlePaymentSucceeded(supabase: any, invoice: any) {
  // Update subscription with payment method info if available
  if (invoice.subscription) {
    const { error } = await supabase
      .from('stripe_subscriptions')
      .update({
        payment_method_brand: invoice.charge?.payment_method_details?.card?.brand,
        payment_method_last4: invoice.charge?.payment_method_details?.card?.last4,
      })
      .eq('subscription_id', invoice.subscription);

    if (error) {
      console.error('Error updating payment method:', error);
    }
  }
}

async function handlePaymentFailed(supabase: any, invoice: any) {
  // Handle failed payments - could send notifications, update status, etc.
  console.log('Payment failed for invoice:', invoice.id);
}