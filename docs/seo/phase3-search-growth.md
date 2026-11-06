# Phase 3: search growth baseline and changes (2026-11-07)

## Data limits
- Latest available Search Console data is the 6 Nov 2026 export (window 30 Aug-3 Nov): 60 clicks, 11,246 impressions, CTR 0.53%, average position 34.04.
- Live Search Console access was not available: the GSC Wizard connector needs a paid subscription, and the repo's OAuth refresh token (`.gsc-token.json`) returns `invalid_grant`. Re-authenticate with `npm run gsc:auth` to refresh. No credentials were touched and the existing `data/gsc` files were not overwritten.
- Pennington has no query rows in the export (no measured impressions).

## Measured opportunities (non-brand, 28-day export, page-query rows)
| Target | Evidence | Reading |
|---|---|---|
| Hyde Park | 6 queries at position 10.2-12.4, about 715 impressions, 0 clicks | Bottom of page 1 or top of page 2; rank, not CTR, is the constraint |
| Unley Park | 5 queries at position 12.6-13.9, about 477 impressions, 0 clicks | Same |
| Medindie (not on the priority list) | 5 queries at position 9.1-11.4, about 270 impressions, 0 clicks | Best striking-distance suburb after Hyde Park |
| Office removals | "office removalists adelaide" 150 impressions at position 6.0, 0 clicks | Check the live SERP/snippet before changing copy |
| Prices | "removalists adelaide prices" 210 impressions across `/`, the cost guide (position 13.6) and the prices page (23.2) | Guide outranks the prices page; cross-links and distinct titles already exist, so monitor rather than rewrite |
| Piano | 1,589 impressions at position 30-84 | Header link to the piano page was missing sitewide (fixed); content and authority gap remains |
| Shared queries | Hyde Park and Unley Park queries also surface the Unley, Adelaide hub and homepage | Possible cannibalisation, not proven |

## Verified defects fixed
- Header and footer (`src/components/Header.astro`, `Footer.astro`) did not link the piano page. The earlier edit went into the unused `site-src/partials/header.html`. Piano movers is now in the desktop nav, mobile nav and footer.
- Duplicate `areaServed` entries (for example "Unley Park" twice) on suburb Service schema: de-duplicated in `seo-v4.mjs`.
- `/book-consultation/` had empty og:image and twitter:image: `renderHead` now falls back to the default social image for any page without one. All 122 generated pages now have both.
- Factual correction: PR #93's Semaphore card said Pennington is in the City of Port Adelaide Enfield. Pennington is in the City of Charles Sturt (Wikipedia, ABS). Fixed here; see `pennington-sources.md`.
- Pennington: added a sourced section (ABS 2021 Census housing mix and tenure, council, bordering suburbs, light industrial pocket). No jobs, customers or unverified claims.

## Investigated, not changed
- Consent-banner layout shift (about 0.055): reproduced only inside the Lighthouse lab harness; Playwright (mobile and desktop, with and without network/CPU throttling) and the Vercel preview showed none. No change.
- Section-level cost (4x CPU, per-section forced style+layout toggle): total toggle cost is about 190 ms on `/removalists-adelaide/` and 50-80 ms on the others, spread across many sections (largest single section 23 ms). No section is expensive enough to justify a targeted fix; the one-time style recalculation against the 200 KB stylesheet is the likelier cost, which is a CSS-architecture change for a separate PR.
- Title/H1 rewrites for the six priority pages: current titles already contain the target queries and rates, so none were changed.

## Manual actions
1. `npm run gsc:auth` (token expired) so live Search Console data can be pulled.
2. Search Console: URL Inspection > Test Live URL on `/removalists-pennington/`, then Request Indexing once if it renders. Allow time for recrawl before judging impressions.
3. Check the live Google SERP for "office removalists adelaide" and the Medindie, Hyde Park and Unley Park queries from an Adelaide location.
4. Google Business Profile steps remain in `manual-gsc-gbp-actions.md`.

## Measurement
Compare matched 28-day windows against the baseline for: Pennington impressions (currently none), Hyde Park / Unley Park / Medindie average position and clicks, piano page impressions and position, and accepted quote events. No ranking improvement is claimed until new data exists.
