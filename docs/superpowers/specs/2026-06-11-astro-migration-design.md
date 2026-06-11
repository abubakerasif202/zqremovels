# Astro & Tailwind Migration Design Spec - ZQ Removals

**Goal:** Rebuild the ZQ Removals website using Astro, Tailwind CSS, and TypeScript to maximize performance, achieve 95+ Core Web Vitals, and maintain 100% parity with existing local SEO rankings, page structures, sitemaps, and schemas.

**Architecture:** SSG catch-all routing dynamically rendered from `site-src/pages.json` manifest. The old custom static builder is replaced by `astro build` while maintaining parity of content, and Vercel serverless function `/api/quote.js` is preserved.

**Tech Stack:** Astro, Tailwind CSS, TypeScript, LightningCSS (for minification), sharp (for image optimization), and Node.js test runner.

---

## 1. Project Structure

The project directory structure will align with the standard Astro template:

```
├── astro.config.mjs          # Astro configuration
├── tailwind.config.mjs       # Tailwind CSS configuration
├── tsconfig.json             # TypeScript configuration
├── package.json              # Astro & Tailwind dependencies
├── scripts/
│   └── build-site.mjs        # Updated to run `astro build` internally
├── api/
│   └── quote.js              # Preserved Vercel serverless function
├── public/                   # Static assets (fonts, media)
└── src/
    ├── layouts/
    │   └── Layout.astro      # Main Layout component (SEO & Schema tags)
    ├── components/
    │   ├── Header.astro      # Premium header navigation
    │   ├── Footer.astro      # Premium footer
    │   └── QuoteForm.astro   # Touch-optimized lead form
    └── pages/
        └── [...slug].astro   # Catch-all page compiler
```

---

## 2. Component Design & Layouts

### 2.1 Base Layout (`src/layouts/Layout.astro`)
The layout will wrap the children `<slot />` and handle all dynamic SEO tags:
- Page Title and Meta Description.
- Canonical URL, Theme Color, and Robots directions.
- Open Graph and Twitter Card tags.
- Dynamic Schema injection.

### 2.2 Header (`src/components/Header.astro`)
A premium, responsive navigation header:
- Desktop: Clean menu with links to Services, Guides, and Contact.
- Mobile: Hamburger toggle with touch-friendly navigation drawer.
- High contrast "Request Quote" CTA button.

### 2.3 Footer (`src/components/Footer.astro`)
The footer provides structural trust signals:
- Business identifiers: ZQ Removals ABN, Address, and Phone.
- Links to Adelaide Hubs (CBD, Norwood, Glenelg, Marion, Salisbury, Elizabeth).
- Quick links to Services and Moving Guides.
- Social links and accreditation badges.

### 2.4 Quote Form (`src/components/QuoteForm.astro`)
A high-converting, validation-enabled form that matches the payload schema expected by `api/quote.js`. Serves both as interactive client-side AJAX requests (returning JSON success messages) and fallback standard POST submissions (redirecting to `/thank-you/`).

---

## 3. Dynamic Routing & Code Pipeline

### 3.1 Catch-All Page (`src/pages/[...slug].astro`)
Reads `site-src/pages.json` and uses `getStaticPaths()` to build all static routes.
- Maps redirects, core pages, suburb pages, and guides.
- Renders standard layout with header, footer, page-specific body HTML, and JSON-LD schemas.
- Outputs redirect pages using `<meta http-equiv="refresh" content="0; url=..." />` for legacy HTML URLs.

### 3.2 Astro Build Config (`astro.config.mjs`)
- Configured to output statically (`output: 'static'`).
- Sets `outDir: './site-dist'` to place compiled output directly into the directory scanned by the existing test suite.
- Integrates Tailwind CSS.

---

## 4. Design & Aesthetic Guidelines

- **Typography:** Outfit/Inter Google Font imports.
- **Color Scheme:** Dark Blue/Navy theme:
  - Dark Slate/Navy (`#0A192F`, `#172A45`)
  - Accent Gold (`#F5A623`)
  - Warm White/Light Slate text over dark sections.
- **Animations:** Subtle CSS transitions on hover, fade-in for page loads, and active states for forms.

---

## 5. Testing & Verification

- `npm run build` runs `astro build` and generates the site into `site-dist/`.
- `npm test` executes all Node test files under `tests/` to check for HTML tag structural parity, canonical domains, sitemap correctness, schema validity, and absence of broken relative URLs.
