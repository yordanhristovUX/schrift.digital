import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')!;

    if (!stripeSecretKey) {
      throw new Error('Stripe secret key not configured');
    }

    // Get price ID from URL params or use default
    const url = new URL(req.url);
    const priceId = url.searchParams.get('price_id') || 'price_1RT3whAJ880fjAKxqmrh4Iej';

    // Fetch price from Stripe
    const priceResponse = await fetch(`https://api.stripe.com/v1/prices/${priceId}`, {
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Stripe-Version': '2023-10-16',
      },
    });

    if (!priceResponse.ok) {
      const error = await priceResponse.text();
      throw new Error(`Failed to fetch price: ${error}`);
    }

    const price = await priceResponse.json();

    return new Response(
      JSON.stringify({
        id: price.id,
        unit_amount: price.unit_amount,
        currency: price.currency,
        recurring: price.recurring,
        product: price.product,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Get price error:', error);
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