import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs/promises';

// Plugin to update sitemap during build
const sitemapPlugin = () => ({
  name: 'sitemap-plugin',
  async closeBundle() {
    try {
      const { fetchAndSaveSitemap } = await import('./scripts/fetch-sitemap.js');
      await fetchAndSaveSitemap();
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