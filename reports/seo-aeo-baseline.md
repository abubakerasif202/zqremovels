# SEO + AEO baseline (2026-10-30)

Evidence: `node scripts/live-seo-audit.mjs` -> `reports/seo-aeo-live-crawl.json` (live production, origin https://zqremovalsadelaide.com.au, main @ 6259576).

## Live crawl result (79 sitemap URLs)
| Check | Result |
|---|---|
| HTTP status | 79/79 return 200 |
| Canonical | exactly one per page, all self-referencing on the apex host |
| Robots meta / X-Robots-Tag | no sitemap URL is noindex; /thank-you/ and /404.html are noindex,follow (intended) |
| Titles / descriptions | present and unique; 5 titles over 60 chars (low) |
| H1 | exactly one per page; no heading-level skips |
| JSON-LD | parses on every page; no duplicate FAQPage or BreadcrumbList; MovingCompany on all 79 |
| Images | no <img> without alt |
| Internal links | no broken links, no legacy/www links, no orphans |
| Sitemap | index + 4 page sitemaps + image sitemap; `npm run seo:validate` passes (108 pages, 28 redirect exclusions, 1 noindex exclusion) |

## Redirects
| From | Result |
|---|---|
| http://apex | 308 -> https apex |
| https://www.zqremovalsadelaide.com.au | **307** -> apex (temporary; see search-console-actions.md) |
| https://zqremovals.au (and www) | 301 -> apex |
| no-trailing-slash path | 308 -> trailing slash |
| /index.html | 308 -> / |

## Not measurable in this session
Search Console, GA4 and Bing data: the GSC Wizard connector returned `payment_required` (trial ended). Historical figures (78 indexed / 34 not indexed) could not be refreshed.
