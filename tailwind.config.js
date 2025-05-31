import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: 'var(--color-background-primary)',
          primary: 'var(--color-background-primary)',
          secondary: 'var(--color-background-secondary)',
          tertiary: 'var(--color-background-tertiary)',
          inverse: 'var(--color-background-inverse)'
        },
        text: {
          DEFAULT: 'var(--color-text-primary)',
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          tertiary: 'var(--color-text-tertiary)',
          inverse: 'var(--color-text-inverse)'
        },
        border: {
          DEFAULT: 'var(--color-border-primary)',
          primary: 'var(--color-border-primary)',
          secondary: 'var(--color-border-secondary)'
        },
        action: {
          DEFAULT: 'var(--color-action-primary)',
          primary: 'var(--color-action-primary)',
          'primary-hover': 'var(--color-action-primary-hover)',
          secondary: 'var(--color-action-secondary)',
          'secondary-hover': 'var(--color-action-secondary-hover)'
        }
      }
    }
  },
  plugins: []
}

export default config;