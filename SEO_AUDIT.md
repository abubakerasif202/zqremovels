# SEO Audit

## Executive Summary

ZQ Removals is a custom static site generated from `site-src/` and deployed via Vercel. The repo already had a solid base with canonical tags, robots directives, a sitemap build step, and page-level JSON-LD, but it also had three clear problems:

1. The highest-value commercial pages used abstract, operations-heavy copy instead of direct Adelaide moving language.
2. The contact flow had a real implementation issue: `site.js` defined `setupWeb3Forms()` twice, which overwrote the validated API submission path.
3. Several suburb pages exposed internal SEO wording in public copy, and the internal linking between guides, service pages, suburb pages, and quote paths was weaker than it should be.

This pass fixes the homepage, contact page, core service pages, key suburb pages, route pages, metadata, schema output, internal linking, and the quote-form script without changing the routing model.

## Detected Stack

- Custom static site generator: `scripts/build-site.mjs`
- Source content: `site-src/content/**/*.html`
- Shared layout: `site-src/templates/standard.html`
- Shared partials: `site-src/partials/header.html`, `site-src/partials/footer.html`
- Metadata registry: `site-src/pages.json`
- Frontend script: `site.js`
- Deployment target: Vercel

## Routing and SEO Architecture

- Each route is declared in `site-src/pages.json`
- The generator injects `<title>`, meta description, canonical, robots, OG, Twitter, and JSON-LD
- Sitemap generation is handled in `scripts/build-site.mjs`
- `robots.txt` already points to the sitemap
- Redirect handling exists for `/interstate-removalists-adelaide/`
- FAQ schema is generated dynamically only when visible FAQ markup exists

## Key Findings

### Content and CRO

- Homepage hero copy was too abstract for a high-intent commercial page.
- Homepage service summaries were not linking strongly enough into the best commercial and local pages.
- Contact page copy exposed internal SEO logic and implementation detail that customers should never see.
- Contact and quote messaging focused too much on process language and not enough on customer confidence.
- Core service pages leaned on unsupported or inflated claims such as "zero downtime," "zero damage guarantee," "dedicated commercial fleet," and "valet unpacking."
- Route pages were structurally sound but too similar to each other and under-explained for real interstate intent.
- Suburb pages had useful local angles, but several also included visible SEO wording and templated phrasing.

### Metadata

- Metadata coverage already existed, but key commercial titles/descriptions were too repetitive and too dependent on "premium" phrasing instead of clear service intent.
- Core page metadata was not fully aligned to the rewritten on-page copy.
- Social metadata lacked `og:image:alt` / `twitter:image:alt`.

### Internal Linking

- Homepage linked into quote flow, but it did not give enough prominence to service and suburb entry points.
- Guide pages were not consistently pushing users into the best commercial pages.
- Service, route, and suburb pages needed more deliberate cross-links to related services and the quote page.

### Schema

- JSON-LD coverage was already better than average for a small service site.
- Breadcrumb schema was not consistently present on every page with visible breadcrumbs.
- `MovingCompany` markup lacked a consistent `contactPoint`.
- Existing `WebPage` / `ContactPage` schema entries could drift out of sync with route-level metadata because the JSON-LD was stored as static strings.

### Technical SEO

- `site.js` had a duplicate `setupWeb3Forms()` definition. The second definition overwrote the validated API submission path.
- README build instructions were out of date and referenced a Python command that no longer matched the actual build script.
- Footer trust language included unsupported wording around cover.
- Noindex handling for concept/demo pages was already present and sitemap generation respected it.

## Implemented Fixes

### Shared and Technical

- Fixed the duplicated quote-form initialization in `site.js`
- Kept the validated `/api/quote` submission path and redirect to `/thank-you.html`
- Added `og:image:alt` and `twitter:image:alt`
- Normalized `WebPage` / `ContactPage` JSON-LD output to current route metadata at build time
- Added consistent `contactPoint` data to `MovingCompany` JSON-LD at build time
- Added dynamic breadcrumb JSON-LD for pages with visible breadcrumbs that were missing schema
- Added build-time sanitation for leftover public SEO phrasing on legacy suburb pages
- Updated README build instructions to `npm run build`

### Homepage and Contact

- Rewrote the homepage hero, quote section, trust copy, service summaries, suburb links, and final CTA
- Rewrote the contact page as a quote-first local service page
- Unified the contact-page form field model with the working quote API
- Removed public SEO explanations and unsupported review-rating language

### Services and Local Pages

- Rewrote core service page openings and CTA language
- Rewrote route pages to better differentiate Melbourne vs Sydney intent
- Rewrote the highest-value suburb pages already linked from the main site surface:
  - Adelaide CBD
  - Marion
  - Salisbury
  - Elizabeth
  - Glenelg
- Added stronger related-link sections for service pages, suburb pages, route pages, and guide pages via the shared generator

## Verification

- `npm run build`
- Result: successful full static rebuild with updated HTML, metadata, schema, and sitemap output
- Post-build checks:
  - 41 total routes
  - 31 indexable routes
  - 0 duplicate titles
  - 0 duplicate meta descriptions
  - 29 pages with FAQ schema
  - 24 pages with breadcrumb schema
  - Remaining missing H1 only on `premium-moving-concepts/brand-logo/index.html`, which is noindex and not a commercial route

## Remaining Recommendations

- Replace AI-generated imagery with real branded photography when available for stronger trust and CTR.
- If a verified street address, opening hours, or additional business profile URLs are available, add them to `MovingCompany` schema.
- Review older lower-priority suburb pages one-by-one if you want the same level of bespoke local detail applied beyond the top pages updated here.
