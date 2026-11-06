# Live audit notes - 2026-11-06

Read-only GET audit of https://zqremovalsadelaide.com.au (branch feat/seo-growth-2026-11-06). Redirects were not auto-followed; 4 concurrent workers, ~60 ms pause per request, UA `ZQ-read-only-audit/1.0`. No GSC/GTM/Ads accounts touched. Companion files: `live-url-inventory.csv` (79 rows), `redirect-audit.csv` (390 rows: 370 vercel.json exact sources + 20 variant/404 rows).

## Method / commands

- Node 22 `fetch(url,{redirect:'manual'})`, chain followed hop by hop (max 6 hops, loop detection by seen-URL set). Script kept outside the repo in the session scratchpad (`audit.mjs`, `links.mjs`).
- Sitemap: `GET /sitemap.xml` is a sitemap index of 5 child files (`sitemap-pages.xml`, `-services.xml`, `-suburbs.xml`, `-guides.xml`, `-images.xml`); 79 unique page `<loc>` URLs. `<image:loc>` entries are not `<loc>` and were not fetched.
- Redirect sources: `vercel.json` `redirects` has 380 entries; 370 are exact string sources (audited), 10 contain pattern characters (`:`, `(`, `*`) and were skipped by instruction.
- Internal-link check: all 79 sitemap pages scanned for `<a href>` pointing at any of the 370 redirect sources.
- Main-text word count = text inside `<main>` with script/style/svg stripped. Overlap = 5-word shingles.

## Four-way register

### 1. Confirmed current (verified live today)

- All 79 sitemap URLs: HTTP 200, canonical equals the URL (79/79), meta robots `index,follow,max-image-preview:large` (79/79), exactly 1 H1 (79/79), no duplicate titles, no sitemap URL redirects.
- No sitemap page links to any of the 370 redirecting source paths (0 hits).
- Host/protocol normalisation works: `http://` apex and `https://www.` apex-bound variants reach the apex in 1 hop (308); `http://www.` takes 2 hops (308 to `https://www.`, 308 to apex) - 5/5 tested pages (`/`, `/removalists-adelaide/`, `/contact-us/`, `/removalists-salisbury/`, `/removalists-pennington/`). All finish on apex HTTPS 200.
- `vercel.json` has `trailingSlash:true`. Slashless `/removalists-adelaide` -> 308 -> `/removalists-adelaide/` (200). Slashless + query keeps the query on redirect. `/removalists-adelaide/?utm_source=audit&x=1` is 200 and its canonical is the clean URL.
- Chain results (all end 200 on a canonical URL):
  - `/adelaide-moving-guides/how-much-do-removalists-cost-adelaide/` -> 301 -> `/adelaide-moving-guides/removalists-cost-adelaide/` (1 hop).
  - `/apartment-removals-adelaide/` -> 308 -> `/apartment-removalists-adelaide/` (1 hop).
  - `/services/furniture-removals-adelaide/` -> 308 -> `/furniture-removalists-adelaide/` (1 hop).
  - `/sydney-to-adelaide-removalists/` -> 308 -> `/interstate-removals-adelaide/` (1 hop).
  - `/removalists-myrtle-bank/` -> 308 -> `/removalists-adelaide/` (1 hop; destination is the Adelaide hub, not a suburb page).
- No redirect loops. No chain over 2 hops. No final non-200 among the 370 sources.
- Missing URL `/zz-audit-made-up-404-page-xyz/` returns a real 404.
- `robots.txt` (200): `User-agent: *`, `Allow: /`, two `Sitemap:` lines (`/sitemap.xml`, `/ai-sitemap.xml`), commented references to `/llms.txt` and `/llms-full.txt`. No Disallow rules.

**Defects / inefficiencies confirmed**

- 46 of 370 redirect sources take 2 hops (all slashless sources: first a 308 slash-normalisation, then the configured redirect). Of these, 43 are 308>308 and 3 are 308>301: `/guides/how-much-do-removalists-cost-adelaide`, `/adelaide-moving-guides/how-much-do-removalists-cost-adelaide` and `/adelaide-moving-guides/how-much-do-removalists-cost-adelaide/index.html`. Examples: `/contact`, `/blog`, `/privacy`, `/terms`, `/furniture-removals-adelaide`, `/apartment-removals-adelaide`, `/removalists-semore`. Full list: `flags` contains `CHAIN_GT1` in `redirect-audit.csv`.
- 7 `vercel.json` redirects use `statusCode:301` and 363 use `permanent:true` (served as 308). Both are permanent; no 302/307 observed.
- `/sitemap-index.xml` redirects to `/sitemap.xml` (200, no canonical tag since XML).
- `/removalists-myrtle-bank/` is a redirect to the hub, while a recent commit (42634bf) references a Myrtle Bank card; whether that is intended is a content decision (see Needs decision).

### 2. Historical / stale (evidence from other files, not re-confirmed as a live problem)

- GSC export `sitemap_urls.csv` has 91 rows; 79 match the live sitemap exactly. The other 12 are `.webp` image URLs (`/brand-logo-96.webp`, `/branding/ab-digital-solutions-watermark.webp`, and 10 under `/media/`) that appear in the image sitemap, not page URLs. Live page URLs absent from the GSC copy: 0. So the GSC copy shows no stale page URLs.
- Any GSC-reported "not indexed" status for pages that are now 200/indexable is historical until re-inspected; this audit did not query GSC.

### 3. Expected exclusions (correctly absent from the sitemap)

- `/privacy-policy/`, `/terms-and-conditions/`, `/thank-you/`: HTTP 200, `noindex,follow`. Redirect aliases (`/privacy`, `/terms`, `*.html`, `*/index.html`, `/sitemap-index.xml`) end here or at the sitemap; 12 of the 370 redirect sources finish on a non-sitemap URL for this reason (all legal/sitemap aliases).
- `/thank-you.html` returns 404 with a `noindex,follow` robots meta.
- The 12 image URLs above (image sitemap entries).

### 4. Unverified

- The 10 pattern-based `vercel.json` redirect rules were not exercised.
- Behaviour with the sitemap/`ai-sitemap.xml` (`/ai-sitemap.xml`) content: not fetched or compared.
- Googlebot-specific responses (UA-based differences) not tested; only a generic UA was used.
- Any reason a page is or is not indexed by Google: not determinable from these checks.

## /removalists-pennington/ deep check (facts only)

- Live: HTTP 200; in the live sitemap; canonical self-referencing `https://zqremovalsadelaide.com.au/removalists-pennington/`; robots `index,follow,max-image-preview:large`.
- Title: `Pennington Removalists | ZQ Removals`. H1 count: 1. H2 count: 20. JSON-LD blocks: 6.
- Main-text length: 1,399 words (`/removalists-salisbury/`: 1,727 words).
- Internal links out: 105 anchors, 41 unique internal targets (excluding self).
- Internal links in (from the 78 other sitemap pages): 3 pages - `/removalists-port-adelaide/`, `/removalists-west-lakes/`, `/removalists-allenby-gardens/`. For comparison `/removalists-salisbury/` receives links from 78 sitemap pages.
- Overlap with `/removalists-salisbury/` main text (5-word shingles): Jaccard 36.8 %; 60.1 % of Pennington's shingles also occur in Salisbury's text. Rough measure only; shared template phrases are included.
- No visible rendering problems found in the HTML-level checks above (single H1, valid canonical, 200). Visual rendering was not checked.

## Needs decision

1. Fix 2-hop redirects for slashless legacy sources by adding the trailing-slash form as the source/destination target (affects 46 entries) - or accept as harmless.
2. `/removalists-myrtle-bank/` redirects to `/removalists-adelaide/`; confirm that is intended given the Myrtle Bank card commit.
3. `/removalists-pennington/` has only 3 inbound internal links versus 78 for Salisbury; decide whether to add links from hubs/related suburbs.
