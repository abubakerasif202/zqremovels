# Production verification

| Check | Result |
| --- | --- |
| Production deployment before this change | `dpl_Fm6aGahkBfCFSc2RSqbre8Y5otiM`, target production, READY, `main` @ `00bbd0839416e03fe22ae304ee5014e329a7689b` ("fix: make mobile ZQ AI chat composer always visible (#63)") |
| Legacy-migration commit in production | Yes: `vercel.json` is byte-identical between `6b0c013` branch and `main`; `/legacy-sitemap.xml` on old host returns 200 with 224 URLs; same path on new host returns 404 |
| Old-host redirects (spot checks 2026-10-17) | `/removalists-croydon/`, `/services/piano-movers-adelaide/`, guides alias: 308 single hop to the matching new URL. `http://zqremovals.au/` still 308 then 308 (Vercel upgrades HTTPS first; documented platform limit) |
| Live on-page crawl (80 URLs) | Clean, see `technical-seo-findings.md` |
| This change deployed? | See "Deployment" below (filled in after merge) |

## Lead generation and tracking (tests only; no synthetic production leads sent)
- `tests/conversion-tracking.spec.ts` passes on all viewports (375, 390, 768, 1366, 1920): accepted quote queues exactly one private event before navigation on `/`, `/contact-us/`, southern hub and the Facebook offer page; empty, malformed, rejected, server-error, network-error and missing-success responses produce no conversion; direct thank-you visits never establish a lead; consent defaults and one GTM loader preserved.
- `node scripts/quote-api-smoke.mjs` passes (API validation without sending).
- GTM `GTM-WJGKPXFL` and Ads `AW-18413688842` references untouched; no GTM or Ads changes made.
- Mobile chat composer fix (#63) is the production baseline; Playwright mobile suites pass on top of it.
