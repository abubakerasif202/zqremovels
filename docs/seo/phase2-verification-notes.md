# Phase 2 verification notes (2026-11-06)

Read-only audit. No existing file edited, nothing committed. Probes: 27 GETs to production with `redirect: manual`, concurrency 3, 250 ms spacing, max 6 hops. Raw rows: `docs/seo/redirect-pattern-audit.csv`.

## 1. Pattern redirects in vercel.json (10 of 380)
Indexes 0-9 in the `redirects` array: `/adelaide-moving-guides/:slug.html`, `/adelaide-to-:slug.html`, `/removalists-:slug.html`, three `/:slug(.*-cheap-move.*|-budget-movers.*|-discount-removals.*)` rules, `/:path*/index.html`, two old-host rules (`zqremovals.au`, `www.zqremovals.au`) with a `legacy-sitemap.xml` exclusion, and a `www.zqremovalsadelaide.com.au` host rule.

Observed:
- All match cases reach the rule destination. `trailingSlash: true` in vercel.json means Vercel first 308s slashless paths to the slash form, so rules 3-5 take two hops (slash, then rule). This is normal, not a defect.
- Rule `.html` matches (0-2) redirect even when the target does not exist: `/adelaide-moving-guides/zz-not-a-guide.html` and `/adelaide-to-zz.html` end in 404 after a 308.
- `/removalists-semore.html` goes 308 to `/removalists-semore/` then 308 to `/removalists-semaphore/` (2 hops; the typo alias exists as a redirect-layout page).
- Rule 3 regex `.*` crosses `/`: `/a/b-cheap-move` (nested, not a single slug) redirects to `/cheap-removalists-adelaide/`. Any path containing `-cheap-move`, `-budget-movers` or `-discount-removals` is swallowed.
- Old-host `legacy-sitemap.xml` exclusion is ineffective: `https://zqremovals.au/legacy-sitemap.xml` and the `www.` variant return 301 to `https://zqremovalsadelaide.com.au/legacy-sitemap.xml`, which is 404. vercel.json rewrites those hosts to `/api/legacy-sitemap/`, but the redirect fires first. Not tested: why the lookahead fails; no claim made.
- `.htm` near-misses (`/removalists-glenelg.htm`, `/contact-us/index.htm`) do not redirect and are 404.
- Apex host and `www.zqremovalsadelaide.com.au` rules behave as written (301/308 to apex).

## 2. Sitemap vs generated pages
- site-dist contains 122 `.html` files. 79 are indexable (robots `index,follow`) and exactly those 79 are in sitemaps (sitemap-pages 5, services 15, suburbs 48, guides 11; ai-sitemap.xml repeats all 79). No indexable page is missing from the sitemap, so the 80 vs 79 gap is not reproducible from site-dist: the number of indexable generated pages is 79.
- The 43 excluded pages are all `noindex,follow`: 404.html, thank-you, book-consultation, privacy-policy, terms-and-conditions, adelaide-removalists-facebook-offer, five premium-moving-concepts routes, seo-v4/overview, four /guides/* pages, and 30 meta-refresh redirect stubs whose canonical points to the destination.
- No sitemap URL is noindex, meta-refresh, or canonicalised elsewhere. Every sitemap URL's canonical equals its own URL.
- pages.json has 96 entries (73 indexable standard, 12 redirect layout, 10 noindex standard, 1 bare); the remaining html files are generator-created stubs and are not in pages.json.

## 3. Internal redirected links
`node scripts/audit-internal-redirect-links.mjs` (exit 1): `/privacy/ -> /privacy-policy/ (1 page: /book-consultation/)`, 1 link to 1 redirected target. `book-consultation/index.html` contains `href="/privacy/"`. No sitemap XML contains a `.html`, `/index`, or `-cheap-move/-budget-movers/-discount-removals` URL, and no sitemap URL matches a non-pattern redirect source.

## 4. Pennington
`/removalists-pennington/` has 98 text blocks (p/li/h2/h3 over 25 chars). Compared with Salisbury, Port Adelaide, Semaphore:
- 43 blocks are verbatim duplicates of text on at least one of the three pages (38 on all three): pricing, trust, CTA, guide cards.
- 40 more match a sibling page once suburb names are swapped (template sentences with `{suburb}`).
- 15 blocks are unique to Pennington (no match in any of the three, even with suburb swapped), e.g. the "mixed residential and industrial access" statements, "Port Adelaide and West Lakes links for route comparison", the "Access and property notes" paragraphs, "Local household relocations" body, "Nearby route comparisons include Port Adelaide and West Lakes". The five "Researching removalists in X often yields similar logistics to Pennington" nearby-route paragraphs are the same template as the other pages.
Inbound links in site-dist (4, all body-level, none from nav/footer or hubs):
- `/removalists-allenby-gardens/` anchor "Pennington removals" (related-route card) - relevant, neighbouring suburb.
- `/removalists-port-adelaide/` anchor "moving support in Pennington" (route card) - relevant.
- `/removalists-west-lakes/` anchor "moving support in Pennington" (route card) - relevant.
- `/removalists-semaphore/` anchor "removalists in Pennington" (sentence: same City of Port Adelaide Enfield area) - relevant.
Pennington appears in the sitemap. Facts only; no claim about indexing.

