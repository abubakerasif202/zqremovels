# SEO Changelog

## Files Changed

- `scripts/build-site.mjs`
- `site.js`
- `site-src/pages.json`
- `site-src/partials/footer.html`
- `site-src/README.md`
- `site-src/content/index.html`
- `site-src/content/contact-us/index.html`
- `site-src/content/removalists-adelaide/index.html`
- `site-src/content/interstate-removals-adelaide/index.html`
- `site-src/content/office-removals-adelaide/index.html`
- `site-src/content/furniture-removalists-adelaide/index.html`
- `site-src/content/packing-services-adelaide/index.html`
- `site-src/content/adelaide-to-melbourne-removals/index.html`
- `site-src/content/adelaide-to-sydney-removals/index.html`
- `site-src/content/removalists-adelaide-cbd/index.html`
- `site-src/content/removalists-marion/index.html`
- `site-src/content/removalists-salisbury/index.html`
- `site-src/content/removalists-elizabeth/index.html`
- `site-src/content/removalists-glenelg/index.html`
- `SEO_AUDIT.md`
- `META_MAP.md`
- `INTERNAL_LINKING_PLAN.md`
- `SCHEMA_NOTES.md`
- `CHANGELOG_SEO.md`

## Why Each Area Changed

### Shared Build and Technical Layer

- `scripts/build-site.mjs`
  - added social image alt tags
  - normalized route-level schema output
  - generated breadcrumb schema when visible breadcrumbs exist
  - added shared related-link sections for commercial pages
  - sanitized leftover public SEO phrasing on older suburb pages

- `site.js`
  - removed duplicated `setupWeb3Forms()` implementation
  - preserved validated API submission path
  - restored reliable quote submission behavior

- `site-src/pages.json`
  - updated high-value metadata for homepage, contact, services, routes, and top suburb pages

- `site-src/partials/footer.html`
  - removed unsupported trust wording
  - tightened footer CTA copy

- `site-src/README.md`
  - corrected build instructions to the actual Node build command

### Public-Facing Page Rewrites

- Homepage
  - clearer Adelaide positioning
  - stronger quote-first CTA path
  - better service and suburb internal links
  - removed abstract operations-heavy copy and unverified rating language

- Contact page
  - rebuilt as a high-conversion quote page
  - removed internal SEO wording and old form implementation details
  - aligned form fields with the working API

- Core service pages
  - rewrote openings and CTA copy
  - removed unsupported claims
  - improved cross-linking and local relevance

- Route pages
  - differentiated Melbourne vs Sydney intent
  - linked back into interstate hub and quote flow

- Top suburb pages
  - improved local specificity
  - removed visible SEO phrasing
  - linked more clearly to commercial quote paths

## SEO / CRO Impact Summary

- Clearer local and commercial messaging on the homepage and contact page
- Better metadata alignment between on-page copy, SERP snippets, and schema
- Stronger crawl paths from homepage, guides, services, suburbs, and route pages
- Safer structured data output with more consistent breadcrumb and business contact coverage
- More reliable quote form behavior after fixing the overwritten submission logic

## Remaining Recommendations

- Replace AI imagery with real project photography when available
- If verified business hours or more profile URLs exist, add them to schema
- Continue the same level of manual copy improvement for lower-priority suburb pages if they become traffic drivers
