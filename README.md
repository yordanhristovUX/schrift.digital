# Schrift.Digital

A platform for Bulgarian Cyrillic fonts optimized for Figma.

## Project Structure

```
├── public/               # Static assets
│   ├── fonts/           # Font files
│   ├── locales/         # i18n translation files
│   └── _redirects       # Netlify redirects
├── src/
│   ├── components/      # React components
│   ├── lib/            # Utility functions and services
│   ├── pages/          # Page components
│   ├── styles/         # Global styles
│   └── types/          # TypeScript type definitions
└── supabase/
    └── functions/      # Edge functions
```

## Key Features

- Browse and preview Bulgarian Cyrillic fonts
- Test fonts with custom text and different weights
- Download free fonts
- Purchase premium fonts
- User authentication and profiles
- Subscription management
- Multilingual support (Bulgarian/English)

## Tech Stack

- React 18 with TypeScript
- Tailwind CSS for styling
- i18next for internationalization
- Supabase for:
  - Database
  - Authentication
  - Edge Functions
  - Storage
- Stripe for payments
- Vite for development and building

## Development

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
Create a `.env` file with:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Start development server:
```bash
npm run dev
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

## TypeScript Configuration

The project uses a split TypeScript configuration approach for better separation of concerns:

- `tsconfig.json` - Base configuration file that references other specific configs
- `tsconfig.app.json` - Configuration for the React application source code
- `tsconfig.node.json` - Configuration for Node.js files like `vite.config.ts`

This separation allows for different TypeScript settings between browser and Node.js environments.

## Routing and Navigation


The project uses React Router for client-side routing with a catch-all redirect setup:

1. The `public/_redirects` file tells the server to redirect all requests to `index.html`
2. When a page is not found, React Router renders the `NotFound` component (`src/pages/NotFound.tsx`)
3. This enables client-side routing while ensuring proper handling of 404 cases

## Build Configuration

### Tailwind CSS

The project uses Tailwind CSS with a custom configuration (`tailwind.config.js`) that:

- Scans all HTML/JS/TS/TSX files for classes
- Extends the default theme with custom design tokens
- Defines semantic color variables for:
  - Background colors (primary, secondary, tertiary, inverse)
  - Text colors (primary, secondary, tertiary, inverse)
  - Border colors (primary, secondary)
  - Action colors (primary, secondary with hover states)

### Vite

Vite configuration (`vite.config.ts`) includes:

- React plugin for JSX/TSX support
- Custom sitemap generation during build
- Optimized chunk splitting:
  - Vendor bundle for React and routing
  - Automatic code splitting for optimal loading
- Development server with hot module replacement

## License

All rights reserved.