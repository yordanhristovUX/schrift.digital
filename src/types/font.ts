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
  weights: FontWeight[];
  styles: FontStyle[];
  isPaid: boolean;
  price?: number;
  licenseType: LicenseType;
  licenseUrl?: string;
  releaseDate: string;
  yearPublished?: number;
  version?: string;
  copyright?: string;
  rating: number;
  downloads: number;
  featured: boolean;
  languageSupport: string[];
  openTypeFeatures: string[];
  characterSet: string[];
  fontMetrics?: FontMetrics;
  sampleText?: string;
  tags: string[];
  similarFonts: string[];
  weightFiles: Record<string, WeightFile>;
  createdAt: string;
  updatedAt: string;
}