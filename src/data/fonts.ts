import { Font } from '../types/font';

export const fonts: Font[] = [
  {
    id: "sofia-sans",
    name: "Sofia Sans",
    designer: "Lettersoup & Ani Petrova",
    category: "Sans Serif",
    description: "A versatile sans-serif font family with authentic Bulgarian character designs, optimized for both display and text use. Sofia Sans offers exceptional readability on screen.",
    weights: ["Light", "Regular", "Medium", "SemiBold", "Bold", "ExtraBold"],
    isPaid: false,
    releaseDate: "2022-09-15",
    rating: 4.8,
    downloads: 12450,
    featured: true,
    features: [
      "Bulgarian Cyrillic letterforms",
      "Multiple weights",
      "Extended character set",
      "Optimized for screen",
      "OpenType features",
      "Tabular figures",
      "Small caps"
    ]
  },
  {
    id: "plovdiv",
    name: "Plovdiv",
    designer: "Stefan Peev",
    category: "Serif",
    description: "An elegant serif typeface with classical proportions and distinctive Bulgarian Cyrillic forms. Plovdiv combines traditional calligraphic influences with modern functionality.",
    weights: ["Regular", "Medium", "Bold"],
    isPaid: true,
    price: 49,
    releaseDate: "2020-11-03",
    rating: 4.7,
    downloads: 8320,
    featured: true,
    features: [
      "Distinctive Bulgarian Cyrillic",
      "Classical proportions",
      "Elegant serifs",
      "Stylistic alternates",
      "Old-style figures",
      "Small caps",
      "Extended punctuation"
    ]
  },
  {
    id: "varna-grotesk",
    name: "Varna Grotesk",
    designer: "Type Studio Sofia",
    category: "Sans Serif",
    description: "A modern geometric sans-serif with a technical feel and authentic Bulgarian character shapes. Perfect for UI design, branding, and editorial projects.",
    weights: ["Thin", "Light", "Regular", "Medium", "Bold", "Black"],
    isPaid: true,
    price: 69,
    releaseDate: "2021-05-22",
    rating: 4.9,
    downloads: 9760,
    featured: true,
    features: [
      "Geometric construction",
      "Bulgarian Cyrillic letterforms",
      "6 weights with italics",
      "Tabular figures",
      "Alternative glyphs",
      "Extended language support",
      "Technical feel"
    ]
  },
  {
    id: "balkan-script",
    name: "Balkan Script",
    designer: "Maria Docheva",
    category: "Handwritten",
    description: "A flowing handwritten font that captures the spirit of traditional Bulgarian calligraphy while offering modern OpenType features.",
    weights: ["Regular"],
    isPaid: false,
    releaseDate: "2023-01-30",
    rating: 4.5,
    downloads: 5680,
    featured: false,
    features: [
      "Authentic handwritten style",
      "Bulgarian Cyrillic forms",
      "Contextual alternates",
      "Swashes and flourishes",
      "Connected script",
      "Multilingual support",
      "Ornaments and extras"
    ]
  },
  {
    id: "rila",
    name: "Rila",
    designer: "Nikolay Petrov",
    category: "Serif",
    description: "A robust serif typeface inspired by Bulgarian newspaper typography with excellent readability for long-form text and a distinctive character at display sizes.",
    weights: ["Regular", "SemiBold", "Bold"],
    isPaid: true,
    price: 59,
    releaseDate: "2021-08-12",
    rating: 4.6,
    downloads: 4230,
    featured: false,
    features: [
      "Bulgarian Cyrillic letterforms",
      "Editorial design optimized",
      "High contrast serifs",
      "Optical sizing",
      "Text and display variants",
      "Oldstyle and lining numerals",
      "Extended language support"
    ]
  },
  {
    id: "cyrillic-sans",
    name: "Cyrillic Sans",
    designer: "TypeFoundry BG",
    category: "Sans Serif",
    description: "A neutral workhorse sans-serif designed specifically for Bulgarian Cyrillic, with a focus on clarity and legibility in digital interfaces.",
    weights: ["Light", "Regular", "Medium", "Bold"],
    isPaid: false,
    releaseDate: "2022-03-18",
    rating: 4.4,
    downloads: 7890,
    featured: true,
    features: [
      "Bulgarian Cyrillic forms",
      "UI optimized",
      "Humanist proportions",
      "Neutral character",
      "High legibility",
      "Versatile application",
      "Extended character set"
    ]
  },
  {
    id: "veliko-display",
    name: "Veliko Display",
    designer: "Anton Georgiev",
    category: "Display",
    description: "A bold, attention-grabbing display typeface with distinctly Bulgarian character. Perfect for headlines, posters, and brands wanting to make a statement.",
    weights: ["Regular", "Bold", "Black"],
    isPaid: true,
    price: 39,
    releaseDate: "2020-12-05",
    rating: 4.7,
    downloads: 3450,
    featured: false,
    features: [
      "Bold character design",
      "Bulgarian Cyrillic forms",
      "High contrast",
      "Condensed proportions",
      "Stylistic alternates",
      "Display optimized",
      "Alternative figure styles"
    ]
  },
  {
    id: "rodina",
    name: "Rodina",
    designer: "Iliya Gruev",
    category: "Sans Serif",
    description: "A versatile neo-grotesque sans-serif with a contemporary feel and traditional Bulgarian Cyrillic letterforms, suitable for both text and display use.",
    weights: ["Light", "Regular", "Medium", "SemiBold", "Bold"],
    isPaid: true,
    price: 65,
    releaseDate: "2021-11-11",
    rating: 4.8,
    downloads: 6120,
    featured: false,
    features: [
      "Neo-grotesque style",
      "Bulgarian Cyrillic letterforms",
      "Contemporary character",
      "Extensive weight range",
      "High legibility",
      "Neutral versatility",
      "Extended language support"
    ]
  }
];