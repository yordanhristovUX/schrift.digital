import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TestRequest {
  message?: string;
  timestamp?: string;
}

interface TestResponse {
  success: boolean;
  message: string;
  timestamp: string;
  environment: {
    deno_version: string;
    supabase_url: string;
    function_name: string;
  };
  request_info: {
    method: string;
    url: string;
    headers: Record<string, string>;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const method = req.method;
    
    // Get request headers (excluding sensitive ones)
    const requestHeaders: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      if (!key.toLowerCase().includes('authorization') && !key.toLowerCase().includes('key')) {
        requestHeaders[key] = value;
      }
    });

    let requestBody: TestRequest = {};
    
    // Parse request body for POST requests
    if (method === 'POST') {
      try {
        const body = await req.text();
        if (body) {
          requestBody = JSON.parse(body);
        }
      } catch (error) {
        console.warn('Failed to parse request body:', error);
      }
    }

    // Create response data
    const response: TestResponse = {
      success: true,
      message: requestBody.message || `Hello from Supabase Edge Function! This is a test function responding to a ${method} request.`,
      timestamp: new Date().toISOString(),
      environment: {
        deno_version: Deno.version.deno,
        supabase_url: Deno.env.get('SUPABASE_URL') ? 'configured' : 'not configured',
        function_name: 'test-function',
      },
      request_info: {
        method: method,
        url: url.toString(),
        headers: requestHeaders,
      },
    };

    // Handle different HTTP methods
    switch (method) {
      case 'GET':
        // Add query parameters to response if any
        const params: Record<string, string> = {};
        url.searchParams.forEach((value, key) => {
          params[key] = value;
        });
        
        return new Response(JSON.stringify({
          ...response,
          query_parameters: params,
          note: 'This is a GET request. You can add query parameters to test them.',
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'POST':
        return new Response(JSON.stringify({
          ...response,
          received_data: requestBody,
          note: 'This is a POST request. Send JSON data in the body to test it.',
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'PUT':
        return new Response(JSON.stringify({
          ...response,
          received_data: requestBody,
          note: 'This is a PUT request for testing updates.',
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'DELETE':
        return new Response(JSON.stringify({
          ...response,
          note: 'This is a DELETE request for testing deletions.',
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      default:
        return new Response(JSON.stringify({
          success: false,
          error: `Method ${method} not supported`,
          supported_methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        }), {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    console.error('Test function error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});