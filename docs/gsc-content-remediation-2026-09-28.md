# GSC content architecture remediation — 28 September 2026

## Evidence and decisions

The supplied GSC priorities favor Hyde Park, office removalists, Unley Park, the Adelaide commercial hub and pricing. Repository inspection confirmed generator-owned output: `scripts/build-site.mjs`, `site-src/pages.json`, `site-src/data/seo-v4.mjs` and imported registries feed the Astro build. Generated output is not the edit surface.

No URL-level backlink export was available. Outreach plans are not backlink evidence. Consolidation decisions use existing route usage, internal links, source content, existing alias policy and the supplied search performance; no unrelated locations are deleted.

| Intent | Before | After |
| --- | --- | --- |
| Educational moving cost | Two question/cost guides, with established internal and legacy links to the shorter cost URL | Keep `/adelaide-moving-guides/removalists-cost-adelaide/`; permanently redirect `/adelaide-moving-guides/how-much-do-removalists-cost-adelaide/` and its legacy guide aliases directly to it |
| Published commercial rates | Pricing and comparison language included unsupported fixed-price promises | `/removalists-adelaide-prices/` remains the commercial rates destination; estimates follow the published time rates and applicable travel charge |
| Furniture moving | Existing canonical winner and already consolidated aliases | Preserve `/furniture-removalists-adelaide/`; preserve permanent redirects from `/services/furniture-removals-adelaide/` and `/furniture-removals-adelaide/` |
| Queens Park | Sydney/NSW references mixed with Adelaide suburb classification | Retain the existing Queens Park URL for a clearly identified NSW–Adelaide interstate enquiry; remove Adelaide suburb classification; packing/apartment derivative aliases resolve to the retained page |
| Affordable moving | Risk of synonym duplication with rates | Retain `/cheap-removalists-adelaide/` for practical ways to reduce moving time, with contextual links to published rates |

No source content files were deleted. Duplicate routes use permanent platform redirects and are excluded from indexable sitemap output. New duplicate cost-guide aliases use explicit HTTP 301. Existing furniture and other alias rules retain Vercel `permanent: true` (HTTP 308).

## Source changes

`vercel.json` and `site-src/data/zq-redirects-verified.json` implement direct final destinations. `scripts/seo-redirects-build.mjs` preserves the reviewed guide decision when older audit data is regenerated. `site-src/data/zq-redirects-deferred.json` removes the superseded cost decisions.

`site-src/data/zq-services.mjs` and `site-src/data/zq-blog-guides.mjs` remove unsupported fixed-price promises and exposed editorial language. The piano registry replaces an unsupported equipment list with a request for dimensions and access photos. `site-src/data/zq-internal-links.mjs` points furniture links at the established winner and replaces fixed-price anchor claims with published-rate language.

`tests/gsc-content-remediation.test.mjs` covers direct cost redirects, furniture destination preservation and source registry pricing/editorial regressions.

## Release checks and remaining actions

The parent remediation report must record final build/test counts, generated route and sitemap checks, metadata changes, and the committed/pushed SHA. Local route checks do not establish deployed HTTP behavior. Production configuration and every important final URL must be checked after deployment, including HTTPS apex canonical behavior and redirect status without chains.

After deployment, inspect the five priority URLs in Search Console, request indexing for materially changed pages, submit the canonical sitemap and monitor query-specific clicks/CTR/position. Check excluded duplicate guides for permanent redirect recognition and the retained Queens Park page for the correct interstate intent. Compare equivalent date windows; do not interpret a few days of ranking movement as a completed recovery.
## Content and intent changes

- Homepage: brand-led H1 and title; retains established layout, contact form, Google review data and service navigation. Its primary area CTA now links to `/removalists-adelaide/`.
- Adelaide commercial hub: retains its service coverage and locator; adds contextual Hyde Park, Unley Park, office and published-rate links. Removes guaranteed-total implications from manual estimate review.
- Hyde Park and Unley Park: replace page-template explanations with access, stairs, furniture, packing, quote information and verified crew rates. Concise visible FAQs have matching FAQ schema. Priority cross-links connect the two suburbs and Adelaide hub.
- Office: preserves docks/lifts, desks, IT equipment, access windows and restart-order planning. Updates title, description and H1 toward office removalists; removes unsupported supplied-crate and restart guarantees.
- Moving-company page: comparison of inventory, written scope, charging basis and access; links to the primary commercial hub instead of repeating its service landing content.
- Affordable-moving page: practical preparation and access advice rather than a synonym copy of the rates page.
- Surviving educational cost guide: replaces unsupported industry ranges, surcharge percentages, experience/move-count statistics and fixed-price guarantees with published crew rates, time factors, packing/access preparation and quote details. Article schema describes the visible guide; no invisible FAQ schema is added.
- About: removes unsupported 10+ years / 500+ moves statistics and guaranteed-price wording. Preserves the established business identity and Google review source.
- Existing reviewed Google information is retained from `site-src/data/business.mjs` (owner-supplied source). No new testimonials, certifications, insurance, operating areas, equipment or availability claims were added. No new photos or location pages were created.

## Live domain issue and correction

Read-only HTTP checks and the Vercel project-domain API confirmed apex had a platform-level HTTP 301 redirect to `www`, conflicting with the repo apex policy. The `www` robots.txt and sitemap.xml then redirected back to apex, creating a loop. In project `zq` (`prj_6vIhorJ04HTaDOn6oOSHNsezQ4Oh`), apex redirect was cleared and `www.zqremovalsadelaide.com.au`, `zqremovals.au` and `www.zqremovals.au` were set to HTTP 301 directly to apex. Subsequent live checks confirmed apex pages, robots.txt and sitemap.xml return HTTP 200, and all checked `www` paths redirect to apex. This domain correction was made independently of the content deployment.

## Validation environment

Node 22.23.1 and npm 10.9.8; Vercel project uses Node 22.x, build `npm run build`, output `site-dist`. Local esbuild executable was missing; `npm rebuild esbuild` repaired the installation without changing dependencies. TypeScript 6 deprecated `baseUrl`, and the root typecheck included ignored unrelated sample trees. The alias now uses `./src/*` directly and excludes `extra-equinox`, `net-commander`, output and dependencies. `npx tsc --noEmit` passes.

No dedicated lint script or linter configuration exists. Syntax validation uses `node --check` over tracked JavaScript modules. No production form submission was made.
