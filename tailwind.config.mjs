/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        navy: '#0A192F',
        darkSlate: '#172A45',
        accentGold: '#F5A623',
      },
    },
  },
  plugins: [],
}
