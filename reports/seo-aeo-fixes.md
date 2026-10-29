# Fixes (2026-10-30)

The repository audit found **no confirmed repo-level defects** to fix: earlier sessions (PRs #71-#83) had already resolved canonical, sitemap, redirect, schema, copy and tracking issues. Preserved untouched.

Added this session:
- `scripts/live-seo-audit.mjs`: repeatable, read-only live crawl (status, canonical, robots, metadata, headings, JSON-LD, links, AI-crawler UA access, redirect variants). Verified by running it against production (0 issues).

Not changed, deliberately: pricing ($75 / $89 per 30 min, 1-hour call-out where applicable is consistent across site-src), GTM container, `zq_quote_submitted` logic, Ads settings, brand colours.
