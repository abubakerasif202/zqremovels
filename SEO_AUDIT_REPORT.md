# SEO audit report — 5 November 2026

Audit of the generator source, the rebuilt `site-dist/` output, and live HTTP checks of `https://zqremovalsadelaide.com.au`. Historical Search Console counts from earlier investigations were not treated as current defects.

## Scope and method

- Source of truth: `site-src/pages.json`, `site-src/data/seo-v4.mjs`, `site-src/data/zq-services.mjs`, `site-src/data/zq-suburbs.mjs`, `scripts/build-site.mjs`, `vercel.json`.
- Local output: `npm run build`, then `npm run seo:validate`.
- Metadata pass over the merged page registry: 96 static routes, 88 generated routes, 124 merged routes, 79 indexable routes.
- Live checks on 5 November 2026 used single-hop HTTP requests. The same hops were read again from `https://zqremovalsadelaide.com.au` after pull request 91 merged. Search Console was not queried.

## Inventory summary

| Check | Result |
| --- | --- |
| Indexable sitemap page URLs | 79 |
| Image sitemap URLs | 79 |
| Sitemap children | pages 5, services 15, suburbs 48, guides 11 |
| SEO validator bad pages | 0 |
| Duplicate indexable titles | 0 |
| Duplicate indexable meta descriptions | 0 |
| Titles outside the generator length clamp | 0 |
| Descriptions outside the generator length clamp | 0 |
| Indexable pages missing a self canonical on the apex host | 0 |
| Generated suburb pages missing one H1 | 0 |

Indexable page kinds in the registry: 42 suburb pages, 19 content pages, 6 commercial pages, 5 guides, 5 interstate routes, 1 comparison page, and the homepage.

## Live host behaviour already in place

These checks passed on the current production site. They are not new fixes from this branch.

| URL | Status | Next hop |
| --- | --- | --- |
| `http://zqremovalsadelaide.com.au/` | 308 | `https://zqremovalsadelaide.com.au/` |
| `https://www.zqremovalsadelaide.com.au/` | 308 | `https://zqremovalsadelaide.com.au/` |
| `https://zqremovals.au/` | 301 | `https://zqremovalsadelaide.com.au/` |
| `https://www.zqremovals.au/` | 301 | `https://zqremovalsadelaide.com.au/` |
| `/removalists-kings-park/` | 308 | `/removalists-unley-park/` |
| `/services/furniture-removals-adelaide/` | 308 | `/furniture-removalists-adelaide/` |
| `/robots.txt` and `/sitemap.xml` | 200 | — |

`robots.txt` allows crawling and lists the apex sitemap. Redirect aliases, `noindex` utility pages, and preview routes stay out of the page sitemap. Kings Park is an inner-south Unley suburb, and the live alias already points at Unley Park.

## Issues found

### 1. Repeated suburb access copy — high

Forty generated suburb pages contained the same two paragraphs, with only the suburb name swapped:

- "Parking in {suburb} should be treated as an access variable..."
- "Apartment and townhouse moves usually need service lifts..."

Jaccard similarity on the full HTML was 0.72 or higher for 750 suburb pairs because the shared template dominates the page. Hyde Park and Unley Park already use their own priority copy and were not part of that paragraph.

Root cause: `renderSuburbContent()` in `site-src/data/seo-v4.mjs` printed one access section for every generated suburb. Council and landmark records already existed in `site-src/data/zq-suburbs.mjs` and were not used in that section.

### 2. Hyperlocal links collapsed onto one prices URL — medium

The hyperlocal block on Glenelg, Salisbury, Adelaide CBD, Marion, and Norwood linked `/moving-quotes-adelaide/`, `/fixed-price-removalists-adelaide/`, and `/affordable-removalists-adelaide/`. Those aliases permanently redirect to the prices page or the cheap-removalists page. One label was "Moving removalists Adelaide".

Root cause: `renderHyperlocalAuthoritySection()` listed keyword aliases instead of the surviving canonical URLs.

### 3. Piano snippet omitted grand pianos — medium

`/services/piano-movers-adelaide/` already explains upright, grand, and digital pianos. The meta description mentioned only upright and digital pianos. Search Console history shows piano queries with high impressions and weak average positions. That is a snippet mismatch, not evidence of a ranking change.

### 4. Checked and left as intentional

- Duplicate service URLs under `/services/` are `noindex` redirect pages with canonicals on the root service URLs, and Vercel serves permanent redirects. They are absent from the sitemap.
- Legacy `.html` aliases, the old `zqremovals.au` host, HTTP, and `www` already resolve in one hop to the apex canonical.
- Non-suburbs such as Locksley, Rosemont, Field Park, Seaton South, and Somerton Park West are redirect sources, not indexable pages.
- The repeated FAQ questions "Do you service {suburb}?" and "Can you move furniture in {suburb}?" remain because they answer the query and existing regressions require them. They are suburb-specific in the answer, and they are thinner than the old shared parking section.
- Metadata length, canonical host, sitemap membership, and broken-internal-link checks already passed in the generator.

## Production release

Pull request 91 merged at 2026-11-04T18:56:22Z. Production commit `8b1d2b2d69adb62ec489db906502b4614efbf213`. Vercel deployment `dpl_4YnMyMcg25xLojVVWDRwwTxqVkwW` is Ready and aliased to `https://zqremovalsadelaide.com.au`. Deployment URL: `https://zq-rsjkxjiwy-abubakerasif202s-projects.vercel.app`.

After that deployment, the apex homepage, Glenelg, Salisbury, the piano page, the contact quote form, `robots.txt`, and the sitemap were read from production. Canonicals use the apex host. Glenelg names the City of Holdfast Bay. The piano description names upright, grand, and digital pianos. The suburb sitemap lists 48 URLs. HTTP, `www`, Kings Park, and the furniture alias under `/services/` still redirect in one hop. `/thank-you/` remains `noindex`.

## What this audit did not measure

- A fresh Google Search Console coverage export. Earlier figures of about 79 indexed sitemap URLs, 28 redirects, and 2 noindex URLs were not re-read from the API in this session. No ranking change is claimed.
- Field Core Web Vitals from Search Console or CrUX. Lighthouse CI on commit `ae2a543` passed, including the repository test suite and Playwright, before the merge.
- A full visual pass in a desktop browser. Rendered HTML was checked by the generator tests and by the production fetches above.
- Live quote delivery to Web3Forms. Form contracts were covered by existing tests, and no live lead was sent.
