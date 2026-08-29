# ZQ SEO V5 Maintenance Notes

## Source of truth
- `site-src/data/seo-v4.mjs` holds the content model, page builders, FAQ pools, image mapping, and route coverage reporting.
- `scripts/build-site.mjs` remains the generator and sitemap writer.
- `scripts/seo-validate.mjs` is the single SEO QA command.

## Where to add new pages
- Add suburb data in the suburb dataset in `site-src/data/seo-v4.mjs`.
- Add new service or commercial pages in the `commercialPages` array.
- Add new guide topics in the `guideTopics` array.

## How sitemaps are generated
- `scripts/build-site.mjs` emits `sitemap-index.xml`, `sitemap-pages.xml`, `sitemap-services.xml`, `sitemap-suburbs.xml`, and `sitemap-guides.xml`.
- `robots.txt` is written after static asset copy so the sitemap index reference survives the build.

## How validation runs
- `npm run seo:validate` checks duplicate titles, duplicate descriptions, missing H1s, missing canonicals, thin pages, sitemap presence, and route coverage count.
- `npm test` remains the broader regression gate.

## How to avoid thin-page regressions
- Keep suburb pages data-driven and cluster-aware.
- Keep commercial pages limited to real search intent.
- Do not add a page unless it has a clear commercial or planning purpose.
- Keep FAQ pools varied by cluster and supported by visible content.
