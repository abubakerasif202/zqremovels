# ZQ Removals Codex Guide

This repo is a generator-driven static site for `zqremovals.au`. Future Codex runs should treat `site-src/` and `scripts/build-site.mjs` as the source of truth and should not patch `site-dist/` directly.

## Repo Layout

- `site-src/pages.json`
  Route registry. Each page defines output path, layout, canonical, robots, social metadata, JSON-LD, and content source.
- `site-src/content/`
  Route content partials. Most page copy lives here.
- `site-src/partials/`
  Shared header/footer and shared markup fragments.
- `site-src/templates/`
  HTML templates for `standard`, `bare`, and `redirect` page layouts.
- `scripts/build-site.mjs`
  Main site generator. This is where canonical tags, robots, structured data, sitemap output, shared sections, related links, and asset copying are enforced.
- `site-dist/`
  Generated output. Never use this as the long-term edit surface.
- `vercel.json`
  Redirects and deploy routing behavior for production.
- `tests/`
  Regression tests. SEO changes should come with generator- or output-level tests.
- Repo docs:
  `SEO_AUDIT.md`, `META_MAP.md`, `CHANGELOG_SEO.md`, `GOOGLE_SEARCH_CONSOLE_PLAN.md`, `INTERNAL_LINKING_PLAN.md`, `SCHEMA_NOTES.md`

## Build And Test Commands

- Build:
  `npm run build`
- Full test suite:
  `npm test`
- Focused SEO regression:
  `node --test tests/search-console-fixes.test.mjs`
- Other key SEO tests:
  `node --test tests/seo-conversion-pass.test.mjs`
  `node --test tests/eeat-audit.test.mjs`

Run from repo root: `C:\Users\abuba\Downloads\zq`

## Canonical Host Policy

- Canonical host for generated output is the apex domain:
  `https://zqremovals.au`
- All of the following must use the same host:
  canonical tags, `og:url`, JSON-LD URLs and `@id` values, sitemap `<loc>` values, default social image URLs, logo URLs, and any generator-built absolute URLs.
- Do not reintroduce mixed `www`/apex output into generated HTML.
- If the live site still redirects apex to `www` at the platform layer, treat that as a Vercel/domain configuration issue and call it out explicitly in the final report.

## Sitemap Inclusion Rules

Only include pages in `sitemap.xml` when all of the following are true:

- page is intended to be indexable
- page is not a redirect layout
- page is not `404`
- page is not `noindex`
- page is not a temporary preview, concept, or utility page
- canonical points to a real indexable destination on the chosen host

By default, exclude:

- redirect pages
- `404.html`
- `thank-you.html`
- pages with `robots` containing `noindex`
- preview/concept/demo routes under `premium-moving-concepts/`
- any future thin utility pages unless there is an explicit indexing reason

## Redirect Policy For Legacy URLs

- Use permanent redirects for legacy crawlable aliases that map cleanly to a live canonical page.
- Prioritize:
  old `.html` URLs, older service aliases, renamed route paths, and historical local/interstate aliases.
- Keep redirect intent maintainable and reviewable. Prefer grouped, pattern-aware rules or clearly documented explicit mappings over ad hoc one-offs.
- Redirect targets must always be the canonical live route with trailing slash where appropriate.
- Redirect pages in `pages.json` must also remain `noindex,nofollow`.
- Redirect-only paths must never appear in sitemap output.

## Structured Data Constraints

- Use valid, minimal JSON-LD. No spammy or duplicative schema.
- Schema URLs must match the canonical host policy.
- Do not emit duplicate `FAQPage`, `BreadcrumbList`, or conflicting `WebPage`/`Service` entities for the same route.
- Only include schema types supported by the visible page intent.
- Keep `MovingCompany`, `WebPage`/`AboutPage`/`ContactPage`, `Service`, `BreadcrumbList`, and `FAQPage` consistent with visible content.
- Do not add fake ratings, fake reviews, fake locations, or unsupported claims.

## Internal Linking Standards

- Links must be useful to users first, not anchor-stuffing.
- Improve discoverability across:
  homepage, service pages, suburb pages, interstate route pages, and guide pages.
- Treat the site as a hierarchy, not a flat related-links pool:
  homepage -> Adelaide hub + northern/southern hubs
  region hubs -> differentiated suburb pages + core service pages + guide hub
  suburb pages -> regional hub + best-fit services + quote path + interstate support where relevant
  service pages -> sibling services + relevant hubs/suburbs + supporting guides + quote path
  guides -> best-fit services + relevant hubs/suburbs + quote path
  interstate pages -> interstate hub + local entry points + packing/support guides + quote path
- Avoid orphan pages.
- Related links should be geographically and intent-relevant:
  suburb -> nearby suburb/service/quote
  service -> sibling service/local hub/interstate/quote
  interstate route -> interstate hub/sibling routes/packing/quote
  guide -> relevant service pages and quote path
- Avoid repetitive exact-match anchors across the same template block.
- Prefer natural anchor phrasing and route diversity over keyword repetition.

## SEO V3 Cluster Rules

- Strengthen cluster authority flow through shared generator registries before editing page-local copy.
- The main ranking clusters are:
  Adelaide removals hub
  Southern Adelaide hub
  Northern Adelaide hub
  core service pages for house, furniture, packing, office, and interstate
  differentiated suburb pages
  guide pages that answer real pre-quote planning questions
- Homepage links should introduce the major hubs, service clusters, and guide entry points.
- Regional hubs should work as cluster controllers:
  they should link down into the right suburb nodes, sideways into the right services, and upward into the main Adelaide hub or quote path.
- Guide pages should support money pages and conversion, not exist as isolated blog posts.
- Conversion paths should stay natural:
  guide/suburb/hub -> best-fit service page -> quote form
  When the brief is already clear, linking directly to `/contact-us/#quote-form` is acceptable as a secondary CTA.

## Suburb Expansion Rules

- Add suburb pages only when the suburb has a real operational angle that changes the move brief.
- Valid differentiation includes:
  apartment or tower access
  coastal access
  southern vs northern corridor logistics
  family-home and garage-heavy inventory
  commercial or mixed-use inventory
  storage-linked routes
  loading, parking, stair, or service-lift constraints
  interstate departure or handover relevance
- Do not mass-produce suburb pages or duplicate an existing suburb page's intent.
- New suburb pages must fit naturally into:
  one regional hub
  at least one core service cluster
  at least one guide or interstate support path when relevant

## Guide Library Rules

- Add guides only when they answer a realistic planning question before quote approval.
- Every guide should have:
  a clear intent
  a natural link into at least one money page
  a natural link into a relevant hub or suburb page when useful
  enough unique detail to justify indexing
- Preferred guide angles are:
  packing timing
  heavy furniture handling
  apartment and tower move preparation
  office dock, lift, and restart planning
  interstate preparation
  pricing expectation framing
  access logistics for CBD, coastal, corridor, or family-home moves
- Do not publish fluff, doorway-style guides, or thin content built only to host links.

## Done When Checklist

Before claiming SEO work is complete, verify all of the following:

- `npm run build` passes
- relevant tests pass, at minimum the focused SEO regressions plus any affected suites
- canonical output is consistent on the apex host
- no mixed-host SEO output remains in generated HTML or sitemap
- sitemap contains only intended indexable pages
- redirect pages, `404`, and noindex utility pages are excluded from sitemap
- legacy SEO-critical aliases redirect correctly
- critical generated pages do not contain broken internal links
- structured data stays valid and host-consistent
- any remaining Vercel dashboard or domain-layer action is called out explicitly

## Working Rules For Future Runs

- Inspect source-of-truth files first:
  `scripts/build-site.mjs`, `site-src/pages.json`, `vercel.json`, `tests/`, and affected `site-src/content/**`
- Prefer small, generator-level fixes over page-by-page output hacks.
- Add or update regression tests with SEO behavior changes.
- Do not assume Search Console issues are fully repo-fixable if the domain host behavior is still controlled by Vercel project settings.
