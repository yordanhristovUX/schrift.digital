import { corsHeaders } from '../_shared/cors.ts';

interface TextProcessorResponse {
  operation: string;
  input: string;
  result: string | number;
  timestamp: string;
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
    const operation = url.searchParams.get('op') || 'info';
    const text = url.searchParams.get('text') || 'Hello World';

    let result: string | number = '';

    switch (operation) {
      case 'uppercase':
        result = text.toUpperCase();
        break;
      
      case 'lowercase':
        result = text.toLowerCase();
        break;
      
      case 'reverse':
        result = text.split('').reverse().join('');
        break;
      
      case 'length':
        result = text.length;
        break;
      
      case 'words':
        result = text.trim().split(/\s+/).length;
        break;
      
      case 'capitalize':
        result = text.split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
        break;
      
      case 'slug':
        result = text
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, '')
          .replace(/[\s_-]+/g, '-')
          .replace(/^-+|-+$/g, '');
        break;
      
      case 'vowels':
        result = (text.match(/[aeiouAEIOU]/g) || []).length;
        break;
      
      case 'consonants':
        result = (text.match(/[bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ]/g) || []).length;
        break;
      
      case 'info':
      default:
        result = `Available operations: uppercase, lowercase, reverse, length, words, capitalize, slug, vowels, consonants. Use ?op=operation&text=your_text`;
        break;
    }

    const response: TextProcessorResponse = {
      operation,
      input: text,
      result,
      timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Text processor error:', error);
    
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