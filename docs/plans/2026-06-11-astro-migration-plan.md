# Astro & Tailwind Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebuild the ZQ Removals static site using Astro, Tailwind CSS, and TypeScript while preserving all existing routes, SEO copy, metadata, schemas, and API functionality.

**Architecture:** We use Astro's static site generation (SSG) with a single catch-all dynamic route `src/pages/[...slug].astro` that resolves routes from `site-src/pages.json`. A custom layout wraps the body content, injecting SEO meta tags and JSON-LD schemas.

**Tech Stack:** Astro, Tailwind CSS, TypeScript, LightningCSS, and sharp.

---

### Task 1: Install Dependencies & Setup Configurations

**Files:**
- Create: `astro.config.mjs`
- Create: `tailwind.config.mjs`
- Create: `tsconfig.json`
- Modify: `package.json`

**Step 1: Update package.json & config files**
Add Astro, Tailwind CSS, and TypeScript packages to `package.json`.
Create `astro.config.mjs` with `site-dist` as the build output directory and Tailwind integration enabled.
Create `tailwind.config.mjs` with custom color definitions (dark slate, navy, gold).
Create `tsconfig.json` for TypeScript.

**Step 2: Run npm install**
Verify packages are installed and that `npx astro --version` executes.

**Step 3: Commit**
`git add package.json package-lock.json astro.config.mjs tailwind.config.mjs tsconfig.json`
`git commit -m "feat: install astro and tailwind configuration files"`

---

### Task 2: Create Base Layout (`src/layouts/Layout.astro`)

**Files:**
- Create: `src/layouts/Layout.astro`

**Step 1: Write Layout.astro**
Implement the HTML5 wrapper with:
- Dynamic metadata (`title`, `description`, `canonical`, `robots`, `theme-color`).
- Open Graph and Twitter Card tags.
- Injected `<script type="application/ld+json">` elements mapping custom schema JSON-LD strings.
- Stylings combining Tailwind utilities and transitions.

**Step 2: Verify compile**
Verify that the layout compiles correctly.

**Step 3: Commit**
`git add src/layouts/Layout.astro`
`git commit -m "feat: add Base Layout with dynamic SEO and schema markup"`

---

### Task 3: Create Header, Footer, and QuoteForm Components

**Files:**
- Create: `src/components/Header.astro`
- Create: `src/components/Footer.astro`
- Create: `src/components/QuoteForm.astro`

**Step 1: Implement Header and Footer**
Header: Responsive navigation with mobile menu drawer and gold Accent CTA.
Footer: Trust links, local hubs, ABN details, and contact info.

**Step 2: Implement QuoteForm**
Build the form fields matching the exact property mapping expected by `api/quote.js` with client-side POST submission handling.

**Step 3: Commit**
`git add src/components/`
`git commit -m "feat: add Header, Footer, and QuoteForm UI components"`

---

### Task 4: Catch-All Dynamic Route (`src/pages/[...slug].astro`)

**Files:**
- Create: `src/pages/[...slug].astro`

**Step 1: Implement catch-all route compilation**
Define `getStaticPaths()` to map pages in `site-src/pages.json`.
Read each page's dynamic content from its mapped `contentFile` using node `fs/promises`.
Render using `<Layout>` and pass all metadata and structured data.
Ensure redirect layouts output the correct `<meta http-equiv="refresh" content="..." />` tags.

**Step 2: Run test compile**
Run: `npx astro build`
Verify build output maps pages directly to `site-dist/`.

**Step 3: Commit**
`git add src/pages/[...slug].astro`
`git commit -m "feat: add catch-all dynamic SSG router for pages.json"`

---

### Task 5: Integration & Verification

**Files:**
- Modify: `scripts/build-site.mjs`

**Step 1: Update build-site.mjs wrapper**
Replace the custom generation engine with a simple wrapper executing `npx astro build` (using `execSync`) and performing any necessary post-build sitemap copies, ensuring full compatibility with existing tests.

**Step 2: Run test suite**
Run: `npm test`
Expected: ALL 14 SEO tests pass successfully.

**Step 3: Commit**
`git add scripts/build-site.mjs`
`git commit -m "feat: wrap astro build in build-site.mjs script"`
