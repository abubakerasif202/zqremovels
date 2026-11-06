# Phase 2 summary - 2026-11-07

## Playwright skip classification (265 test runs: 181 passed, 84 skipped, 0 failed)
All 84 skips are deliberate `test.skip(project !== X, 'run once')` gates in `chat-enquiry-journey.spec.ts` (56) and `mobile-seo-visual.spec.ts` (28). Every test executes in at least one project (checked from the JSON report: zero tests have no execution), so the skips remove duplicate runs, not coverage. Class: intentional, no action.
Valid but excluded from `playwright.config.ts` testMatch: `tests/site-health.spec.ts` and `tests/visual.spec.ts` (untracked, pre-existing). `site-health.spec.ts` gates on a project named `desktop-chromium` that the config does not define, so it would always skip if enabled. Not restored: they need an owner decision on their intended config.

## Live verification (see phase2-verification-notes.md, redirect-pattern-audit.csv)
- 79 sitemap URLs = all 79 indexable pages; the other 43 of 122 HTML files are noindex,follow (404, thank-you, legal, concept, 30 redirect stubs). No 80-vs-79 gap reproduces.
- Not changed, needs deploy-level testing: old-host `/legacy-sitemap.xml` redirects to a 404 (the lookahead exclusion in vercel.json does not stop the redirect); the `-cheap-move` style rules match across slashes; `.html` rules redirect to missing targets. Only matters if old-host sitemaps are still submitted.
- Pennington: 15 of 98 text blocks are unique; 43 are verbatim copies from sibling suburb pages. Adding invented facts would be wrong, so unique local content needs facts supplied by the owner.

## Changes in phase 2
- Review proof (rating and count read from site-src/data/google-reviews.json, labelled business-wide) on Hyde Park, Unley Park and Malvern.
- `/removalists-adelaide/` hero image: lazy to eager + fetchpriority high (it is the desktop LCP element).

## Not done / evidence needed
- Production PageSpeed and field CWV: keyless PSI returned 429; needs an API key. Local mobile Lighthouse perf is 77-84, dominated by render-blocking CSS (premium-site.min.css 200 KB raw); inlining critical CSS is a larger change and was not attempted blind.
- Office title/meta: position 6 with 0 clicks looks like a SERP/snippet issue; check live Google before editing.
- Piano price line, Malvern unique facts, Pennington unique facts: need owner-supplied real figures/facts.
- HF benchmark and competitor findings: docs/seo/competitor-gap-report.md (observations only, unverified claims labelled).
