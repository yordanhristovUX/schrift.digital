import { Font } from '../types/font';
import { supabase } from './supabase';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

// Cache configuration
const CACHE_NAME = 'schrift-fonts-v1';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

// Helper function to check if cache is supported
const isCacheSupported = () => {
  return 'caches' in window;
};

// Helper function to get cached response
const getCachedResponse = async (url: string) => {
  if (!isCacheSupported()) return null;
  
  try {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(url);
    
    if (!cachedResponse) return null;
    
    // Check if cache is expired
    const cachedDate = new Date(cachedResponse.headers.get('date') || '');
    if (Date.now() - cachedDate.getTime() > CACHE_DURATION) {
      await cache.delete(url);
      return null;
    }
    
    return cachedResponse;
  } catch (error) {
    console.error('Cache error:', error);
    return null;
  }
};

// Helper function to cache response
const cacheResponse = async (url: string, response: Response) => {
  if (!isCacheSupported()) return;
  
  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(url, response.clone());
  } catch (error) {
    console.error('Cache error:', error);
  }
};

export const getFeaturedFonts = async (limit = 3) => {
  try {
    console.log('Fetching fonts...');
    const { data, error } = await supabase
      .from('fonts')
      .select('*')
      .limit(limit);
      
    if (error) {
      console.error('Supabase error:', error);
      throw new Error(`Failed to fetch fonts: ${error.message}`);
    }
    
    console.log('Fetched fonts:', data);
    
    if (!data || data.length === 0) {
      console.log('No fonts found');
      return [];
    }
    
    return data;
  } catch (err) {
    console.error('Error fetching fonts:', err);
    throw err;
  }
};

export const getFontById = async (id: string): Promise<Font | null> => {
  try {
    const { data, error } = await supabase
      .from('fonts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw new Error(`Failed to fetch font: ${error.message}`);
    }
    
    return data;
  } catch (err) {
    console.error('Error fetching font:', err);
    throw err;
  }
};

export const incrementDownloads = async (fontId: string) => {
  try {
    const { data: font, error: fetchError } = await supabase
      .from('fonts')
      .select('downloads')
      .eq('id', fontId)
      .single();

    if (fetchError) {
      console.error('Supabase error:', fetchError);
      throw fetchError;
    }

    const newDownloads = (font?.downloads || 0) + 1;

    const { error: updateError } = await supabase
      .from('fonts')
      .update({ downloads: newDownloads })
      .eq('id', fontId);

    if (updateError) {
      console.error('Supabase error:', updateError);
      throw updateError;
    }
  } catch (err) {
    console.error('Error incrementing downloads:', err);
    throw err;
  }
};

export const downloadFont = async (font: Font, selectedWeight?: string, selectedStyle?: string) => {
  try {
    if (font.is_paid) {
      window.location.href = `/checkout/${font.id}`;
      return;
    }

    if (!font.weight_files) {
      throw new Error('No font files available');
    }

    await incrementDownloads(font.id);

    if (selectedWeight && selectedStyle) {
      const fontFile = Object.values(font.weight_files).find(
        file => file.weight === selectedWeight && file.style === selectedStyle
      );

      if (!fontFile) {
        throw new Error('Selected weight and style combination not found');
      }

      // Try to get font from cache first
      const cachedResponse = await getCachedResponse(fontFile.path);
      let response;

      if (cachedResponse) {
        response = cachedResponse;
      } else {
        response = await fetch(fontFile.path);
        if (!response.ok) {
          throw new Error(`Failed to fetch font file: ${response.statusText}`);
        }
        // Cache the response
        await cacheResponse(fontFile.path, response);
      }
      
      const blob = await response.blob();
      saveAs(blob, `${font.name}-${fontFile.weight}${fontFile.style !== 'Normal' ? `-${fontFile.style}` : ''}.${fontFile.path.split('.').pop()}`);
    } else {
      const zip = new JSZip();
      const fontFolder = zip.folder(font.name);
      
      if (!fontFolder) {
        throw new Error('Failed to create zip folder');
      }

      // Download and cache all font files
      for (const [key, file] of Object.entries(font.weight_files)) {
        // Try to get font from cache first
        const cachedResponse = await getCachedResponse(file.path);
        let response;

        if (cachedResponse) {
          response = cachedResponse;
        } else {
          response = await fetch(file.path);
          if (!response.ok) {
            throw new Error(`Failed to fetch font file: ${response.statusText}`);
          }
          // Cache the response
          await cacheResponse(file.path, response);
        }
        
        const blob = await response.blob();
        const fileName = `${font.name}-${file.weight}${file.style !== 'Normal' ? `-${file.style}` : ''}.${file.path.split('.').pop()}`;
        fontFolder.file(fileName, blob);
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, `${font.name}-family.zip`);
    }
  } catch (error) {
    console.error('Error downloading font:', error);
    throw error;
  }
};

export const loadFontFaces = async (fonts: Font[]) => {
  for (const font of fonts) {
    if (font.weight_files) {
      const style = document.createElement('style');
      document.head.appendChild(style);

      const fontFaces = await Promise.all(
        Object.entries(font.weight_files).map(async ([key, file]) => {
          // Try to get font from cache first
          const cachedResponse = await getCachedResponse(file.path);
          let fontUrl = file.path;

          if (cachedResponse) {
            const blob = await cachedResponse.blob();
            fontUrl = URL.createObjectURL(blob);
          } else {
            const response = await fetch(file.path);
            if (response.ok) {
              const blob = await response.blob();
              // Cache the response
              await cacheResponse(file.path, response.clone());
              fontUrl = URL.createObjectURL(blob);
            }
          }

          return `
            @font-face {
              font-family: "${font.name}";
              src: url("${fontUrl}");
              font-weight: ${getWeightValue(file.weight)};
              font-style: ${file.style.toLowerCase()};
              font-display: swap;
            }
          `;
        })
      );

      style.textContent = fontFaces.join('\n');
    }
  }
};

export const getWeightValue = (weight: string): number => {
  const weightMap: Record<string, number> = {
    'Thin': 100,
    'ExtraLight': 200,
    'Light': 300,
    'Regular': 400,
    'Medium': 500,
    'SemiBold': 600,
    'Bold': 700,
    'ExtraBold': 800,
    'Black': 900
  };
  return weightMap[weight] || 400;
};

export const getGroupedWeights = (font: Font) => {
  if (!font.weight_files) return { normal: [], italic: [] };

  const weights = Object.entries(font.weight_files);
  const normal = weights
    .filter(([_, file]) => file.style === 'Normal')
    .sort((a, b) => getWeightValue(a[1].weight) - getWeightValue(b[1].weight));
  
  const italic = weights
    .filter(([_, file]) => file.style === 'Italic')
    .sort((a, b) => getWeightValue(a[1].weight) - getWeightValue(b[1].weight));

  return { normal, italic };
};