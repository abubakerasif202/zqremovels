# Search Console migration checklist

Evidence: read-only exports dated 2026-10-15 (`GSC-Export-20261015-192754`). Live API access is **blocked**: the stored OAuth client returns `401 deleted_client` (token last issued for `webmasters.readonly`, access token expired 2026-05-10). Nothing below was executed against Search Console.

| Item | Status | Evidence / action |
| --- | --- | --- |
| Ownership, both properties | Verified (export) | `sc-domain:zqremovals.au` and `sc-domain:zqremovalsadelaide.com.au` both `siteOwner` |
| Old-domain sitemap | Submitted 2026-08-29 | `https://zqremovals.au/sitemap-index.xml`, last read 2026-10-14, 0 errors. That URL now 308s to the new domain, so it no longer lists old URLs |
| New-domain sitemap | Submitted 2026-09-28 | `https://zqremovalsadelaide.com.au/sitemap.xml`, last read 2026-10-12, 0 errors |
| Legacy sitemap | **Not submitted** | Live and returns 224 old URLs (verified 2026-10-17). **Action (owner):** old property, Sitemaps, add `legacy-sitemap.xml` |
| Change of Address | **Unverified** | No API for it. **Action (owner):** old property, Settings, Change of address, confirm it targets `zqremovalsadelaide.com.au` |
| Redirect-related indexing | In progress | Export shows old URLs as "Page with redirect" with Google canonical already the new domain (e.g. `/`, `/adelaide-moving-guides/removalists-cost-adelaide/`); 16 old URLs last crawled July |
| Request indexing | **Owner action** | URL Inspection on the new property for: `/`, `/removalists-adelaide-prices/`, `/house-removals-adelaide/`, `/office-removals-adelaide/`, `/services/piano-movers-adelaide/`, `/apartment-removalists-adelaide/`, `/packing-services-adelaide/`, `/removalists-adelaide/`, plus the destinations changed in `redirect-decision-matrix.csv` after deploy |
| Restore API access | **Owner action** | Create a new OAuth client in Google Cloud, save as `secrets/gsc-oauth-client.json`, run `node scripts/gsc-auth.mjs` (readonly scope first) |
| External listings | Owner action | Business Profile, Facebook, directories: point to `https://zqremovalsadelaide.com.au` |

Keep the old domain attached to the Vercel project and the redirects in place for at least a year.
