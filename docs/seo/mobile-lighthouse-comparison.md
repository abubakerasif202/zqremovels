# Mobile Lighthouse comparison (2026-11-07)
Tool: Lighthouse 13.5.0 CLI (programmatic) with locally installed Chrome, headless. Mobile emulation, simulated throttling: CPU 4x slowdown, RTT 150 ms, 1,638 kbps. Performance category only. 3 runs per route and target; table shows medians. Lab data only, not field Core Web Vitals.
Targets: `production` = https://zqremovalsadelaide.com.au (currently main, before PR #93). `local-pr-build` = PR branch `site-dist` served from a local Node server with Brotli (no CDN), so it is NOT a like-for-like speed comparison with production. The Vercel preview is behind Vercel Authentication and cannot be run through Lighthouse without a bypass.

| Target | Route | Perf | FCP ms | LCP ms | TBT ms | CLS | Perf runs |
|---|---|---|---|---|---|---|---|
| production | / | 98 | 1383 | 2307 | 7 | 0 | 90, 98, 98 |
| production | /removalists-adelaide/ | 75 | 2252 | 2935 | 599 | 0 | 91, 75, 63 |
| production | /office-removals-adelaide/ | 82 | 1727 | 2680 | 456 | 0 | 82, 82, 98 |
| production | /services/piano-movers-adelaide/ | 88 | 1535 | 2283 | 344 | 0 | 88, 85, 97 |
| production | /removalists-adelaide-prices/ | 97 | 1321 | 2083 | 156 | 0 | 97, 94, 99 |
| production | /removalists-hyde-park/ | 97 | 1312 | 2125 | 130 | 0 | 97, 96, 99 |
| local-pr-build | / | 93 | 1509 | 2414 | 186 | 0 | 98, 93, 86 |
| local-pr-build | /removalists-adelaide/ | 93 | 1896 | 2722 | 1 | 0 | 90, 93, 95 |
| local-pr-build | /office-removals-adelaide/ | 93 | 1373 | 2266 | 216 | 0 | 93, 96, 88 |
| local-pr-build | /services/piano-movers-adelaide/ | 95 | 1345 | 2194 | 200 | 0 | 96, 95, 89 |
| local-pr-build | /removalists-adelaide-prices/ | 98 | 1211 | 2111 | 97 | 0.055 | 98, 95, 98 |
| local-pr-build | /removalists-hyde-park/ | 98 | 1213 | 2113 | 83 | 0.056 | 97, 99, 98 |

## Reading the data
- Run-to-run variance is large (production /removalists-adelaide/ scored 91, 75 and 63), mostly through Total Blocking Time. Three runs cannot show a PR effect; do not claim the eager hero image improved anything.
- Medians show LCP of 2.1-2.9 s and FCP of 1.3-2.3 s. With Brotli the single 200 KB (raw) stylesheet is not an extreme render-blocker here, so critical-CSS extraction is not justified by this evidence. Earlier uncompressed runs (docs/seo/performance-baseline.md) overstated the CSS cost.
- The weakest routes are /removalists-adelaide/ and /office-removals-adelaide/ on production (TBT 456-599 ms in the median). That points at JavaScript main-thread work, not CSS. Next step: profile `site.js`/chat widget on those two routes in a separate change.
- CLS 0.055 on two local runs came from the consent banner (`section.zq-consent`) appearing late; it was intermittent (1 of 2 re-runs) and is existing behaviour, not caused by this PR. Production medians showed 0.
- Production field data (CrUX) remains unavailable: PSI returned HTTP 429 without an API key.
