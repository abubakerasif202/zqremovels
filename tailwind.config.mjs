// tailwind.config.mjs
// NOTE: Tailwind CSS v4 (@tailwindcss/vite) uses CSS-first configuration.
// This file is NOT the primary config for v4 — configuration lives in
// src/styles/premium-site.css via @import "tailwindcss" + @import "daisyui/daisyui.css".
// This file is kept for tooling compatibility.
import daisyui from "daisyui";

export default {
  content: [
    "./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx}",
    "./site-src/**/*.{html,js}",
    "./public/**/*.html",
  ],
  theme: {
    extend: {},
  },
  plugins: [daisyui],
  daisyui: {
    themes: ["light"],
  },
};