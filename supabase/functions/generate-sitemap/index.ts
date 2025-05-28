import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all fonts
    const { data: fonts } = await supabase
      .from('fonts')
      .select('id, updated_at')
      .order('updated_at', { ascending: false });

    const baseUrl = 'https://schrift.digital';
    const today = new Date().toISOString().split('T')[0];

    // Static routes with their priorities
    const staticRoutes = [
      { path: '/', priority: '1.0', changefreq: 'daily' },
      { path: '/about', priority: '0.8', changefreq: 'monthly' },
      { path: '/supporter', priority: '0.8', changefreq: 'monthly' },
      { path: '/login', priority: '0.5', changefreq: 'monthly' },
      { path: '/register', priority: '0.5', changefreq: 'monthly' },
    ];

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Add static routes
    staticRoutes.forEach(route => {
      xml += `  <url>\n`;
      xml += `    <loc>${baseUrl}${route.path}</loc>\n`;
      xml += `    <lastmod>${today}</lastmod>\n`;
      xml += `    <changefreq>${route.changefreq}</changefreq>\n`;
      xml += `    <priority>${route.priority}</priority>\n`;
      xml += `  </url>\n`;
    });

    // Add dynamic font routes
    fonts?.forEach(font => {
      const lastmod = font.updated_at ? new Date(font.updated_at).toISOString().split('T')[0] : today;
      xml += `  <url>\n`;
      xml += `    <loc>${baseUrl}/fonts/${font.id}</loc>\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.7</priority>\n`;
      xml += `  </url>\n`;
    });

    xml += '</urlset>';

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate sitemap' }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  }
});