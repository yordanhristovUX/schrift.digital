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

    const { email, stripeCustomerId } = await req.json();

    if (!email) {
      throw new Error('Email is required');
    }

    console.log(`Syncing subscription for email: ${email}`);

    // 1. Find user in Supabase
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email)
      .single();

    if (userError || !user) {
      throw new Error('User not found in database');
    }

    let customerId = stripeCustomerId;

    // 2. If no customer ID provided, find it by email in Stripe
    if (!customerId) {
      const stripeCustomersResponse = await fetch(`https://api.stripe.com/v1/customers?email=${encodeURIComponent(email)}&limit=1`, {
        headers: {
          'Authorization': `Bearer ${stripeSecretKey}`,
        },
      });

      if (!stripeCustomersResponse.ok) {
        throw new Error(`Failed to fetch Stripe customers: ${stripeCustomersResponse.statusText}`);
      }

      const stripeCustomers = await stripeCustomersResponse.json();
      
      if (stripeCustomers.data.length === 0) {
        throw new Error('No Stripe customer found for this email');
      }

      customerId = stripeCustomers.data[0].id;
    }

    console.log(`Using Stripe customer ID: ${customerId}`);

    // 3. Create or update customer mapping in our database
    const { error: customerUpsertError } = await supabase
      .from('stripe_customers')
      .upsert({
        user_id: user.id,
        customer_id: customerId,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (customerUpsertError) {
      console.error('Error upserting customer:', customerUpsertError);
      throw new Error('Failed to create customer mapping');
    }

    // 4. Fetch latest subscription from Stripe
    const subscriptionsResponse = await fetch(`https://api.stripe.com/v1/subscriptions?customer=${customerId}&status=all&limit=1&expand[]=data.default_payment_method`, {
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
      },
    });

    if (!subscriptionsResponse.ok) {
      throw new Error(`Failed to fetch subscriptions: ${subscriptionsResponse.statusText}`);
    }

    const subscriptions = await subscriptionsResponse.json();

    if (subscriptions.data.length === 0) {
      // No subscriptions found, create a not_started record
      const { error: subError } = await supabase
        .from('stripe_subscriptions')
        .upsert({
          customer_id: customerId,
          status: 'not_started',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'customer_id'
        });

      if (subError) {
        throw new Error('Failed to update subscription status');
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No active subscriptions found',
          status: 'not_started'
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // 5. Sync the latest subscription
    const subscription = subscriptions.data[0];
    
    const subscriptionData = {
      customer_id: customerId,
      subscription_id: subscription.id,
      price_id: subscription.items.data[0]?.price?.id || null,
      current_period_start: subscription.current_period_start,
      current_period_end: subscription.current_period_end,
      cancel_at_period_end: subscription.cancel_at_period_end,
      payment_method_brand: subscription.default_payment_method?.card?.brand || null,
      payment_method_last4: subscription.default_payment_method?.card?.last4 || null,
      status: subscription.status,
      updated_at: new Date().toISOString()
    };

    const { error: subError } = await supabase
      .from('stripe_subscriptions')
      .upsert(subscriptionData, {
        onConflict: 'customer_id'
      });

    if (subError) {
      console.error('Error syncing subscription:', subError);
      throw new Error('Failed to sync subscription');
    }

    console.log(`Successfully synced subscription for customer: ${customerId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Subscription synced successfully',
        subscription: subscriptionData
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Sync error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});