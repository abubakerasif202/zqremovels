# Search Console recovery, 19 October 2026

Source: Search Console Fix Plan of 19 Oct 2026 (period 30 Aug to 16 Oct 2026). These are
historical measurements, not live values. Targets below are targets, not guaranteed outcomes.

## Baseline

- 37 clicks, 5,930 impressions, 0.6% CTR, average position 38.2; about 24 non-brand clicks
  ("zq removals" brought 13 of the 37).
- 78 pages indexed, 34 not indexed (mostly expected redirects).
- 80 sitemap URLs reported (79 after this change, see below).

## Phase 1 findings (checked against the live site before any change)

| Item | Result |
| --- | --- |
| Toorak Gardens canonical | Already correct: 200, self-referencing canonical, all 21 absolute URLs on the apex host. Old-domain URL redirects in one 308 hop. The duplicate-canonical flag is Google's stale choice and needs a re-crawl request (manual). |
| Old domain redirects | Already correct: `zqremovals.au` and `www.zqremovals.au` redirect permanently in one hop to the equivalent URL. |
| Cost-guide redirect error | Already correct: `/adelaide-moving-guides/how-much-do-removalists-cost-adelaide/` and `/guides/...` return 301 in one hop to `/adelaide-moving-guides/removalists-cost-adelaide/`. Needs Validate Fix in Search Console (manual). |
| robots.txt | Declares `sitemap.xml` and `ai-sitemap.xml` on the apex host. |
| Homepage rates, office link, prices link, cost guide to prices link | Already present. |
| `/sitemap-index.xml` | Confirmed defect (served as a duplicate of `sitemap.xml`). Fixed. |
| Apartment duplicate | Confirmed defect (both pages live and in the sitemap). Fixed. |
| Homepage H1 | Confirmed defect (no "Adelaide removalists"). Fixed. |
| Malvern page | Confirmed defect (no postcode, title lacked Adelaide). Fixed. |
| Northern hub | Confirmed defect: linked a retired Blakeview URL. Fixed. |

## Changes made

### Indexing and routing
- `sitemap.xml` is now the only sitemap index. `sitemap-index.xml` is no longer built and
  `/sitemap-index.xml` returns a permanent redirect to `/sitemap.xml`.
- `/apartment-removals-adelaide/` is no longer built, is in no sitemap, and redirects
  permanently to `/apartment-removalists-adelaide/` (the retained page; the retired page held no
  unique content). Every earlier redirect that targeted the old URL now goes straight to the
  retained page, so there are no chains. Internal links and the header menu were repointed.
- Sitemap size: 79 indexable URLs across four child sitemaps (services dropped from 16 to 15).

### URL redirect mapping (new or retargeted)

| Source | Destination |
| --- | --- |
| `/sitemap-index.xml` | `/sitemap.xml` |
| `/apartment-removals-adelaide/` (also without slash and `/index.html`) | `/apartment-removalists-adelaide/` |
| `/apartment-movers-adelaide/` | `/apartment-removalists-adelaide/` |
| `/services/apartment-removals-adelaide/` | `/apartment-removalists-adelaide/` |
| `/cbd-apartment-removals-adelaide/` | `/apartment-removalists-adelaide/` |

### Canonical URL decisions
- Apartment: `/apartment-removalists-adelaide/` is canonical.
- Sitemap: `/sitemap.xml` is canonical.
- No canonical, schema or Open Graph URL uses anything but the apex host.

### On-page changes
- Homepage: H1 now "Adelaide removalists. Moves handled with care."; lead paragraph carries the
  term naturally with the published rates, the call-out wording and one office link. Title kept.
- `/removalists-adelaide/`: repositioned as the local Adelaide moving-services page (scope, access
  planning, how to enquire, links to house, apartment, furniture, office, packing and prices
  pages). Title is now "Removalists Adelaide | Local Moving Services | ZQ Removals". The unsourced
  "5-Star" title wording was removed. It is deliberately not retargeted at "house removalists",
  to avoid competing with `/house-removals-adelaide/`.
- Office page: opening copy rewritten, hero after-hours bullet and unverified insurance wording
  removed. Title and description left as is (they already lead with "Office Removalists Adelaide").
- Prices page vs cost guide: prices page covers rates, crew options, 30-minute billing,
  call-out/travel and labelled hypothetical examples; the guide covers cost factors and links to
  the prices page. Titles and descriptions now target distinct intents.
- Northern Adelaide hub: dead Blakeview link replaced with live Munno Para and Modbury pages;
  Gawler page's Blakeview link replaced with Elizabeth.
- Piano page: upright vs grand guidance and access preparation; specialist, tuning and insurance
  wording removed. Page stays live and is not promoted.
- Eight priority suburb pages (Hyde Park, Unley Park, Queens Park, Medindie, Toorak Gardens,
  Brighton, Kensington Gardens, Malvern) each have a distinct planning section of roughly 130 to
  160 words, built only from general guidance and facts already in the repo. Malvern is now
  "Malvern, Adelaide, SA 5061" in title, H1 and opening paragraph.
- Kensington Gardens meta description now carries the approved rates.

### Hypothetical pricing examples (approved rates only)
- 2 men + truck, 3 hours, call-out applies: 6 x $75 = $450, plus $150 call-out = $600.
- 3 men + truck, 2.5 hours, call-out applies: 5 x $89 = $445, plus $178 call-out = $623.
- Call-out/travel = one hour of the selected crew rate. Partial-increment handling is stated as
  "confirmed in your quote" because the repository does not define it.

### Internal link changes
- Neighbour links (3 to 4 each) added for Malvern (Hyde Park, Unley Park, Unley), Medindie
  (Walkerville, Prospect, Adelaide CBD), Toorak Gardens (Norwood, Linden Park, Burnside,
  Kensington Gardens), Brighton (Glenelg, Marion, West Beach), Kensington Gardens (Magill,
  Norwood, Burnside, Toorak Gardens). Adjacency was checked against Wikipedia and is not an
  authoritative source. Brighton's neighbours are the weakest set (none borders it).
- Inbound links to the three "discovered, not indexed" pages: Brighton (from Glenelg, Marion),
  Toorak Gardens (from Norwood, Burnside, Linden Park), Kensington Gardens (from Magill, Norwood,
  Burnside).
- Hub page now links its service pages, prices page and cost guide; redirecting aliases and a
  self-link were removed from it.

## Keyword to page map

| Search intent | Primary page | Note |
| --- | --- | --- |
| Adelaide removalists, brand | `/` | H1 and title carry the term |
| Local Adelaide moving services | `/removalists-adelaide/` | not "house", not the homepage's copy |
| House moves | `/house-removals-adelaide/` | unchanged |
| Office removalists | `/office-removals-adelaide/` | which URL ranked 6.4 is unknown, see below |
| Apartment moves | `/apartment-removalists-adelaide/` | retained duplicate |
| Moving prices, hourly rate | `/removalists-adelaide-prices/` | rates and examples |
| Cost factors | `/adelaide-moving-guides/removalists-cost-adelaide/` | guide, links to prices |
| Suburb searches | matching `/removalists-<suburb>/` page | |

The plan assumed the homepage was the URL ranking 6.4 for "office removalists adelaide". That
cannot be confirmed without Search Console's page-by-query view; check it before re-allocating.

## Findings that need a decision or are outside this change

- **Queens Park** is the Sydney (NSW) pickup interstate page, not an Adelaide suburb; it got a
  planning section but no neighbour links. If the plan meant an Adelaide suburb, the Search
  Console URL needs checking.
- **Office links on suburb pages:** the shared "Related services" block links the office page from
  34 suburb pages. That existing block was left alone; a guard test fails if the count exceeds 40.
- **Reviews:** `business.mjs` holds a 5.0 / 85 Google review figure from an owner-supplied
  screenshot dated 2026-10-02 (not live data). `build-site.mjs` still contains "Adelaide's
  5-star removalists" on another page, and the homepage reviews section says there are no
  published customer reviews directly under a review badge. These are inconsistent and need an
  owner decision.
- **After-hours wording:** the office FAQ sentence about after-hours and weekend moves is pinned by
  `seo-v7.test.mjs`; decide whether to drop it.
- **Generic template wording** remains on five suburb pages (for example "storage-aware removals"
  cards). Not changed.
- **No North Adelaide page** exists (`/removalists-north-adelaide/` redirects to the CBD page).

## Not done, because they need new factual material

Street-level detail, real travel times from the depot, reviews, job examples, photos, citations
and Google Business Profile changes. Nothing was invented. Interstate pages were intentionally
not expanded.

## Search Console actions (manual, require authenticated access; none were performed)

- [ ] Validate Fix on the redirect error for `/adelaide-moving-guides/how-much-do-removalists-cost-adelaide/`.
- [ ] Request indexing: `/removalists-toorak-gardens/`, `/removalists-brighton/`,
      `/removalists-kensington-gardens/`, `/`, `/removalists-adelaide/`.
- [ ] Confirm the Change of Address from `zqremovals.au` is filed and its status.
- [ ] Resubmit `https://zqremovalsadelaide.com.au/sitemap.xml`; remove `sitemap-index.xml` if listed.
- [ ] Check the page-by-query view for "office removalists adelaide" to see which URL ranks.
- [ ] Re-check the Duplicate canonical report for Toorak Gardens after re-crawl.

Submitting a request does not mean Google has re-indexed or re-ranked anything.

## Verification

- `npm run build`: passed.
- `npm test` (node suites including `.cjs`): 405 tests, 404 pass, 0 fail, 1 todo (the office-link
  count above).
- `npx tsc --noEmit`: passed.
- `npm run seo:validate`: passed, 108 pages, 79 sitemap URLs.
- `npx playwright test --workers=2`: 145 passed, 80 skipped by design, 0 failed.
- axe/readability audit: 95 pages, 0 rule failures, 0 overflowing pages, 0 button-contrast failures.
- New tests: `sitemap-and-apartment-consolidation`, `priority-suburb-pages`, `top-page-targeting`.

Commit and production deployment status are recorded at the end of this file after release.

## Eight-week review targets (same seven-week window, brand and non-brand separated)

| Metric | Baseline | Target |
| --- | --- | --- |
| Non-brand clicks | about 24 | 40 or more |
| "removalists adelaide" position | 10.3 | top 5 (aspiration) |
| "office removalists adelaide" clicks | 0 | 5 or more |
| Hyde Park / Unley Park page position | 16.4 / 18.1 | under 10 |
| Actionable indexing errors | 4 | 0 |
