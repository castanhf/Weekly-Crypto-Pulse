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
        muted: '#475467',
        line: '#CBD5E1',
        paper: '#F5F7FA',
        brand: '#1a365d'
      }
    }
  },
  plugins: []
};

export default config;
