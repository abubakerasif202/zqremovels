// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import { PurgeCSS } from 'purgecss';

export default defineConfig({
  site: 'https://zqremovalsadelaide.com.au',
  outDir: './site-dist',
  vite: {
    plugins: [tailwindcss(), {
      name: 'zq-animate-subset',
      enforce: 'pre',
      async transform(code, id) {
        if (!id.replaceAll('\\', '/').endsWith('/animate.css/animate.min.css')) return;
        // Keep the existing Layout import; ship only the effect used by site.js.
        const [result] = await new PurgeCSS().purge({
          content: [{ raw: 'animate__animated animate__fadeIn', extension: 'html' }],
          css: [{ raw: code }],
          keyframes: true,
        });
        return { code: result.css, map: null };
      },
    }]
  }
});
