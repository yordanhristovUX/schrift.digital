import { corsHeaders } from '../_shared/cors.ts';

interface TestResponse {
  message: string;
  timestamp: string;
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: any;
  environment?: {
    supabase_url?: string;
    has_anon_key: boolean;
    has_service_role_key: boolean;
  };
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.replace('/test-function', '') || '/';

    // Health check endpoint
    if (path === '/health') {
      const response: TestResponse = {
        message: 'Test function is healthy',
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.url,
        environment: {
          supabase_url: Deno.env.get('SUPABASE_URL'),
          has_anon_key: !!Deno.env.get('SUPABASE_ANON_KEY'),
          has_service_role_key: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
        }
      };

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      });
    }

    // Echo endpoint - returns request details
    if (path === '/echo') {
      let body = null;
      try {
        if (req.body) {
          const text = await req.text();
          body = text ? JSON.parse(text) : null;
        }
      } catch {
        body = 'Invalid JSON body';
      }

      const headers: Record<string, string> = {};
      req.headers.forEach((value, key) => {
        headers[key] = value;
      });

      const response: TestResponse = {
        message: 'Echo response',
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.url,
        headers,
        body,
      };

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      });
    }

    // Default response
    const response: TestResponse = {
      message: 'Test function is working!',
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Test function error:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      }),
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