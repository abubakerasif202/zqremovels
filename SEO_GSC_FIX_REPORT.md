# ZQ Removals Adelaide — GSC repair checkpoint (15 Nov 2026)

## Scope
Isolated checkout: `C:\Users\abuba\zq-gsc-seo-20261115`, branch `seo/gsc-2026-11-15`. Original worktree with uncommitted changes was not modified. Production was not modified or deployed.

Data: `C:\Users\abuba\GSC_Adelaide_Reports\gsc_20261115_042849\zq_removals_adelaide`. Latest reporting range is labelled 16 Oct–12 Nov 2026, but last available daily data is 11 Nov. Current totals: 37 clicks, 7,459 impressions, roughly 0.50% CTR.

## Opportunity baseline
| Page | Impressions | Clicks | Avg position |
| --- | ---: | ---: | ---: |
| /removalists-unley-park/ | 402 | 0 | 10.6 |
| /removalists-medindie/ | 305 | 0 | 10.6 |
| /removalists-hyde-park/ | 423 | 0 | 12.7 |
| /removalists-malvern/ | 576 | 0 | 17.2 |
| /office-removals-adelaide/ | 1156 | 1 | 37.4 |
| /services/piano-movers-adelaide/ | 887 | 0 | 50.3 |
| /removalists-adelaide-prices/ | 611 | 3 | 16.1 |

These page averages blend queries and search appearances. A low CTR at an average position around 10 is an opportunity to test clearer snippet relevance, not proof of a technical penalty.

## Implemented: local search title clarity
Replaced ambiguous bare-dollar / price-first suburb titles with service-and-location intent while retaining the actual published rate disclosures in descriptions and on the website.

| Route | Previously | New generated title |
| --- | --- | --- |
| /removalists-hyde-park/ | Hyde Park Removalists \| $75/30 min Local Movers \| ZQ Removals | Hyde Park Removalists \| Local Home Movers \| ZQ Removals |
| /removalists-unley-park/ | Unley Park Removalists \| Homes & Townhouses \| ZQ Removals | Unley Park Removalists \| Local Home Moves \| ZQ Removals |
| /removalists-medindie/ | Medindie Removalists \| $75 and $89 \| ZQ Removals | Medindie Removalists \| Local House Movers \| ZQ Removals |

Files:
- `site-src/data/seo-v4.mjs`: intended generated-suburb titles for three suburbs.
- `scripts/build-site.mjs`: ensure Hyde Park and Unley Park titles are consistent with the later generator override.
- `tests/gsc-20261115-snippet-quality.test.mjs`: generated HTML titles, canonicals, quote CTAs and JSON-LD existence.
- `tests/search-console-fixes.test.mjs`: align existing expected metadata with approved changes.

No route paths, canonical URLs, business pricing, quote handling, redirects or structured-data nodes were deliberately changed.

## Verification
- `npm run build`: PASS.
- `node --test tests/gsc-20261115-snippet-quality.test.mjs`: PASS (3/3).
- `npm run seo:validate`: PASS (80 pages, zero bad pages).
- Focused legacy suites `gsc-striking-distance`, `search-console-fixes` and `seo-conversion-pass`: PASS (68/68 on rerun). Existing metadata expectations were updated to match the approved new titles.
- `git diff --check`: PASS on the initial diff.

## Work deliberately deferred
- Office removals: 1,156 impressions, average position 37.4. Ranking gap merits landing-page and competitor search-intent analysis; do not overwrite valid detailed commercial content on a guess. Audit competing /office-removals-adelaide/ and /services/office-removals-adelaide/ intent separately before any redirect.
- Piano movers: 887 impressions, average position 50.3. Verify real piano transport scope, equipment and customer proof before adding specialist claims.
- Malvern: already has a unique title with locality and postcode; no unsupported rewrite.
- Ahrefs schema validation warnings: exact failing nodes/properties were not provided; do not strip JSON-LD globally.
- Google Search Console re-crawl and CTR impact cannot be verified before deployment and subsequent data accumulation.

## Next review
After the changes are separately reviewed and deployed, compare matching finalized 28-day periods by query+page, especially local removalist phrases for Hyde Park, Unley Park and Medindie, while checking indexed canonical URLs. Track click gains without assuming causality from metadata changes alone.
