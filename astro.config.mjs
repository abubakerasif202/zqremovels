// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://zqremovalsadelaide.com.au',
  outDir: './site-dist',
  vite: {
    plugins: [tailwindcss()]
  }
});
