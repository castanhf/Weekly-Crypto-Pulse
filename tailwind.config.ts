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
        line: '#d0d5dd',
        paper: '#fcfcfd'
      }
    }
  },
  plugins: []
};

export default config;
