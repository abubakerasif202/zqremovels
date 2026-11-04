# SEO Phase 2 Quality Audit Report — November 2026

Independent technical and content quality audit of the generated static site (`site-dist/`), source generators (`scripts/build-site.mjs`, `site-src/data/seo-v4.mjs`), and route registries (`site-src/pages.json`) for ZQ Removals Adelaide (`https://zqremovalsadelaide.com.au/`).

---

## 1. Scope and Methodology

- **Source of Truth Evaluated:**
  - `site-src/pages.json` (route registry & metadata)
  - `site-src/data/seo-v4.mjs` (dynamic schema, suburb copy generation, FAQ builders, keyword profiles)
  - `scripts/build-site.mjs` (static site generator, HTML post-processing, canonical enforcement, sitemap builder)
  - `site-dist/` (95 compiled static HTML outputs, including all 79 indexable sitemap URLs)
- **Quality Dimensions Audited:**
  1. Grammatical correctness and syntax
  2. Machine-generated or awkward AI sentence cadence
  3. Unnatural keyword repetition and keyword cannibalisation
  4. Repeated introductory patterns across 40+ suburb pages
  5. Low-value or duplicate boilerplate sections
  6. Generic or concatenated FAQ patterns
  7. Conflicting search intent between landing pages and informational guides
  8. Unnecessary or broken sections that damage readability
  9. Outdated, misleading, or conflicting customer-facing pricing information
  10. Content-to-CTA balance across customer conversion paths

---

## 2. Key Audit Findings

### Finding 1: Broken Anchor Text from Unconstrained Post-Processing Replacement
- **Affected URLs:** ~30 indexable pages (including `/removalists-adelaide-prices/`, `/adelaide-moving-guides/removalists-cost-adelaide/`, and commercial service pages).
- **Severity:** High
- **Problem:**
  In `scripts/build-site.mjs`, `applyVerifiedPricingLanguageToVisibleHtml()` executed a global regex replacement designed to replace generic "fixed price" mentions with "hourly rate" for legal pricing compliance. However, this regex matched indiscriminately inside comparison anchor tags and headings, converting `"Fixed price vs hourly"` into the nonsensical phrase `"Hourly rate vs hourly"`.
- **Evidence:**
  ```html
  <a href="/adelaide-moving-guides/hourly-vs-fixed-rate-removalists-adelaide/">Hourly rate vs hourly</a>
  ```
- **Root Cause:**
  Overly broad post-build string replacement lacking boundary constraints for comparison contexts.
- **Resolution Implemented:**
  Updated `applyVerifiedPricingLanguageToVisibleHtml()` in `scripts/build-site.mjs` to explicitly preserve comparison phrasing, rendering clean, professional anchor text: `"Fixed quote vs hourly rate"` and `"Hourly vs fixed quote"`.

---

### Finding 2: Ungrammatical Verb Concatenation in Dynamic Guide FAQs
- **Affected URLs:** All 5 indexable moving guides (`/adelaide-moving-guides/*`).
- **Severity:** Medium
- **Problem:**
  `buildGuideFaqItems()` in `site-src/data/seo-v4.mjs` concatenated the static clause `"by clarifying "` directly with profile `uniqueAngle` strings that already began with 3rd-person singular verbs (`"explains"`, `"focuses on"`). This generated ungrammatical double-verb phrasing in customer-facing FAQs and structured `FAQPage` JSON-LD schemas.
- **Evidence:**
  `"Why read this guide? It prepares your booking by clarifying explains the quote factors for 2-man and 3-man crews..."`
- **Root Cause:**
  String interpolation assumed noun phrases rather than inflected verb clauses.
- **Resolution Implemented:**
  Added `formatUniqueAngle()` helper in `site-src/data/seo-v4.mjs` that converts leading verbs (`explains` → `explaining`, `focuses` → `focusing`) or cleanly trims them, ensuring grammatically sound Australian English in both visible copy and JSON-LD markup.

---

### Finding 3: Formulaic Suburb Insight Patterns & Plural Subject-Verb Mismatches
- **Affected URLs:** 40 suburb landing pages (`/removalists-[suburb]/`).
- **Severity:** High
- **Problem:**
  1. *Grammar Defect:* Sentences dynamically assembled in `buildSuburbLocalInsightParagraphs()` paired plural subjects (`"Logistics"`, `"Access conditions"`, `"Clear routes"`) with singular verbs: `"...access is what changes the crew"`.
  2. *Awkward Phrasing:* Suburb pages repeated the council name twice in consecutive sentences with an artificial phrasing pattern: `"Places such as [Landmark 1] and [Landmark 2] only locate the address. Logistics are what changes the crew..."`.
  3. *Customer Impact:* The text felt noticeably AI-generated rather than helpful local removalist advice.
- **Evidence:**
  ```text
  "ZQ Removals coordinates moves across the City of Charles Sturt, with regular access around West Lakes Shore and Tennyson. Places such as West Lakes Shore and Tennyson only locate the address. Logistics is what changes the crew..."
  ```
- **Root Cause:**
  Templated text generator concatenating raw database fields without editorial syntactic variation or grammatical subject-verb agreement checks.
- **Resolution Implemented:**
  Refactored `buildSuburbLocalInsightParagraphs()` in `site-src/data/seo-v4.mjs`. Replaced robotic `"Places such as..."` boilerplate with natural Australian moving logistics:
  `"Moves in [Suburb] require advance planning for local access. While landmarks like [Landmark 1] and [Landmark 2] help locate the property, practical access factors—including driveway width, street parking availability, and walking distances—determine crew efficiency."` Fixed subject-verb agreements across all variations.

---

### Finding 4: Outdated Stale Rates in Commercial Office Removalist Metadata
- **Affected URLs:** `/office-removals-adelaide/`
- **Severity:** High
- **Problem:**
  In `site-src/pages.json`, the `<title>` and `<meta name="description">` for the primary office removals route contained outdated pricing claims from an earlier business phase:
  `<title>Office removalists Adelaide | $75 and $89 | ZQ Removals</title>`.
  This conflicted with current verified pricing (2 movers + truck at $110/hr, 3 movers at $150/hr), risking user mistrust, high bounce rates, and Google Search Console CTR suppression.
- **Evidence (GSC Data):**
  `/office-removals-adelaide/` had an average SERP position of 5.2 on Page 1 for high-intent queries (`office removalists adelaide`), generating 71 impressions and 0 clicks (0.0% CTR).
- **Resolution Implemented:**
  Updated `site-src/pages.json` with professional commercial metadata:
  - Title: `Office Removalists Adelaide | Business Moves | ZQ Removals`
  - Meta Description: `Professional office removalists in Adelaide. Commercial moves, internal office relocations, and workstation transport with transparent rates and minimal downtime.`

---

### Finding 5: Collapsed Duplicate Guide Links in Shared Editorial Hub
- **Affected URLs:** Global shared component across all 5 moving guide pages.
- **Severity:** Medium
- **Problem:**
  The editorial planning guides section in `scripts/build-site.mjs` linked to 4 historical guide URLs that were previously consolidated into the single route `/adelaide-moving-guides/prepare-house-move-adelaide/`. As a result, the "Recommended Guides" block rendered four identical links to the exact same page with repetitive anchor texts.
- **Evidence:**
  Four sibling links in the guide navigation all targeted `/adelaide-moving-guides/prepare-house-move-adelaide/`.
- **Root Cause:**
  Legacy URL references were not updated when thin guide routes were pruned and consolidated in earlier sprints.
- **Resolution Implemented:**
  Updated `scripts/build-site.mjs` (lines 4603–4608) to link to four distinct, surviving, high-value indexable guide URLs:
  1. `/adelaide-moving-guides/prepare-house-move-adelaide/` ("House Move Prep")
  2. `/adelaide-moving-guides/removalists-cost-adelaide/` ("Cost & Pricing Factors")
  3. `/adelaide-moving-guides/hourly-vs-fixed-rate-removalists-adelaide/` ("Hourly vs Fixed Quotes")
  4. `/adelaide-moving-guides/moving-heavy-furniture-adelaide/` ("Heavy Furniture Handling")

---

### Finding 6: Artificial Keyword Artifacts in Dynamic Secondary Profiles
- **Affected URLs:** Multiple guide pages and commercial service pages.
- **Severity:** Low
- **Problem:**
  `seoV5GuideProfiles` in `site-src/data/seo-v4.mjs` contained machine-generated or compliance-derived keyword phrases such as `'moving movers Adelaide'` and `'applicable charges disclosed moving'`, which appeared unnatural in keyword metadata arrays.
- **Resolution Implemented:**
  Replaced artificial entries with natural commercial search intent phrases (`'budget removalists Adelaide'`, `'hourly removalist rates Adelaide'`).

---

## 3. Comprehensive 10-Point Audit Summary

| Check # | Audit Item | Initial Status | Action Taken in Phase 2 | Current Status |
| :--- | :--- | :--- | :--- | :--- |
| **1** | Grammatically incorrect text | Defect found | Fixed plural verb agreement & guide FAQ concatenations | Passed |
| **2** | Awkward AI-generated sentences | Defect found | Refactored suburb insight paragraphs with natural phrasing | Passed |
| **3** | Unnatural keyword repetition | Defect found | Removed council duplications and artificial keyword strings | Passed |
| **4** | Repeated suburb intros | Defect found | Differentiated logistics intro and local access context | Passed |
| **5** | Low-value boilerplate sections | Defect found | Replaced collapsed guide duplicate links with distinct guides | Passed |
| **6** | Generic FAQs duplicated | Review clean | FAQs preserved; grammar repaired in guide dynamic FAQs | Passed |
| **7** | Conflicting search intent | Monitor item | Distinct mapping established between pricing guide & prices page | Resolved |
| **8** | Unnecessary / broken sections | Defect found | Fixed `"Hourly rate vs hourly"` broken anchor text | Passed |
| **9** | Confusing customer information | Defect found | Cleaned outdated `"$75 and $89"` rates from office removals metadata | Passed |
| **10**| Content-to-CTA balance | Verified good | Secondary `/contact-us/#quote-form` CTAs intact on all money pages | Passed |

---

## 4. Automated Regression Verification

All findings have been codified into an automated regression test suite: `tests/seo-phase2-quality.test.mjs`.

- `npm run build`: 95 pages generated cleanly.
- `npm run seo:validate`: 0 bad pages, 79 page URLs, 79 image URLs, 5 child sitemaps.
- `node --test tests/seo-phase2-quality.test.mjs`: 7/7 tests passing.
- `npm test`: 100% test pass rate across all suites.
