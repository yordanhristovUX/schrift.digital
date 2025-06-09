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

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Debugging user registration issues...');

    // Check both users in auth.users table
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      throw new Error(`Failed to fetch auth users: ${authError.message}`);
    }

    console.log(`Found ${authUsers.users.length} users in auth.users`);

    // Check both users in public.users table
    const { data: publicUsers, error: publicError } = await supabase
      .from('users')
      .select('*')
      .in('email', ['yhristov.xyz@gmail.com', 'primallift@gmail.com']);

    if (publicError) {
      console.error('Error fetching public users:', publicError);
    }

    console.log(`Found ${publicUsers?.length || 0} users in public.users`);

    // Analyze each target user
    const targetEmails = ['yhristov.xyz@gmail.com', 'primallift@gmail.com'];
    const analysis = [];

    for (const email of targetEmails) {
      const authUser = authUsers.users.find(u => u.email === email);
      const publicUser = publicUsers?.find(u => u.email === email);

      const userAnalysis = {
        email: email,
        authUser: authUser ? {
          id: authUser.id,
          email: authUser.email,
          email_confirmed_at: authUser.email_confirmed_at,
          created_at: authUser.created_at,
          updated_at: authUser.updated_at,
          last_sign_in_at: authUser.last_sign_in_at,
          raw_user_meta_data: authUser.raw_user_meta_data,
          user_metadata: authUser.user_metadata,
          app_metadata: authUser.app_metadata,
          banned_until: authUser.banned_until,
          confirmation_sent_at: authUser.confirmation_sent_at,
          recovery_sent_at: authUser.recovery_sent_at,
          email_change_sent_at: authUser.email_change_sent_at,
          new_email: authUser.new_email,
          invited_at: authUser.invited_at,
          action_link: authUser.action_link,
          phone: authUser.phone,
          phone_confirmed_at: authUser.phone_confirmed_at,
          phone_change: authUser.phone_change,
          phone_change_sent_at: authUser.phone_change_sent_at,
          confirmed_at: authUser.confirmed_at,
          email_change_confirm_status: authUser.email_change_confirm_status,
          identities: authUser.identities
        } : null,
        publicUser: publicUser ? {
          id: publicUser.id,
          full_name: publicUser.full_name,
          email: publicUser.email,
          role: publicUser.role,
          created_at: publicUser.created_at,
          updated_at: publicUser.updated_at
        } : null,
        issues: []
      };

      // Identify issues
      if (!authUser) {
        userAnalysis.issues.push('User not found in auth.users table');
      } else {
        if (!authUser.email_confirmed_at) {
          userAnalysis.issues.push('Email not confirmed in auth.users');
        }
        if (authUser.banned_until) {
          userAnalysis.issues.push(`User is banned until: ${authUser.banned_until}`);
        }
      }

      if (!publicUser) {
        userAnalysis.issues.push('User not found in public.users table');
      } else if (authUser && publicUser.id !== authUser.id) {
        userAnalysis.issues.push('ID mismatch between auth.users and public.users');
      }

      analysis.push(userAnalysis);
    }

    // Check for orphaned records
    const { data: allPublicUsers, error: allPublicError } = await supabase
      .from('users')
      .select('id, email');

    if (!allPublicError && allPublicUsers) {
      const orphanedPublicUsers = allPublicUsers.filter(pu => 
        !authUsers.users.some(au => au.id === pu.id)
      );

      if (orphanedPublicUsers.length > 0) {
        analysis.push({
          email: 'ORPHANED_RECORDS',
          authUser: null,
          publicUser: null,
          issues: [`Found ${orphanedPublicUsers.length} orphaned records in public.users: ${orphanedPublicUsers.map(u => u.email).join(', ')}`]
        });
      }
    }

    // Check trigger function status - removed PostgreSQL type cast
    const { data: triggerInfo, error: triggerError } = await supabase
      .rpc('pg_get_functiondef', { funcid: 'handle_new_user' });

    const debugInfo = {
      summary: {
        total_auth_users: authUsers.users.length,
        total_public_users: publicUsers?.length || 0,
        target_users_analyzed: analysis.length
      },
      user_analysis: analysis,
      trigger_function_exists: !triggerError,
      trigger_error: triggerError?.message || null,
      recommendations: []
    };

    // Generate recommendations
    for (const user of analysis) {
      if (user.issues.length > 0) {
        if (user.issues.includes('User not found in public.users table') && user.authUser) {
          debugInfo.recommendations.push(`Create public.users record for ${user.email} with ID ${user.authUser.id}`);
        }
        if (user.issues.includes('Email not confirmed in auth.users')) {
          debugInfo.recommendations.push(`Manually confirm email for ${user.email} in auth.users`);
        }
      }
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