import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        ink: '#101828',
        muted: '#94a3b8',
        line: '#CBD5E1',
        paper: '#F5F7FA',
        brand: '#1e3a5f',
        canvas: '#0d1b2e',
        surface: '#132238',
        accent: '#F7931A',
        'accent-hover': '#e07d10',
        'regime-risk-on': '#16a34a',
        'regime-risk-off': '#dc2626',
        'regime-range-bound': '#d97706',
        'regime-transition': '#94a3b8'
      }
    }
  },
  plugins: []
};

export default config;
