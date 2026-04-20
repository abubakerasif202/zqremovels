# ZQ SEO V4 Scale System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a safe, generator-driven expansion layer for suburb intent coverage, internal linking, conversion CTAs, and guide authority without breaking the existing V3 cluster architecture.

**Architecture:** Extend `scripts/build-site.mjs` with a structured V4 registry that describes suburb cluster traits, intent eligibility, and link targets. Use those traits to render differentiated suburb content blocks and route-aware CTAs at build time, then validate the output with generator-level regression tests and sitemap checks.

**Tech Stack:** Node.js ESM, static HTML generation, `site-src/pages.json`, `scripts/build-site.mjs`, Node test runner.

---

### Task 1: Add a structured V4 suburb registry

**Files:**
- Modify: `scripts/build-site.mjs`
- Test: `tests/seo-conversion-pass.test.mjs`

- [ ] **Step 1: Write the failing test**

```js
test('v4 suburb registry differentiates pages by region, inventory, access, and intent fit', () => {
  const page = readDist(path.join('removalists-glenelg', 'index.html'));

  assert.match(page, /coastal/i);
  assert.match(page, /apartment/i);
  assert.match(page, /packing/i);
  assert.match(page, /interstate/i);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/seo-conversion-pass.test.mjs -t "v4 suburb registry differentiates pages by region, inventory, access, and intent fit" -v`
Expected: FAIL because the generator still uses the current non-V4 suburb registry shape.

- [ ] **Step 3: Implement the registry**

Add a `suburbV4Registry` object with entries for at least:
- `glenelg`
- `mawson-lakes`
- `marion`
- `salisbury`
- `elizabeth`
- `reynella`
- `noarlunga`
- `adelaide-cbd`

Each entry must expose:
- `region`
- `inventory`
- `access`
- `intents`
- `nearbyCorridors`
- `ctaTheme`

Wire the existing suburb renderer to read these traits and surface them in the page output as differentiated paragraphs, bullet points, and contextual CTA copy.

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test tests/seo-conversion-pass.test.mjs -t "v4 suburb registry differentiates pages by region, inventory, access, and intent fit" -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add scripts/build-site.mjs tests/seo-conversion-pass.test.mjs
git commit -m "feat: add v4 suburb trait registry"
```

### Task 2: Add intent blocks and contextual CTAs to suburb pages

**Files:**
- Modify: `scripts/build-site.mjs`
- Test: `tests/seo-conversion-pass.test.mjs`

- [ ] **Step 1: Write the failing test**

```js
test('supported suburb pages include intent blocks and contextual ctas', () => {
  const cbdPage = readDist(path.join('removalists-adelaide-cbd', 'index.html'));
  const glenelgPage = readDist(path.join('removalists-glenelg', 'index.html'));

  assert.match(cbdPage, /Book apartment move|Book office relocation|Get suburb-specific quote/i);
  assert.match(glenelgPage, /Plan coastal move|Get suburb-specific quote/i);
  assert.match(cbdPage, /interstate removals from Adelaide CBD/i);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/seo-conversion-pass.test.mjs -t "supported suburb pages include intent blocks and contextual ctas" -v`
Expected: FAIL because the current suburb template only emits one generic CTA cluster.

- [ ] **Step 3: Implement intent blocks**

Add a renderer that conditionally injects:
- furniture intent block
- office intent block
- packing intent block
- interstate intent block

Use suburb traits to decide which blocks appear. Keep the text concise and route-specific. Add route-aware CTA labels such as:
- `Book apartment move`
- `Plan coastal move`
- `Book office relocation`
- `Get suburb-specific quote`

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test tests/seo-conversion-pass.test.mjs -t "supported suburb pages include intent blocks and contextual ctas" -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add scripts/build-site.mjs tests/seo-conversion-pass.test.mjs
git commit -m "feat: add suburb intent blocks and ctas"
```

### Task 3: Replace static related links with rule-based link injection

**Files:**
- Modify: `scripts/build-site.mjs`
- Test: `tests/seo-conversion-pass.test.mjs`

- [ ] **Step 1: Write the failing test**

```js
test('pages receive varied internal links by page type and region', () => {
  const marionPage = readDist(path.join('removalists-marion', 'index.html'));
  const guidePage = readDist(path.join('adelaide-moving-guides', 'packing-checklist-adelaide', 'index.html'));

  assert.match(marionPage, /href="\/packing-services-adelaide\/"/);
  assert.match(marionPage, /href="\/removalists-southern-adelaide\/"/);
  assert.match(guidePage, /href="\/removalists-marion\/"/);
  assert.match(guidePage, /href="\/house-removals-adelaide\/"/);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/seo-conversion-pass.test.mjs -t "pages receive varied internal links by page type and region" -v`
Expected: FAIL until link selection is trait-based.

- [ ] **Step 3: Implement rule-based link selection**

Create a small selector that:
- chooses 1-2 money pages
- chooses 1 hub page
- chooses 1 supporting guide
- avoids repeated anchors
- varies links by `pageType`, `region`, and `intent`

Use it for suburb pages, hubs, and guides instead of only the current static bundles.

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test tests/seo-conversion-pass.test.mjs -t "pages receive varied internal links by page type and region" -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add scripts/build-site.mjs tests/seo-conversion-pass.test.mjs
git commit -m "feat: add rule-based internal link injection"
```

### Task 4: Add the V4 guide set

**Files:**
- Modify: `site-src/pages.json`
- Add: `site-src/content/adelaide-moving-guides/pricing-breakdown-adelaide/index.html`
- Add: `site-src/content/adelaide-moving-guides/how-long-moves-take-adelaide/index.html`
- Add: `site-src/content/adelaide-moving-guides/best-time-to-move-adelaide/index.html`
- Add: `site-src/content/adelaide-moving-guides/avoiding-damage-adelaide/index.html`
- Add: `site-src/content/adelaide-moving-guides/storage-planning-adelaide/index.html`
- Test: `tests/seo-conversion-pass.test.mjs`

- [ ] **Step 1: Write the failing test**

```js
test('new authority guides are indexed and linked from the guide hub', () => {
  const guideHub = readDist(path.join('adelaide-moving-guides', 'index.html'));
  for (const href of [
    '/adelaide-moving-guides/pricing-breakdown-adelaide/',
    '/adelaide-moving-guides/how-long-moves-take-adelaide/',
    '/adelaide-moving-guides/best-time-to-move-adelaide/',
    '/adelaide-moving-guides/avoiding-damage-adelaide/',
    '/adelaide-moving-guides/storage-planning-adelaide/',
  ]) {
    assert.match(guideHub, new RegExp(`href="${href.replace(/\//g, '\\/')}"`));
  }
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/seo-conversion-pass.test.mjs -t "new authority guides are indexed and linked from the guide hub" -v`
Expected: FAIL because the pages do not exist yet.

- [ ] **Step 3: Add the five guide pages**

Create concise, high-intent guide content that:
- answers the planning question
- links to at least one service page
- links to at least one suburb or hub page
- includes a quote CTA

Add the pages to `pages.json` with canonical apex URLs and indexable robots.

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test tests/seo-conversion-pass.test.mjs -t "new authority guides are indexed and linked from the guide hub" -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add site-src/pages.json site-src/content/adelaide-moving-guides/pricing-breakdown-adelaide/index.html site-src/content/adelaide-moving-guides/how-long-moves-take-adelaide/index.html site-src/content/adelaide-moving-guides/best-time-to-move-adelaide/index.html site-src/content/adelaide-moving-guides/avoiding-damage-adelaide/index.html site-src/content/adelaide-moving-guides/storage-planning-adelaide/index.html tests/seo-conversion-pass.test.mjs
git commit -m "feat: add v4 authority guides"
```

### Task 5: Tighten sitemap and orphan controls

**Files:**
- Modify: `tests/search-console-fixes.test.mjs`
- Modify: `tests/seo-conversion-pass.test.mjs`
- Modify: `scripts/build-site.mjs` only if sitemap inclusion rules need code changes

- [ ] **Step 1: Write the failing test**

```js
test('new v4 experimental pages stay out of the sitemap unless intentionally indexable', () => {
  const sitemap = readDist('sitemap.xml');
  assert.doesNotMatch(sitemap, /premium-moving-concepts/);
  assert.doesNotMatch(sitemap, /thank-you\.html/);
  assert.doesNotMatch(sitemap, /404\.html/);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/search-console-fixes.test.mjs -t "new v4 experimental pages stay out of the sitemap unless intentionally indexable" -v`
Expected: FAIL only if sitemap inclusion logic regresses.

- [ ] **Step 3: Align generator and tests**

If needed, update the sitemap filter logic to explicitly exclude:
- redirect pages
- `404.html`
- `thank-you.html`
- `noindex` pages
- `premium-moving-concepts/**`

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test tests/search-console-fixes.test.mjs -t "new v4 experimental pages stay out of the sitemap unless intentionally indexable" -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add scripts/build-site.mjs tests/search-console-fixes.test.mjs
git commit -m "feat: tighten sitemap controls for v4"
```

### Task 6: Validate the full build and regression surface

**Files:**
- None

- [ ] **Step 1: Run the full build**

Run: `npm run build`
Expected: exit code `0` and regenerated `site-dist/` output for the new pages.

- [ ] **Step 2: Run the full test suite**

Run: `npm test`
Expected: exit code `0`.

- [ ] **Step 3: Spot-check generated output**

Confirm:
- new suburb pages contain differentiated region/inventory/access copy
- contextual CTAs appear on supported pages
- guide hub links to the new guides
- sitemap contains only intended indexable routes
- no mixed-host canonical output is present

- [ ] **Step 4: Commit any final fixes**

```bash
git add .
git commit -m "feat: ship zq seo v4 scale system"
```

