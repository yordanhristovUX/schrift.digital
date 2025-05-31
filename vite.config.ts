import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  },
  build: {
    target: 'es2020',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom', 'i18next'],
          supabase: ['@supabase/supabase-js', '@supabase/auth-helpers-react'],
          utils: ['date-fns', 'file-saver', 'jszip']
        }
      }
    }
  },
  server: {
    port: 3000,
    strictPort: true,
    host: true
  }
});