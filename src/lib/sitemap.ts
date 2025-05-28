import { supabase } from './supabase';

export async function generateSitemap(): Promise<string> {
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
  return xml;
}