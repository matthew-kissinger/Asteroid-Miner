import type { Config } from 'tailwindcss';

export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
    './js/**/*.{ts,tsx}',
  ],
} satisfies Config;
