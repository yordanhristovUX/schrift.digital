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

    const { email } = await req.json();

    if (!email) {
      throw new Error('Email is required');
    }

    console.log(`Debugging subscription for email: ${email}`);

    // 1. Find user in Supabase
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email)
      .single();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ 
          error: 'User not found in database',
          details: userError 
        }),
        {
          status: 404,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    console.log(`Found user: ${user.id}`);

    // 2. Check if customer exists in our database
    const { data: customerData, error: customerError } = await supabase
      .from('stripe_customers')
      .select('customer_id')
      .eq('user_id', user.id)
      .maybeSingle();

    console.log(`Customer data:`, customerData);

    // 3. Find customer in Stripe by email
    const stripeCustomersResponse = await fetch(`https://api.stripe.com/v1/customers?email=${encodeURIComponent(email)}&limit=10`, {
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
      },
    });

    if (!stripeCustomersResponse.ok) {
      throw new Error(`Failed to fetch Stripe customers: ${stripeCustomersResponse.statusText}`);
    }

    const stripeCustomers = await stripeCustomersResponse.json();
    console.log(`Found ${stripeCustomers.data.length} Stripe customers for email ${email}`);

    let debugInfo = {
      user: user,
      supabaseCustomer: customerData,
      stripeCustomers: stripeCustomers.data,
      subscriptions: [],
      recommendations: []
    };

    // 4. For each Stripe customer, get their subscriptions
    for (const stripeCustomer of stripeCustomers.data) {
      const subscriptionsResponse = await fetch(`https://api.stripe.com/v1/subscriptions?customer=${stripeCustomer.id}&status=all&limit=10`, {
        headers: {
          'Authorization': `Bearer ${stripeSecretKey}`,
        },
      });

      if (subscriptionsResponse.ok) {
        const subscriptions = await subscriptionsResponse.json();
        debugInfo.subscriptions.push({
          customerId: stripeCustomer.id,
          subscriptions: subscriptions.data
        });

        // Check if there are active subscriptions
        const activeSubscriptions = subscriptions.data.filter(sub => sub.status === 'active');
        if (activeSubscriptions.length > 0) {
          debugInfo.recommendations.push(`Customer ${stripeCustomer.id} has ${activeSubscriptions.length} active subscription(s)`);
          
          // If we don't have this customer mapped, suggest creating the mapping
          if (!customerData || customerData.customer_id !== stripeCustomer.id) {
            debugInfo.recommendations.push(`Need to create/update customer mapping for ${stripeCustomer.id}`);
          }
        }
      }
    }

    // 5. Check current subscription data in our database
    if (customerData) {
      const { data: subscriptionData, error: subError } = await supabase
        .from('stripe_subscriptions')
        .select('*')
        .eq('customer_id', customerData.customer_id)
        .maybeSingle();

      debugInfo.supabaseSubscription = subscriptionData;
    }

    return new Response(
      JSON.stringify(debugInfo, null, 2),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Debug error:', error);
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