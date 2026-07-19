# ZQ Removals Color Contrast & Accessibility Overhaul Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Improve the readability, color contrast, visual separation, and accessibility of the entire ZQ Removals website, using the brand-approved color palette and target contrast ratios, while keeping all regression tests passing.

**Architecture:** We will consolidate variables in the `:root` block of `premium-site.css` (root) and define mappings for legacy variables. We will update section backgrounds, card containers, form fields, and typography elements. A build-level sync will copy the root CSS to `src/styles/` automatically.

**Tech Stack:** HTML5, Vanilla CSS, Vite, Astro, Playwright, http-server, LightningCSS.

---

### Task 1: Auto-Sync CSS Build Configuration

**Files:**
- Modify: `scripts/build-site.mjs:2475-2480`

**Step 1: Write the sync logic**
Add file copying logic at the start of the build process in `scripts/build-site.mjs` before executing `npx astro build`:

```javascript
  console.log('Syncing root stylesheet to Astro styles...');
  await copyFile(
    path.join(projectRoot, 'premium-site.css'),
    path.join(projectRoot, 'src', 'styles', 'premium-site.css')
  );
```

**Step 2: Run build to verify**
Run: `npm --prefix C:\Users\abuba\zq run build`
Expected: Passes and builds successfully, and `src/styles/premium-site.css` matches the content of `premium-site.css`.

**Step 3: Commit**
```bash
git add scripts/build-site.mjs
git commit -m "build: auto-sync premium-site.css to src/styles/ during build"
```

---

### Task 2: Standardize Design Variables in Root Stylesheet

**Files:**
- Modify: `premium-site.css:10497-10555`

**Step 1: Update `:root` variables**
Replace the `:root` block starting around line 10497 in `premium-site.css` with the updated design tokens:

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
  --premium-shadow: var(--zq-shadow);
  --premium-radius: var(--zq-radius);

  --color-bg: var(--zq-page);
  --color-bg-soft: var(--zq-paper);
  --color-bg-accent: var(--zq-ink);
  --color-surface: var(--zq-paper);
  --color-surface-strong: #10231f; /* test assertion requirement */
  --color-text: var(--zq-copy);
  --color-text-soft: var(--zq-muted-copy);
  --color-text-inverse: var(--zq-page);
  --color-heading: var(--zq-copy);
  --color-accent: var(--zq-accent-2);
  --color-accent-strong: var(--zq-accent-2);
  --color-accent-tint: rgba(201, 168, 106, 0.11);
  --color-border: var(--zq-line);
  --color-border-strong: var(--zq-line-dark);
  --content-width: 1200px;
  --content-narrow: 760px;
  --radius: var(--zq-radius);
  --header-height: 5.9rem;
  --font-body: "Inter", "Segoe UI", sans-serif;
  --font-heading: "Fraunces", Georgia, serif;
}
```

**Step 2: Run build and tests**
Run: `npm --prefix C:\Users\abuba\zq run build && npm --prefix C:\Users\abuba\zq test`
Expected: Passes.

**Step 3: Commit**
```bash
git add premium-site.css
git commit -m "style: define new design system tokens and map legacy variables"
```

---

### Task 3: Visual separation (Sections, Cards, and FAQs)

**Files:**
- Modify: `premium-site.css` (various sections)

**Step 1: Set section backgrounds**
Map `.section` to use standard variables:
```css
.section { background: var(--zq-bg); }
.section-soft, .section-mist { background: var(--zq-surface-soft); }
```

**Step 2: Update card styling**
Ensure `.service-card`, `.value-card`, `.review-card`, `.route-card`, `.guide-card`, `.testimonial-card` use `--zq-surface` with `--zq-border-soft` borders, and high contrast hover background `--zq-surface-light` with `--zq-border-gold` border.

**Step 3: Update FAQ accordion separators**
Ensure closed FAQ headers stand out and text inside them uses primary text. Add visible border to `.faq-item` using `--zq-border-soft`.

**Step 4: Run build and test**
Run: `npm --prefix C:\Users\abuba\zq run build && npm --prefix C:\Users\abuba\zq test`
Expected: Passes.

**Step 5: Commit**
```bash
git commit -am "style: separate sections and cards with custom background and borders"
```

---

### Task 4: Text legibility and paragraph contrast

**Files:**
- Modify: `premium-site.css`

**Step 1: Heading and body styling**
Update text color of paragraphs, list items, and captions to `--zq-text-secondary` (`rgba(247, 244, 237, 0.84)`) or brighter by default. Ensure small descriptions are at least `--zq-text-muted` (`rgba(247, 244, 237, 0.72)`).
Ensure headings (H1, H2, H3) are set to `--zq-text-primary`.

**Step 2: Remove transparency on body copy**
Remove inline `opacity-50` or direct opacity overrides on readable copy.

**Step 3: Run build and test**
Run: `npm --prefix C:\Users\abuba\zq run build && npm --prefix C:\Users\abuba\zq test`
Expected: Passes.

**Step 4: Commit**
```bash
git commit -am "style: set solid body and heading text colors to enforce minimum 4.5:1 contrast"
```

---

### Task 5: Header, Dropdowns, and Utility Bar Overhauls

**Files:**
- Modify: `premium-site.css`, `site-src/partials/header.html`

**Step 1: Header layout color fixes**
Boost navigation link colors to `#f7f4ed` for default state, and `--zq-gold` for active links/hover.
Set utility bar message to `--zq-text-primary`.
Ensure sticky header uses solid background `var(--zq-bg)`.

**Step 2: Dropdown menus visual elevation**
Set dropdown menus background to `var(--zq-surface-elevated)` (`#1b2f2a`) and dropdown description color to `rgba(247, 244, 237, 0.84)`.

**Step 3: Run build and test**
Run: `npm --prefix C:\Users\abuba\zq run build && npm --prefix C:\Users\abuba\zq test`
Expected: Passes.

**Step 4: Commit**
```bash
git commit -am "style: increase navbar, dropdown, and utility bar readability"
```

---

### Task 6: Lead / Quote Forms Contrast

**Files:**
- Modify: `premium-site.css`, `src/components/QuoteForm.astro`

**Step 1: Input and select text contrast**
Ensure `input`, `select`, `textarea` use:
```css
background: var(--zq-surface-soft); /* #111f1b */
color: var(--zq-text-primary); /* #f7f4ed */
border: 1px solid rgba(255, 255, 255, 0.20);
```
Ensure placeholder color is `rgba(247, 244, 237, 0.60)`. Label colors must be brighter than placeholders. Focus state must use `--zq-gold` border.

**Step 2: Run build and test**
Run: `npm --prefix C:\Users\abuba\zq run build && npm --prefix C:\Users\abuba\zq test`
Expected: Passes.

**Step 3: Commit**
```bash
git commit -am "style: improve form inputs, placeholders, and interactive states contrast"
```

---

### Task 7: Animated Advertisement (ZQApartmentAd) Readability

**Files:**
- Modify: `src/components/ZQApartmentAd.astro`

**Step 1: Dark bottom-to-top gradient overlays**
Strengthen the gradient overlay within the slides so text overlaying bright images remains legible.
Add a dark side panel overlay or full screen dimming where necessary.
Ensure CTA button and play/pause controls have high contrast background.

**Step 2: Run build and test**
Run: `npm --prefix C:\Users\abuba\zq run build && npm --prefix C:\Users\abuba\zq test`
Expected: Passes.

**Step 3: Commit**
```bash
git commit -am "style: add dark overlays and adjust scene text contrast inside ZQApartmentAd"
```

---

### Task 8: Verification, Visual QA, and Final Report

**Files:**
- None

**Step 1: Run full test suite**
Run: `npm --prefix C:\Users\abuba\zq test`
Expected: All 9 test cases pass.

**Step 2: Take final screenshots**
Take screenshots of Homepage Hero, Services section, Animated Ad, Quote Form, FAQ, Header, Dropdown, Footer, Suburb Page, Contact Page, and compile a final QA report for review.
