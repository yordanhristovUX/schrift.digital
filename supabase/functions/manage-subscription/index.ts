import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ManageSubscriptionRequest {
  action: 'cancel' | 'reactivate' | 'update_payment_method';
  subscription_id?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get the user from the request
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, subscription_id }: ManageSubscriptionRequest = await req.json();

    if (!action) {
      return new Response(JSON.stringify({ error: 'Missing action parameter' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user's customer ID
    const { data: customer } = await supabaseClient
      .from('stripe_customers')
      .select('customer_id')
      .eq('user_id', user.id)
      .single();

    if (!customer) {
      return new Response(JSON.stringify({ error: 'Customer not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get subscription ID if not provided
    let subId = subscription_id;
    if (!subId) {
      const { data: subscription } = await supabaseClient
        .from('stripe_subscriptions')
        .select('subscription_id')
        .eq('customer_id', customer.customer_id)
        .eq('status', 'active')
        .single();

      if (!subscription) {
        return new Response(JSON.stringify({ error: 'Active subscription not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      subId = subscription.subscription_id;
    }

    let stripeResponse;

    switch (action) {
      case 'cancel':
        // Cancel subscription at period end
        stripeResponse = await fetch(`https://api.stripe.com/v1/subscriptions/${subId}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('STRIPE_SECRET_KEY')}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            cancel_at_period_end: 'true',
          }),
        });
        break;

      case 'reactivate':
        // Reactivate subscription
        stripeResponse = await fetch(`https://api.stripe.com/v1/subscriptions/${subId}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('STRIPE_SECRET_KEY')}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            cancel_at_period_end: 'false',
          }),
        });
        break;

      case 'update_payment_method':
        // Create customer portal session for payment method update
        stripeResponse = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('STRIPE_SECRET_KEY')}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            customer: customer.customer_id,
            return_url: `${req.headers.get('origin') || 'https://schrift.digital'}/profile`,
          }),
        });
        break;

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    if (!stripeResponse.ok) {
      const error = await stripeResponse.text();
      throw new Error(`Stripe operation failed: ${error}`);
    }

    const result = await stripeResponse.json();

    // Update local database for cancel/reactivate actions
    if (action === 'cancel' || action === 'reactivate') {
      await supabaseClient
        .from('stripe_subscriptions')
        .update({
          cancel_at_period_end: action === 'cancel',
          updated_at: new Date().toISOString(),
        })
        .eq('subscription_id', subId);
    }

    return new Response(JSON.stringify({ 
      success: true,
      data: action === 'update_payment_method' ? { url: result.url } : result
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Manage subscription error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});