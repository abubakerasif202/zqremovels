# ZQ Removals growth audit - 2026-11-06
Evidence sources: live crawl of 79 sitemap URLs and 370 redirects (docs/seo/live-audit-notes.md, live-url-inventory.csv, redirect-audit.csv), GSC export 20261106_224211, local build and tests.

Confirmed current and fixed: template grammar defects, repeated quote-factor filler, Queens Park hierarchy, misleading Myrtle Bank card, weak Pennington internal linking (see change-log.md).
Confirmed fine: all 79 sitemap URLs 200 with self-canonical; no redirect loops; no sitemap URL is a redirect; legal pages noindex as intended; apex/https variants resolve.
Left alone: 46 slashless legacy redirects that take 2 hops (308 then 301/308) - harmless, optional cleanup; cost-guide redirect is a single 301.
Unverified/blocked: the 28 "Page with redirect" URLs, historical redirect error and canonical override (need GSC export); Pennington indexing cause; GBP data; HF Removals benchmark (not inspected); field Core Web Vitals.
Validation: npm run build, npm test, npm run seo:validate pass; Playwright 181 passed, 84 skipped (project-conditional), 0 failed. Local only, not production evidence.
