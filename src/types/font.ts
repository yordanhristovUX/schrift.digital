export type FontWeight = 'Thin' | 'ExtraLight' | 'Light' | 'Regular' | 'Medium' | 'SemiBold' | 'Bold' | 'ExtraBold' | 'Black';
export type FontStyle = 'Normal' | 'Italic' | 'Oblique';
export type LanguageOption = 'bulgarian' | 'russian' | 'english';
export type LicenseType = 'Free' | 'Free for personal use' | 'Commercial';

export interface FontMetrics {
  ascender: number;
  descender: number;
  lineGap: number;
  unitsPerEm: number;
  xHeight: number;
  capHeight: number;
}

export interface WeightFile {
  weight: FontWeight;
  style: FontStyle;
  path: string;
}

export interface Font {
  id: string;
  name: string;
  designer: string;
  foundry?: string;
  category: string;
  description: string;
  is_paid: boolean;
  price?: number;
  subscriber_only?: boolean;
  license_type: LicenseType;
  license_url?: string;
  year_published?: number;
  version?: string;
  copyright?: string;
  rating: number;
  downloads: number;
  featured: boolean;
  language_support: string[];
  opentype_features: string[];
  character_set: string[];
  font_metrics?: FontMetrics;
  sample_text?: string;
  tags: string[];
  weight_files: Record<string, WeightFile>;
  created_at: string;
  updated_at: string;
}