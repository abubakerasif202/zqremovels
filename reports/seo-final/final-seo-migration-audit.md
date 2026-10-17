# Final SEO migration audit (2026-10-17)

## Already complete before this pass (verified, not redone)
Legacy sitemap live (224 URLs on `zqremovals.au`), old-host 308 redirects, guide alias and no-slash fixes, new-domain canonical/`og:url` hygiene on 80 pages, piano page optimisation, 43-page thin-content report. All of it is in production (`main` @ `00bbd08`).

## Independently verified
- Production commit and deployment (Vercel `dpl_Fm6aGahkBfCFSc2RSqbre8Y5otiM`).
- Live crawl of all 80 URLs: statuses, canonicals, robots, titles, H1s, descriptions, JSON-LD, internal links, images, orphans (all clean).
- Old-host redirect behaviour and legacy sitemap content.
- Search Console state from the 2026-10-15 export (API access is blocked: `deleted_client`).

## Redirect review (224 legacy URLs; 132 flagged as non-equivalent)
| Class | All 224 | Of the 132 flagged |
| --- | --- | --- |
| KEEP | 173 | 81 |
| CHANGE (implemented) | 40 | 40 |
| RESTORE (owner decision, not built) | 1 | 1 |
| REVIEW (owner decision) | 10 | 10 |

Full per-URL reasoning, Search Console clicks/impressions and before/after targets: `redirect-decision-matrix.csv`. Changes live in `data/migration/redirect-overrides.json`, applied to `vercel.json` and the verified registry by `scripts/apply-redirect-overrides.mjs`, and preserved on regeneration by `scripts/seo-redirects-build.mjs`. Every new destination is a live, indexable, self-canonical page and no change creates a chain (enforced by `tests/redirect-overrides.test.mjs`).

- **RESTORE**: `/adelaide-moving-guides/how-long-moves-take-adelaide/` (2 clicks, 17 impressions, position 5.6). Needs owner-confirmed durations; none invented.
- **REVIEW**: Croydon (157 impressions, no live page), the fixed-price/hourly/cheap comparison family (pricing page has no fixed-price content), Victor Harbor, Woodville, Albert Park.
- **Considered and not changed**: `/budget-removalists-adelaide/` to the cheap page (456 impressions). The merged price-intent consolidation and its regression test send it to the pricing page; left for the owner.

## Fixed
See `technical-seo-findings.md`: redirected footer links, reviews-badge accessible name, stale contact test locator, invisible header wordmark, inconsistent CTAs, footer address layout, plus two tests updated to the reviewed-override contract.

## Verification
Build passes; `npm test` (quote API smoke + 31 node suites) 0 failures; `tsc --noEmit` exit 0; Playwright 100/100 across 375, 390, 768, 1366 and 1920 px including conversion tracking; contrast audit passes on 123 pages; axe 0 failures on 96 pages.

## Remaining actions needing account access
Submit `legacy-sitemap.xml` and confirm Change of Address in the old property; request indexing for key pages; restore Search Console API credentials; update external listings. Details: `gsc-migration-checklist.md`.

## Next priorities
1. After deploy, request indexing for the 40 changed destinations' parents and the money pages.
2. Decide the REVIEW/RESTORE rows (Croydon and fixed-price content give the most upside).
3. Plan the inner-page typography/colour alignment as a design project.
