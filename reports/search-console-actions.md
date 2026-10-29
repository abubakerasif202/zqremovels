# Search Console actions (2026-10-30, updated)

## Done
- **www redirect fixed** via `vercel api` (PATCH /v9/projects/zq/domains/www.zqremovalsadelaide.com.au): 307 -> **308**. Verified live: `https://www.zqremovalsadelaide.com.au/house-removals-adelaide/?utm=x&a=1` -> 308 -> `https://zqremovalsadelaide.com.au/house-removals-adelaide/?utm=x&a=1` -> 200 (path and query preserved, no loop). DNS untouched.

## Search Console access: blocked (live); latest data from the local export
- GSC Wizard connector: `payment_required` (not purchased, per instruction).
- Direct API: gcloud tokens for the three signed-in accounts return 403 `insufficient authentication scopes` (no webmasters scope). `scripts/gsc-auth.mjs` needs `secrets/gsc-oauth-client.json` (missing) plus an interactive browser consent; no `.gsc-token.json` exists.
- **Exact prerequisite:** create a Google Cloud OAuth desktop client, save it as `secrets/gsc-oauth-client.json`, run `node scripts/gsc-auth.mjs`, approve with the account that owns `sc-domain:zqremovalsadelaide.com.au`, then `npm run gsc:fetch`.

## Latest data available (export 2026-10-25, window 2026-07-25..2026-10-22, five days old)
- URL Inspection of all 79 sitemap URLs: **79/79 "Submitted and indexed"**, 0 canonical mismatches (user vs Google canonical). Sitemap `sitemap.xml`: 0 errors, 0 warnings, last read 2026-10-24.
- Performance: 41 clicks, 7,729 impressions, CTR 0.53%, average position 37.2. Homepage: 33 clicks, position 12.3.
- Versus the historical baseline (~78 indexed / 34 not indexed): every sitemap URL is now indexed. The not-indexed group was mostly redirect, alias and noindex URLs that are intentionally excluded. Full "Pages" report counts cannot be refreshed without API access.
- Confirmed remaining indexing issues among sitemap URLs as of 2026-10-25: none. Not re-checked since.

## Manual
1. Provide the OAuth client above (or re-subscribe) to refresh data.
2. Verify the site in Bing Webmaster Tools and submit the sitemap.
3. No indexing requests needed (no indexable pages changed).
