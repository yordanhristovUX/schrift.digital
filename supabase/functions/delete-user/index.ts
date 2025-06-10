import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

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

    const { user_id } = await req.json();

    // Verify that the user is deleting their own account
    if (user.id !== user_id) {
      throw new Error('Unauthorized: Can only delete your own account');
    }

    console.log(`Starting deletion process for user: ${user_id}`);

    // Step 1: Cancel any active Stripe subscriptions
    if (stripeSecretKey) {
      try {
        // Get customer ID
        const { data: customerData } = await supabase
          .from('stripe_customers')
          .select('customer_id')
          .eq('user_id', user_id)
          .is('deleted_at', null)
          .maybeSingle();

        if (customerData?.customer_id) {
          console.log(`Found Stripe customer: ${customerData.customer_id}`);

          // Get active subscriptions
          const { data: subscriptions } = await supabase
            .from('stripe_subscriptions')
            .select('subscription_id')
            .eq('customer_id', customerData.customer_id)
            .eq('status', 'active')
            .is('deleted_at', null);

          // Cancel each active subscription
          for (const subscription of subscriptions || []) {
            if (subscription.subscription_id) {
              console.log(`Cancelling subscription: ${subscription.subscription_id}`);
              
              const cancelResponse = await fetch(`https://api.stripe.com/v1/subscriptions/${subscription.subscription_id}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${stripeSecretKey}`,
                },
              });

              if (!cancelResponse.ok) {
                console.error(`Failed to cancel subscription ${subscription.subscription_id}`);
              } else {
                console.log(`Successfully cancelled subscription: ${subscription.subscription_id}`);
              }
            }
          }

          // Mark customer as deleted in our database
          await supabase
            .from('stripe_customers')
            .update({ deleted_at: new Date().toISOString() })
            .eq('user_id', user_id);

          // Mark subscriptions as deleted
          await supabase
            .from('stripe_subscriptions')
            .update({ 
              status: 'canceled',
              deleted_at: new Date().toISOString() 
            })
            .eq('customer_id', customerData.customer_id);

          // Mark orders as deleted
          await supabase
            .from('stripe_orders')
            .update({ deleted_at: new Date().toISOString() })
            .eq('customer_id', customerData.customer_id);
        }
      } catch (stripeError) {
        console.error('Error handling Stripe cleanup:', stripeError);
        // Continue with deletion even if Stripe cleanup fails
      }
    }

    // Step 2: Delete user data from all tables (in correct order due to foreign keys)
    
    // Delete analytics data
    await supabase
      .from('font_analytics')
      .delete()
      .eq('user_id', user_id);

    await supabase
      .from('search_analytics')
      .delete()
      .eq('user_id', user_id);

    await supabase
      .from('font_preview_sessions')
      .delete()
      .eq('user_id', user_id);

    // Delete user favorites
    await supabase
      .from('user_font_favorites')
      .delete()
      .eq('user_id', user_id);

    // Delete font comparisons (two-step process to handle foreign keys correctly)
    // First, get all comparison IDs for this user
    const { data: userComparisons } = await supabase
      .from('font_comparisons')
      .select('id')
      .eq('user_id', user_id);

    // Delete comparison_fonts entries for all user's comparisons
    if (userComparisons && userComparisons.length > 0) {
      const comparisonIds = userComparisons.map(comp => comp.id);
      
      await supabase
        .from('comparison_fonts')
        .delete()
        .in('comparison_id', comparisonIds);
    }

    // Then delete the font_comparisons entries
    await supabase
      .from('font_comparisons')
      .delete()
      .eq('user_id', user_id);

    // Step 3: Delete from public.users table
    const { error: publicUserError } = await supabase
      .from('users')
      .delete()
      .eq('id', user_id);

    if (publicUserError) {
      console.error('Error deleting from public.users:', publicUserError);
      throw new Error('Failed to delete user profile data');
    }

    // Step 4: Delete from auth.users (this should be done last)
    // Use the service role client for admin operations
    const { error: authUserError } = await supabase.auth.admin.deleteUser(user_id);

    if (authUserError) {
      console.error('Error deleting from auth.users:', authUserError);
      // Provide more specific error information
      throw new Error(`Failed to delete user authentication data: ${authUserError.message}`);
    }

    console.log(`Successfully deleted user: ${user_id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'User account deleted successfully' 
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('Delete user error:', error);
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