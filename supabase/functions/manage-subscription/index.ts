import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
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
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')!;

    if (!stripeSecretKey) {
      throw new Error('Stripe secret key not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Verify the user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid token');
    }

    const { action, return_url } = await req.json();

    if (!action || !return_url) {
      throw new Error('Missing required parameters');
    }

    // Get customer ID - filter out deleted records and use maybeSingle
    const { data: customer } = await supabase
      .from('stripe_customers')
      .select('customer_id')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .maybeSingle();

    if (!customer?.customer_id) {
      throw new Error('No active customer found');
    }

    let url: string;

    switch (action) {
      case 'cancel':
        // Get subscription
        const { data: subscription } = await supabase
          .from('stripe_subscriptions')
          .select('subscription_id')
          .eq('customer_id', customer.customer_id)
          .maybeSingle();

        if (!subscription?.subscription_id) {
          throw new Error('No active subscription found');
        }

        // Cancel subscription at period end
        const cancelResponse = await fetch(`https://api.stripe.com/v1/subscriptions/${subscription.subscription_id}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${stripeSecretKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            cancel_at_period_end: 'true',
          }),
        });

        if (!cancelResponse.ok) {
          const error = await cancelResponse.text();
          throw new Error(`Failed to cancel subscription: ${error}`);
        }

        url = return_url;
        break;

      case 'portal':
        // Create customer portal session
        const portalResponse = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${stripeSecretKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            customer: customer.customer_id,
            return_url: return_url,
          }),
        });

        if (!portalResponse.ok) {
          const error = await portalResponse.text();
          throw new Error(`Failed to create portal session: ${error}`);
        }

        const portal = await portalResponse.json();
        url = portal.url;
        break;

      default:
        throw new Error('Invalid action');
    }

    return new Response(
      JSON.stringify({ url }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Manage subscription error:', error);
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