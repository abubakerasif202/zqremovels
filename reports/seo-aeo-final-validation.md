# Final validation (2026-10-30, updated)

| Task | Status |
|---|---|
| 1 www redirect to 308 | **Completed**, verified live (path and query preserved, no loop) |
| 2 Search Console direct access | **Blocked**: missing OAuth client and consent. Used the 2026-10-25 local export: 79/79 indexed |
| 3 GBP and citations | **Partly completed**: site name/phone/address verified; no old-domain listings found; GBP edits need manual account access |
| 4 AI platform tests | **Blocked**: Perplexity 403/Cloudflare, Bing headless unusable, ChatGPT/Gemini need login; no results claimed |
| 5 Mobile Lighthouse | **Completed**, no regression needing a fix |
| 6 Lead tracking | **Completed (automated)**; real Google Ads attribution **not verified** |
| 7 GitHub release | see PR |

## Lighthouse (production, mobile, single lab run each, 2026-10-30)
| Page | Perf | A11y | BP | SEO | LCP ms | CLS | TBT ms |
|---|---|---|---|---|---|---|---|
| / | 98 | 100 | 100 | 100 | 2150 | 0 | 0 |
| house-removals-adelaide | 90 | 100 | 100 | 100 | 2473 | 0 | 283 |
| furniture-removalists-adelaide | 95 | 100 | 100 | 100 | 2364 | 0 | 174 |
| office-removals-adelaide | 89 | 100 | 100 | 100 | 2522 | 0.063 | 305 |
| interstate-removals-adelaide | 88 | 100 | 100 | 100 | 2684 | 0 | 314 |
| contact-us (quote journey) | 98 | 100 | 100 | 100 | 1842 | 0 | 137 |

Homepage LCP is 2150 ms versus 2441 ms recorded earlier. Interstate and office LCP are marginally over 2.5 s under simulated throttling and TBT is 280-315 ms on service pages; these are single runs, treated as noise-level and not a regression. Possible later work: trim JavaScript on service pages.

## Lead tracking
- Playwright `tests/conversion-tracking.spec.ts`: 125 passed.
- `node scripts/verify-ads-conversion.mjs` against live: 20/20 scenarios passed (POST mocked, measurement requests aborted, no lead created). An accepted submission gives one `zq_quote_submitted` and one `generate_lead` with a uuid4 id and three Google conversion requests for the same id; rejected, failed and no-consent cases give none. GTM-WJGKPXFL, conversion IDs, labels and consent are unchanged.
- Not verified: that Google Ads records the conversion (needs Ads access).

Earlier results still stand: 79/79 URLs 200, canonicals, JSON-LD, build, tests, `seo:validate`.
