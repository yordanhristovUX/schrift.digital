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

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const { email } = await req.json();

    if (!email) {
      throw new Error('Email is required');
    }

    console.log(`Starting admin deletion process for user: ${email}`);

    // Step 1: Find the user in auth.users
    const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      throw new Error(`Failed to list users: ${listError.message}`);
    }

    const authUser = authUsers.users.find(u => u.email === email);
    
    if (!authUser) {
      throw new Error(`User with email ${email} not found in auth.users`);
    }

    const userId = authUser.id;
    console.log(`Found user ${email} with ID: ${userId}`);

    // Step 2: Clean up all related data in the correct order
    
    // Delete analytics data
    await supabase.from('font_analytics').delete().eq('user_id', userId);
    await supabase.from('search_analytics').delete().eq('user_id', userId);
    await supabase.from('font_preview_sessions').delete().eq('user_id', userId);
    console.log('Deleted analytics data');

    // Delete user favorites
    await supabase.from('user_font_favorites').delete().eq('user_id', userId);
    console.log('Deleted user favorites');

    // Delete font comparisons (two-step process)
    const { data: userComparisons } = await supabase
      .from('font_comparisons')
      .select('id')
      .eq('user_id', userId);

    if (userComparisons && userComparisons.length > 0) {
      const comparisonIds = userComparisons.map(comp => comp.id);
      
      await supabase
        .from('comparison_fonts')
        .delete()
        .in('comparison_id', comparisonIds);
    }

    await supabase.from('font_comparisons').delete().eq('user_id', userId);
    console.log('Deleted font comparisons');

    // Clean up Stripe data
    const { data: customerData } = await supabase
      .from('stripe_customers')
      .select('customer_id')
      .eq('user_id', userId);

    if (customerData && customerData.length > 0) {
      const customerIds = customerData.map(c => c.customer_id);
      
      // Mark subscriptions as deleted
      await supabase
        .from('stripe_subscriptions')
        .update({ 
          status: 'canceled',
          deleted_at: new Date().toISOString() 
        })
        .in('customer_id', customerIds);

      // Mark orders as deleted
      await supabase
        .from('stripe_orders')
        .update({ deleted_at: new Date().toISOString() })
        .in('customer_id', customerIds);

      // Mark customers as deleted
      await supabase
        .from('stripe_customers')
        .update({ deleted_at: new Date().toISOString() })
        .eq('user_id', userId);
      
      console.log('Cleaned up Stripe data');
    }

    // Step 3: Delete from public.users
    const { error: publicUserError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (publicUserError) {
      console.error('Error deleting from public.users:', publicUserError);
      // Continue anyway, as the user might not exist in public.users
    } else {
      console.log('Deleted from public.users');
    }

    // Step 4: Delete from auth.users (this is the key step)
    const { error: authUserError } = await supabase.auth.admin.deleteUser(userId);

    if (authUserError) {
      console.error('Error deleting from auth.users:', authUserError);
      throw new Error(`Failed to delete user from auth.users: ${authUserError.message}`);
    }

    console.log('Successfully deleted from auth.users');

    // Step 5: Verify deletion
    const { data: verifyUsers } = await supabase.auth.admin.listUsers();
    const stillExists = verifyUsers?.users.find(u => u.email === email);
    
    if (stillExists) {
      throw new Error('User still exists after deletion attempt');
    }

    console.log(`Successfully deleted user: ${email}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `User ${email} has been completely deleted from both database and authentication system`,
        userId: userId
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('Admin delete user error:', error);
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