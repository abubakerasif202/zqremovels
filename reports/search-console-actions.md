# Search Console actions (2026-10-30, updated)

## Done
- **www redirect fixed** via `vercel api` (PATCH /v9/projects/zq/domains/www.zqremovalsadelaide.com.au): 307 -> **308**. Verified live: `https://www.zqremovalsadelaide.com.au/house-removals-adelaide/?utm=x&a=1` -> 308 -> `https://zqremovalsadelaide.com.au/house-removals-adelaide/?utm=x&a=1` -> 200 (path and query preserved, no loop). DNS untouched.

## Search Console access: restored (2026-10-30)
- `scripts/gsc-auth.mjs` rewritten: Desktop OAuth client loaded from `C:\Users\abuba\gsc-private\credentials.json` (never copied), loopback listener on `127.0.0.1` with a free port started before Chrome opens, `state` check plus PKCE, token saved to gitignored `.gsc-token.json`. Read-only scope. `scripts/gsc-fetch.mjs` uses the same client path.
- Live pull done with `scripts/gsc-live-audit.mjs`. Full results and comparison: `reports/gsc-live-2026-10-30.md`.

## Latest data (live API, 2026-08-30..2026-10-29)
- Indexing: **79/79 sitemap URLs "Submitted and indexed"**, 0 canonical mismatches.
- Sitemaps: child sitemaps 0 errors; the **sitemap index shows 1 error** (new since 25 Oct, last read 24 Oct). Investigated: all sitemaps and the 79 URLs are valid and unchanged structurally since that read (details in `reports/gsc-live-2026-10-30.md`); exact error: `General HTTP error`, HTTP 308 on the 24 Oct read. The submitted URL returns 200 today (also for Googlebot), so this is a stale report from a transient redirect, not a defect. **Resubmitted 30 Oct 03:13 AEDT; Google re-read it immediately: 0 errors, 0 warnings.**
- Pricing and same-day pages: earlier "slipping" flag withdrawn; equal-window split shows both improved (36.2 -> 28.2 and 37.0 -> 21.0).
- Performance: 47 clicks, 9,399 impressions over 61 days. 23-28 Oct: 1.0 clicks/day and 274 impressions/day versus 0.76 and 143 in the 25 Oct baseline. Early signal only (6 days).

## Manual
1. ~~Resubmit `sitemap.xml`~~ Done (see above). Re-check the Sitemaps page in a few days to confirm all five children keep Success.
2. Review `/adelaide-moving-guides/removalists-cost-adelaide/` versus `/removalists-adelaide-prices/` for cost-intent cannibalisation before the day-14 check.
3. Verify the site in Bing Webmaster Tools and submit the sitemap.
4. No indexing requests needed (no indexable pages changed).
