# ZQ Removals Sitemap Validation Report

Validated: 24 July 2026  
Canonical origin: `https://zqremovalsadelaide.com.au`

## Result

The current local sitemap implementation passes the repository's SEO validator and the sitemap quality checks. The deployed sitemap contains the same 315 canonical page URLs, and every checked live URL returns HTTP 200 without a redirect and remains self-canonical and indexable.

One low-severity implementation issue remains: every live page sitemap entry currently uses the same `<lastmod>` value (`2026-07-22`). The current local build produces 17 dates ranging from `2026-04-10` through `2026-07-23`, but `scripts/build-site.mjs` derives those values from source-file modification times. A clean deployment checkout can assign similar checkout-time mtimes to every source file, so the local variation is not stable evidence that a redeploy will fix production.

## Local Validation

| Check | Result |
| --- | --- |
| XML parsing | Pass for all generated sitemap files |
| Sitemap index entries | 5 |
| Unique page URLs | 315 |
| Page sitemap split | 17 general, 83 service, 147 suburb, 68 guide URLs |
| Image sitemap page entries | 315 |
| HTTPS-only page URLs | Pass |
| Duplicate page URLs | None |
| Non-apex URLs | None |
| Redirect URLs included | None |
| `noindex` URLs included | None |
| Missing generated 200 outputs | None |
| Deprecated `<priority>` tags | None |
| Deprecated `<changefreq>` tags | None |
| Local `<lastmod>` values | 17 unique dates |
| `robots.txt` sitemap reference | Pass |

`npm run seo:validate` reported:

```text
bad pages = 0
sitemap summary = {"indexSitemaps":5,"pageUrls":315,"imageUrls":315,"sitemapCounts":{"sitemap-pages.xml":17,"sitemap-services.xml":83,"sitemap-suburbs.xml":147,"sitemap-guides.xml":68},"noindexExclusions":1,"redirectExclusions":18}
seo validation passed for 334 pages
```

## Live Validation

| Check | Result |
| --- | --- |
| `/robots.txt` | HTTP 200, references the apex sitemap index |
| `/sitemap-index.xml` | HTTP 200, no redirect, 5 child sitemaps |
| Page sitemap files | All HTTP 200 without redirects |
| Unique live page URLs | 315 |
| Live URL responses | 315 HTTP 200 responses |
| Live URL redirects | None |
| Live canonical mismatches | None |
| Live `noindex` entries | None |
| Local/live URL-set difference | None |
| Live `<lastmod>` values | Low severity: all 315 are `2026-07-22` |

## Sitemap Files

- `sitemap-index.xml`
- `sitemap-pages.xml`
- `sitemap-services.xml`
- `sitemap-suburbs.xml`
- `sitemap-guides.xml`
- `sitemap-images.xml`
- `sitemap.xml` (index alias)
- `ai-sitemap.xml`

## Recommendation

Replace filesystem-mtime-derived `<lastmod>` values with stable page metadata or a reliable Git-history date source, or omit `<lastmod>` when no trustworthy date exists. Validate the chosen behavior from a fresh checkout before deployment, then repeat the live distribution check.

No URL, canonical, robots, inclusion, or sitemap-splitting change is required.
