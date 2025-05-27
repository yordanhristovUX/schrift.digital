import { Font } from '../types/font';
import { supabase } from './supabase';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export const downloadFont = async (font: Font, selectedWeight?: string) => {
  try {
    if (font.is_paid) {
      // For paid fonts, redirect to payment page
      window.location.href = `/checkout/${font.id}`;
      return;
    }

    // For free fonts, download selected weight or all weights
    if (!font.weight_files) {
      throw new Error('No font files available');
    }

    // Increment download count
    const { error: updateError } = await supabase
      .from('fonts')
      .update({ downloads: (font.downloads || 0) + 1 })
      .eq('id', font.id);

    if (updateError) throw updateError;

    if (selectedWeight) {
      // Download specific weight
      const weightFile = Object.entries(font.weight_files).find(([key]) => key.startsWith(selectedWeight));
      if (!weightFile) {
        throw new Error('Selected weight not found');
      }
      const [key, file] = weightFile;
      const response = await fetch(file.path);
      const blob = await response.blob();
      saveAs(blob, `${font.name}-${file.weight}${file.style !== 'Normal' ? `-${file.style}` : ''}.${file.path.split('.').pop()}`);
    } else {
      // Download all weights in a zip file
      const zip = new JSZip();
      const fontFolder = zip.folder(font.name);
      
      if (!fontFolder) {
        throw new Error('Failed to create zip folder');
      }

      // Add each font file to the zip
      for (const [key, file] of Object.entries(font.weight_files)) {
        const response = await fetch(file.path);
        const blob = await response.blob();
        const fileName = `${font.name}-${file.weight}${file.style !== 'Normal' ? `-${file.style}` : ''}.${file.path.split('.').pop()}`;
        fontFolder.file(fileName, blob);
      }

      // Generate and download the zip file
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, `${font.name}-family.zip`);
    }
  } catch (error) {
    console.error('Error downloading font:', error);
    alert('Failed to download font. Please try again later.');
  }
};