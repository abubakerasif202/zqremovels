# Google Search Console Instructions Plan (ZQ Removals)

This plan is tailored to this repository and live site setup (`https://zqremovals.au/`), including the existing sitemap path in `robots.txt`.

## 1) Pre-flight checklist

- Confirm you have:
  - Google account access for Search Console
  - Admin access to DNS for `zqremovals.au`
  - Access to the production deployment project (Vercel)
- Confirm production URLs:
  - Canonical homepage: `https://zqremovals.au/`
  - Sitemap: `https://zqremovals.au/sitemap.xml`

## 2) Add property in Google Search Console

Use **Domain property** (recommended) for full coverage:

1. Open Search Console → **Add property**.
2. Select **Domain**.
3. Enter: `zqremovals.au`.
4. Copy the DNS TXT verification record Google provides.

## 3) Verify ownership with DNS (recommended)

1. Open your DNS provider for `zqremovals.au`.
2. Add a TXT record with:
   - Host/Name: `@` (or blank, depending on provider)
   - Value: `google-site-verification=...` (exact token from Google)
3. Save DNS changes.
4. Return to Search Console and click **Verify**.
5. If verification fails, wait 5–30 minutes and retry.

## 4) Submit sitemap

1. In Search Console, open **Indexing → Sitemaps**.
2. Submit: `https://zqremovals.au/sitemap.xml`
3. Confirm status is **Success**.
4. Recheck after each production deployment batch.

## 5) Initial indexing actions (first week)

Use **URL Inspection** and request indexing for key pages:

- `/`
- `/contact-us/`
- `/removalists-adelaide/`
- `/interstate-removals-adelaide/`
- `/office-removals-adelaide/`
- `/furniture-removalists-adelaide/`
- `/packing-services-adelaide/`
- `/adelaide-to-melbourne-removals/`
- `/adelaide-to-sydney-removals/`

Then spot-check 5–10 suburb/guide URLs.

## 6) Configure monitoring workflow

Track these Search Console reports weekly:

- **Page indexing**: errors, excluded URLs, unexpected noindex/canonical outcomes
- **Sitemaps**: fetch/parse status and discovered URL trends
- **Performance**: clicks, impressions, CTR, average position by query and page
- **Core Web Vitals**: mobile and desktop URL groups
- **Enhancements** (if available): structured data warnings/errors

## 7) Repository + deployment operating routine

After major SEO/content changes in this repo:

1. Merge and deploy.
2. Confirm `https://zqremovals.au/sitemap.xml` is live.
3. Re-submit sitemap in Search Console.
4. Inspect and request indexing for changed high-value pages.
5. Log outcomes (indexed/not indexed, warnings, fixes required).

## 8) Troubleshooting playbook

If pages are not indexing:

1. Check URL Inspection for:
   - Crawl allowed?
   - Indexing allowed?
   - Canonical selected by Google vs user-declared canonical
2. Confirm page is in sitemap.
3. Confirm final URL returns `200` and is not redirecting unexpectedly.
4. Confirm no accidental `noindex` on indexable pages.
5. Improve internal links from strong pages (homepage/service hubs) to affected pages.
6. Request indexing again after fixes.

## 9) 30-day rollout plan

### Days 1–3

- Property setup + DNS verification
- Sitemap submission
- Indexing requests for top commercial URLs

### Days 4–14

- Weekly index coverage review
- Fix any technical/indexing blockers found in Inspection/Coverage
- Re-request indexing for fixed pages

### Days 15–30

- Performance review by page/query
- Prioritize pages with high impressions + low CTR for title/meta tuning
- Prioritize pages with ranking potential (positions 8–20) for internal linking and content refinement

## 10) Success criteria

- Domain property verified
- Sitemap accepted successfully
- Core commercial pages indexed
- No critical indexing or enhancement errors
- Early trend of impressions/clicks growing on service and suburb pages
