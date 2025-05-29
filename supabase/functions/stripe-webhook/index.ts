import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
);

serve(async (req) => {
  try {
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      return new Response('No signature found', { status: 400 });
    }

    const body = await req.text();
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret!);

    console.log(`Processing Stripe event: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Webhook error:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const { customer: customerId } = session;
  if (!customerId) return;

  console.log(`Processing checkout completed for customer: ${customerId}`);

  const { data: customerData } = await supabase
    .from('stripe_customers')
    .select('user_id')
    .eq('customer_id', customerId)
    .single();

  if (!customerData) return;

  if (session.mode === 'subscription') {
    await supabase
      .from('stripe_subscriptions')
      .upsert({
        customer_id: customerId,
        status: 'active',
        subscription_id: session.subscription,
        price_id: session.subscription,
      });
  } else {
    await supabase
      .from('stripe_orders')
      .insert({
        customer_id: customerId,
        checkout_session_id: session.id,
        payment_intent_id: session.payment_intent as string,
        amount_subtotal: session.amount_subtotal!,
        amount_total: session.amount_total!,
        currency: session.currency!,
        payment_status: session.payment_status!,
        status: 'completed',
      });
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log(`Processing subscription update: ${subscription.id}`);

  await supabase
    .from('stripe_subscriptions')
    .upsert({
      customer_id: subscription.customer as string,
      subscription_id: subscription.id,
      status: subscription.status,
      price_id: subscription.items.data[0].price.id,
      current_period_start: subscription.current_period_start,
      current_period_end: subscription.current_period_end,
      cancel_at_period_end: subscription.cancel_at_period_end,
    });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log(`Processing subscription deletion: ${subscription.id}`);

  await supabase
    .from('stripe_subscriptions')
    .update({ 
      status: 'canceled', 
      deleted_at: new Date().toISOString() 
    })
    .eq('subscription_id', subscription.id);
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log(`Processing successful payment: ${paymentIntent.id}`);

  await supabase
    .from('stripe_orders')
    .update({ 
      payment_status: 'succeeded',
      status: 'completed'
    })
    .eq('payment_intent_id', paymentIntent.id);
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log(`Processing failed payment: ${paymentIntent.id}`);

  await supabase
    .from('stripe_orders')
    .update({ 
      payment_status: 'failed',
      status: 'canceled'
    })
    .eq('payment_intent_id', paymentIntent.id);
}