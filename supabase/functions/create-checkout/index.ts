import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.39.3';
import Stripe from 'npm:stripe@14.14.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get request body
    const { user_id, email, return_url } = await req.json();

    if (!user_id || !email || !return_url) {
      throw new Error('Missing required parameters');
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if customer already exists
    const { data: existingCustomer, error: customerError } = await supabase
      .from('stripe_customers')
      .select('customer_id')
      .eq('user_id', user_id)
      .single();

    if (customerError && customerError.code !== 'PGRST116') {
      console.error('Error fetching customer:', customerError);
      throw new Error('Failed to fetch customer information');
    }

    let customerId;

    if (existingCustomer) {
      customerId = existingCustomer.customer_id;
    } else {
      // Create new customer
      const customer = await stripe.customers.create({
        email,
        metadata: {
          user_id,
        },
      });

      // Save customer in database
      const { error: insertError } = await supabase
        .from('stripe_customers')
        .insert({
          user_id,
          customer_id: customer.id,
        });

      if (insertError) {
        console.error('Error saving customer:', insertError);
        throw new Error('Failed to save customer information');
      }

      customerId = customer.id;
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: 'price_1RT3whAJ880fjAKxqmrh4Iej',
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${return_url}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: return_url,
    });

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An unexpected error occurred' }),
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