import fs from 'fs/promises';
import fetch from 'node-fetch';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

async function fetchAndSaveSitemap() {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/generate-sitemap`,
      {
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch sitemap: ${response.statusText}`);
    }

    const sitemap = await response.text();
    await fs.writeFile('public/sitemap.xml', sitemap);
    console.log('Sitemap updated successfully');
  } catch (error) {
    console.error('Error updating sitemap:', error);
    process.exit(1);
  }
}

fetchAndSaveSitemap();