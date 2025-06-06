import { corsHeaders } from '../_shared/cors.ts';

interface Quote {
  text: string;
  author: string;
  category: string;
}

interface QuoteResponse {
  quote: Quote;
  timestamp: string;
  request_count: number;
}

// Simple in-memory counter (resets when function restarts)
let requestCount = 0;

const quotes: Quote[] = [
  {
    text: "The only way to do great work is to love what you do.",
    author: "Steve Jobs",
    category: "motivation"
  },
  {
    text: "Innovation distinguishes between a leader and a follower.",
    author: "Steve Jobs",
    category: "innovation"
  },
  {
    text: "Life is what happens to you while you're busy making other plans.",
    author: "John Lennon",
    category: "life"
  },
  {
    text: "The future belongs to those who believe in the beauty of their dreams.",
    author: "Eleanor Roosevelt",
    category: "dreams"
  },
  {
    text: "It is during our darkest moments that we must focus to see the light.",
    author: "Aristotle",
    category: "inspiration"
  },
  {
    text: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    author: "Winston Churchill",
    category: "success"
  },
  {
    text: "The way to get started is to quit talking and begin doing.",
    author: "Walt Disney",
    category: "action"
  },
  {
    text: "Don't let yesterday take up too much of today.",
    author: "Will Rogers",
    category: "mindfulness"
  },
  {
    text: "You learn more from failure than from success. Don't let it stop you. Failure builds character.",
    author: "Unknown",
    category: "failure"
  },
  {
    text: "If you are working on something that you really care about, you don't have to be pushed. The vision pulls you.",
    author: "Steve Jobs",
    category: "passion"
  }
];

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    requestCount++;
    
    const url = new URL(req.url);
    const category = url.searchParams.get('category');
    const author = url.searchParams.get('author');
    
    let filteredQuotes = quotes;
    
    // Filter by category if specified
    if (category) {
      filteredQuotes = filteredQuotes.filter(quote => 
        quote.category.toLowerCase() === category.toLowerCase()
      );
    }
    
    // Filter by author if specified
    if (author) {
      filteredQuotes = filteredQuotes.filter(quote => 
        quote.author.toLowerCase().includes(author.toLowerCase())
      );
    }
    
    // If no quotes match the filters, return all quotes
    if (filteredQuotes.length === 0) {
      filteredQuotes = quotes;
    }
    
    // Get random quote
    const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
    const selectedQuote = filteredQuotes[randomIndex];
    
    const response: QuoteResponse = {
      quote: selectedQuote,
      timestamp: new Date().toISOString(),
      request_count: requestCount,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Random quote function error:', error);
    
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