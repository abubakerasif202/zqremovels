# Search Console measurement plan (14-day and 30-day)

Baseline: the 25 Oct 2026 export in `sc-domain_zqremovalsadelaide_com_au_20261025_182506/` (nominal range 2026-07-25 to 2026-10-22, 90 days). The export folder is untracked on purpose; keep a copy outside the repo if it must be retained.

**Matched windows matter.** Search Console only has data from 2026-08-30, so the baseline holds 54 days of data, not 90: 41 clicks, 7,729 impressions, average position 37.2, which is 0.76 clicks/day and 143 impressions/day. Do not compare these raw totals with a 14-day or 30-day window. Use either the per-day rates, or the matched baseline taken from `daily.csv` (the last 14 days of the baseline, 9 to 22 Oct, are 11 clicks and 3,304 impressions). `scripts/gsc-compare-exports.mjs` prints both, and warns when the two windows differ in length. Page and query tables cannot be windowed (the export has no daily page data), so read those as per-day rates and treat positions as indicative.

## Repeatable process

1. Export the same property (`sc-domain:zqremovalsadelaide.com.au`) from the Search Console UI or API into a new folder with the same CSVs: `summary.csv`, `pages.csv`, `queries.csv`, `page_queries.csv` (columns `page|query, clicks, impressions, ctr_percent, position`) and, if available, `manifest.json` with `start_date` and `end_date`.
2. Compare against the baseline:

   ```bash
   node scripts/gsc-compare-exports.mjs sc-domain_zqremovalsadelaide_com_au_20261025_182506 <new-export-folder> reports/gsc-compare-<date>.md
   ```

3. Read the report: branded versus non-branded totals, the eight target pages, seven target queries and pages that newly reached page one.
4. Checkpoints (use equal-length date ranges where possible):
   - Day 14 after the 27 Oct 2026 deploys: roughly 10 Nov 2026.
   - Day 30: roughly 26 Nov 2026.

Targets (directional, per day so that the window length does not matter; not guarantees):

| Measure | Baseline (54 data days) | Day 14 | Day 30 |
| --- | --- | --- | --- |
| Non-branded clicks per day | 0.13 (7 clicks in `queries.csv`) | >= 0.26 (about 4 per 14 days) | >= 0.4 (about 12 per 30 days) |
| Impressions per day | 143 (last 14 days: 236) | >= 236 | >= 300 |
| Medindie page average position | 11.9 | <= 11 | <= 9 |
| Hyde Park / Unley Park average position | 17.0 / 16.0 | <= 15 | <= 12 |
| `removalists adelaide prices` query position | 21.9 | <= 20 | <= 16 |
| Quote-form submissions (GA4 key event) | not measured here | record | record |

The click targets are small because the baseline is small (7 non-branded clicks in 54 days). One or two extra clicks is noise, so read the position and impression columns first.

## Where each number comes from

| Measure | Source | Status |
| --- | --- | --- |
| Clicks, impressions, positions, indexing state (79 URLs indexed), daily series (54 data days) | 25 Oct 2026 Search Console export | Historical baseline, verified from files |
| Cannibalisation, striking-distance pages, queries per page | Computed from that export | Historical, derived |
| Build, tests, SEO validation, Playwright, readability, local Lighthouse | Run in this repo | Directly verified (locally and in CI) |
| Live page copy, canonical host, `www` -> apex 308 | `curl` against production | Directly verified at time of deploy |
| Day 14 / Day 30 Search Console numbers | New export | Requires Search Console access (GSC Wizard connector lapsed) |
| GA4 conversions, Google Ads conversions | GA4 / Ads | Requires external account access |
| Business Profile calls, directions, reviews, hours, categories | Business Profile | Requires owner access; not verified |
| Field Core Web Vitals (LCP, INP, CLS) | CrUX / Search Console report | Requires external data; only lab numbers verified |

Caveats: `queries.csv` is row-limited and excludes anonymised queries, so the branded/non-branded split is a lower bound on total clicks (the totals row is authoritative). Average position is impression-weighted and moves with query mix.

## Website versus Business Profile consistency (what the site publishes)

Verified from the built site (`MovingCompany` JSON-LD and footer): name "ZQ Removals", phone 0433 819 989, locality Andrews Farm SA 5114, ABN published in the footer, email admin@zqremovals.au, GBP share link in `sameAs`. The schema has no `aggregateRating` or `review` nodes (correct while reviews are not first-party on the page).

Needs checking in the Business Profile (no access here): same name, phone, address or service-area setting, hours, categories and website URL; also that the "85 Google reviews" text on 17 pages still matches the live count. Treat that figure as a manually maintained claim and update it when the listing changes.
