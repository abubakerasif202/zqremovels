# ZQ SEO monitoring

Inputs are the two private local property directories, not a Google connection. Do not add the raw export or archive to Git. Run Python 3.9+ from the repository root (PowerShell example):

```powershell
python scripts/gsc-monitor.py  "C:/path/to/sc-domain_zqremovals.au_96eaee9907df"  "C:/path/to/sc-domain_zqremovalsadelaide.com.au_d477bb0ec776"  --end 2026-11-25 --out reports/seo
```

- `gsc-monitoring.json`: totals, comparable 28-day windows, country/device segmentation, high-impression zero-click count, page CTR, overlap count, sitemap health and row inventories. Query country/device metrics are scoped to the office priority query; the equivalent query-page cut is also scoped to its canonical office path.
- `keyword-to-page.csv`: editorial targets and observed outcomes for a bounded, public keyword list. CTR is a fraction, not a percent.
- `keyword-cannibalisation.csv`: per-URL impressions/clicks/position for the curated queries when at least two URLs have three or more impressions on the same property. Group by property and query; alternatives are candidates for intent review, not automatic redirects. No raw search terms outside the curated list are exported.
- `legacy-url-migration.csv`, `migration-summary.json`, `live-sitemap-verification.csv`: timestamped public HTTP observations, separate from search performance. Synthetic attribution probes stand in for private query values. `eligible` means HTTP and HTML signals permit indexing, not that Google indexed the page.

## 30 / 60 / 90 days after production release

Record the actual live release date and commit. Use two fully reported 28-day windows from the same property, search type and segmentation; if the most recent day is not returned, use an earlier confirmed cutoff and make it explicit. A zero-impression day may also be absent, so cross-check the GSC interface before interpreting gaps. Keep property- and page-aggregation reports separate.

| Checkpoint | Compare | Action if result is weak |
|---|---|---|
| 30 days | Old aliases, 79 sitemap destinations and newly added URLs, Google-selected canonicals, organic lead acceptance, AU desktop office CTR; recheck matching mobile journeys. | Fix redirect/configuration regressions before further content edits. Look at office query by country/device and selected landing page before revising copy again. |
| 60 days | Office top 3–5; prices, Hyde Park and Unley Park towards top 10; specialist/packing/interstate by intent and Australian query mix. Sample pricing vs guide vs generic commercial overlap. | Retain distinct intents; merge only if equivalent. Verify business scope before more specialist coverage; verify measurement and consent before adjusting ads. |
| 90 days | New property 80–120 clicks, 10,000+ impressions over 28 days; six-month CTR trending towards 1.5–2%; 100% valid equivalent mappings; zero broken internal destinations. | Treat figures as goals, not forecasts. Prioritise by lost qualified traffic and leads, not impressions alone. Obtain CrUX p75 if available; distinguish it from Lighthouse and total blocking time. |

When old forwarding changes are separately authorised, test old HTTPS apex and www with representative exact paths and synthetic attribution, unrecognised paths, and `/legacy-sitemap.xml`. Confirm attribution and status at the final page, and do not disable the current forwarding until the replacement route plan is staged and reversible. See [Google's site-move guidance](https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes).
