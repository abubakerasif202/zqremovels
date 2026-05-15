# ZQ Removals V6 Bridge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the highest-impact V6 improvements: GA4 event tracking, UTM standardization for GBP, sticky mobile CTA, and dynamic FAQs for interstate routes.

**Architecture:** 
1.  **Tracking:** Inject GA4 event listeners and UTM capture into `site.js` and `analytics.mjs`.
2.  **GBP UTMs:** Hardcode the standardized UTM parameters into the Google Business Profile links in `footer.html`.
3.  **Sticky Mobile CTA:** Update `premium-site.css` to ensure the existing `sticky-mobile-cta` is highly visible and optimized for mobile conversion.
4.  **Dynamic FAQs:** Update `site-src/data/seo-v4.mjs` to ensure interstate route profiles generate dynamic FAQs to capture 'People Also Ask' search features.

**Tech Stack:** Vanilla JavaScript, CSS, Node.js (Static Site Generator).

---

### Task 1: Standardize GBP UTM Parameters

**Files:**
- Modify: `site-src/partials/footer.html`
- Test: `tests/seo-v7.test.mjs`

- [ ] **Step 1: Update Google Reputation link with standardized UTMs**

Modify: `site-src/partials/footer.html` (Line 71)
```html
<li><a href="https://share.google/Y04mpt9RTflWP3iRl?utm_source=google&utm_medium=organic&utm_campaign=gbp&utm_content=footer" rel="noopener noreferrer" target="_blank">Google Reputation</a></li>
```

- [ ] **Step 2: Run build and verify link in `site-dist`**

Run: `node scripts/build-site.mjs`
Check: `site-dist/index.html` for the updated link.

- [ ] **Step 3: Commit**

```bash
git add site-src/partials/footer.html
git commit -m "seo: standardize GBP UTM parameters in footer"
```

---

### Task 2: Implement V6 GA4 Event Tracking

**Files:**
- Modify: `analytics.mjs`
- Modify: `site.js`
- Test: `tests/tracking-v2.test.mjs`

- [ ] **Step 1: Add new V6 tracking functions to `analytics.mjs`**

Add this to `analytics.mjs`:
```javascript
export function trackStickyCtaClick(location = "sticky_cta") {
  const payload = withAttribution({ category: "conversion", label: "sticky_cta_click", location });
  dispatchEvent("sticky_cta_click", payload);
}
```

- [ ] **Step 2: Wire up events in `site.js`**

Update `setupConversionTracking` in `site.js` to handle sticky-cta clicks specifically:
```javascript
    if (anchor.closest("#sticky-cta")) {
      trackStickyCtaClick(inferClickLocation(anchor));
      return;
    }
```

- [ ] **Step 3: Run existing tracking tests**

Run: `node --test --test-concurrency=1 tests/tracking-v2.test.mjs`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add analytics.mjs site.js
git commit -m "tracking: implement V6 GA4 event listeners"
```

---

### Task 3: Optimize Sticky Mobile CTA for High-Contrast Conversion

**Files:**
- Modify: `premium-site.css`
- Test: Manual visual check (or Lighthouse CI)

- [ ] **Step 1: Enhance sticky CTA visibility and styling**

Modify: `premium-site.css`:
```css
.sticky-mobile-cta {
  background: var(--color-surface-strong);
  border-top: 2px solid var(--color-accent);
  box-shadow: 0 -12px 48px rgba(0, 0, 0, 0.5);
}

.sticky-mobile-cta .button-primary {
  box-shadow: 0 4px 12px rgba(210, 176, 106, 0.3);
}
```

- [ ] **Step 2: Run build and check mobile layout**

Run: `node scripts/build-site.mjs`

- [ ] **Step 3: Commit**

```bash
git add premium-site.css
git commit -m "ui: optimize sticky mobile CTA for conversion"
```

---

### Task 4: Ensure Dynamic FAQs for Interstate Routes

**Files:**
- Modify: `site-src/data/seo-v4.mjs`
- Test: `tests/seo-v5.test.mjs`

- [ ] **Step 1: Verify FAQ rendering block is applied to all interstate routes**

Ensure `renderFaqSectionBlock` is correctly called in the interstate template section of `site-src/data/seo-v4.mjs`.

- [ ] **Step 2: Run SEO tests**

Run: `node --test --test-concurrency=1 tests/seo-v5.test.mjs`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add site-src/data/seo-v4.mjs
git commit -m "seo: ensure dynamic FAQ generation for all interstate routes"
```

---

### Task 5: Final Validation & Build

- [ ] **Step 1: Run full test suite**

Run: `$files = Get-ChildItem tests/*.test.mjs | Select-Object -ExpandProperty FullName; node --test --test-concurrency=1 $files`
Expected: ALL PASS

- [ ] **Step 2: Final Commit**

```bash
git status
```
