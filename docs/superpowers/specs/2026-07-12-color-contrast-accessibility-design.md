# Design Specification: ZQ Removals Readability & Color Contrast Overhaul

## Status
- **Date:** 2026-07-12
- **Author:** Antigravity (AI Pair Programmer)
- **Status:** Proposed (Awaiting User Review)

---

## 1. Context & Objectives
The ZQ Removals website currently employs a luxurious dark theme (deep greens, warm golds, ivory, and white). However, the site suffers from critical readability and contrast issues:
- Dark green headings/text blending into dark green card/section backgrounds.
- Body copy and optional descriptions using overly low opacity (below 0.50).
- Orange accents and button indicators conflicting with the warm gold brand direction.
- Faint card borders and identical section backgrounds reducing visual separation.
- Low-contrast form fields, placeholders, and interactive elements.

This spec outlines the plan to improve legibility, accessibility, and visual separation across the entire website on both desktop and mobile layouts, conforming to WCAG 2.2 contrast standards (4.5:1 minimum for normal copy, 3:1 for large headings/boundaries).

---

## 2. Approach: Token Consolidation & Mapped Compatibility (Approach A)
We will define and consolidate all color rules around standard high-contrast `--zq-*` variables. To avoid breaking strict regular expression assertions in the regression test suite (which check for old variables like `--premium-orange`, `--premium-ink`, and `--color-surface-strong`), we will keep legacy definitions in place but dynamically map them to our new variables.

### Shared Design Tokens
```css
:root {
  /* Final High-Contrast Shared Design Tokens */
  --zq-bg-deep: #050a08;
  --zq-bg: #0a1410;
  --zq-surface: #12221c;
  --zq-surface-soft: #111f1b;
  --zq-surface-elevated: #1b2f2a;
  --zq-surface-light: #223b34;

  --zq-gold: #c9a86a;
  --zq-gold-light: #e3c98f;
  --zq-gold-dark: #9f7d42;

  --zq-text-primary: #f7f4ed;
  --zq-text-secondary: rgba(247, 244, 237, 0.84);
  --zq-text-muted: rgba(247, 244, 237, 0.72);
  --zq-text-subtle: rgba(247, 244, 237, 0.60);

  --zq-border-soft: rgba(255, 255, 255, 0.14);
  --zq-border-strong: rgba(255, 255, 255, 0.22);
  --zq-border-gold: rgba(201, 168, 106, 0.40);

  --zq-success: #65d69a;
  --zq-error: #f08b8b;

  /* Legacy mapping layer to direct all legacy styles to our new contrast system */
  --zq-ink: var(--zq-bg-deep);
  --zq-ink-2: var(--zq-surface);
  --zq-paper: var(--zq-surface);
  --zq-page: var(--zq-bg);
  --zq-soft: var(--zq-surface-elevated);
  --zq-field: var(--zq-surface-soft);
  --zq-copy: var(--zq-text-primary);
  --zq-muted-copy: var(--zq-text-secondary);
  --zq-line: var(--zq-border-gold);
  --zq-line-dark: var(--zq-border-soft);
  --zq-accent: var(--zq-gold);
  --zq-accent-2: var(--zq-gold-light);
  --zq-success-deep: var(--zq-success);

  /* Test-required legacy bindings */
  --premium-ink: var(--zq-bg-deep);
  --premium-ink-soft: var(--zq-surface);
  --premium-cream: var(--zq-bg);
  --premium-paper: var(--zq-surface);
  --premium-mist: var(--zq-surface-elevated);
  --premium-orange: var(--zq-gold);
  --premium-orange-dark: var(--zq-gold-dark);
  --premium-lime: var(--zq-success);
  --premium-copy: var(--zq-text-primary);
  --premium-muted: var(--zq-text-muted);
  --premium-line: var(--zq-border-gold);
  --premium-line-dark: var(--zq-border-soft);
}
```

---

## 3. UI Overhauls

### 3.1 Text Hierarchy
- **Primary Text:** `#f7f4ed` (`--zq-text-primary`) for main titles, H1s, and main navigation links.
- **Secondary / Body Text:** `rgba(247, 244, 237, 0.84)` (`--zq-text-secondary`) or brighter.
- **Secondary Descriptions:** `rgba(247, 244, 237, 0.72)` (`--zq-text-muted`) for supporting text.
- **Optional Metadata:** `rgba(247, 244, 237, 0.60)` (`--zq-text-subtle`).
- **Highlights & Accents:** Gold variables only, never for full body paragraphs.

### 3.2 Visual Separation
- **Page Background:** `#050a08` or `#0a1410` (standard).
- **Cards & Inner Panels:** `#12221c` with visible borders (`--zq-border-soft`).
- **Forms & Elevated Panels:** `#1b2f2a` with `--zq-border-strong`.
- **FAQ rows:** Add strong visual spacing and borders between items.
- **Interactive elements (Links, buttons, suburb list items):** Add hover styles with a gold border and elevated background `#223b34`.

### 3.3 Header, Dropdown, & Footer
- Desktop nav and mobile menu links using ivory `#f7f4ed`.
- Dropdown sub-panels will use `--zq-surface-elevated` (`#1b2f2a`) with text descriptions boosted to `--zq-text-secondary` for visibility.
- Utility-bar text using `--zq-text-primary`.
- Sticky header scrolled state will have solid `--zq-bg` to prevent background blending.

### 3.4 Forms
- Input fields, selects, textareas will default to:
  ```css
  background: var(--zq-surface-soft); /* #111f1b */
  color: var(--zq-text-primary); /* #f7f4ed */
  border-color: rgba(255, 255, 255, 0.20);
  ```
- Focus states will highlight the borders with `--zq-gold` and a visible gold focus outline ring.

### 3.5 Animated Advertisement (ZQApartmentAd)
- Strengthen bottom-to-top dark overlay gradient (`linear-gradient(to top, rgba(5, 10, 8, 0.85) 0%, rgba(5, 10, 8, 0.2) 100%)`) inside each ad scene container.
- Use a solid or stronger side overlay (`rgba(5, 10, 8, 0.55)`) where photos are busy.
- Maintain play, pause, replay controls and CTA visibility.

---

## 4. Rebuild & Build Process (Astro Rebuild & Sync)
To avoid manual dual maintenance between `premium-site.css` (root) and `src/styles/premium-site.css` (Astro/Vite framework copy), we will configure the main generator script `scripts/build-site.mjs` to automatically clone the root stylesheet to the frameworks directory at the start of execution:

```javascript
// At the beginning of build-site.mjs (before execSync('npx astro build'))
const rootCssPath = path.join(projectRoot, 'premium-site.css');
const astroCssPath = path.join(projectRoot, 'src', 'styles', 'premium-site.css');
await copyFile(rootCssPath, astroCssPath);
```

---

## 5. Verification Plan
1. Run `npm run build` to verify there are no compilation errors.
2. Run `npm test` to verify all 9 regression test suites pass.
3. Review pages using Chrome DevTools MCP inside a simulated headless browser:
   - Check Homepage hero contrast
   - Inspect forms and inputs contrast
   - Inspect FAQ rows contrast
   - View visual separations in mobile/desktop viewports
   - Take screenshots of key components
