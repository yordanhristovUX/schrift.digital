import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs/promises';

// Plugin to generate static sitemap during build
const sitemapPlugin = () => ({
  name: 'sitemap-plugin',
  async closeBundle() {
    try {
      // Generate static sitemap
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

      xml += '</urlset>';

      // Write sitemap to public directory
      await fs.writeFile('public/sitemap.xml', xml);
      console.log('Static sitemap generated successfully');
    } catch (error) {
      console.error('Error generating sitemap:', error);
    }
  }
});

export default defineConfig({
  plugins: [react(), sitemapPlugin()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
        }
      }
    }
  }
});