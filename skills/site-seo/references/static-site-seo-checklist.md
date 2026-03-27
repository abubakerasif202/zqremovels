# Static Site SEO Checklist

Use this checklist for plain HTML, brochure, and Netlify-style sites.

## Crawl And Routing

- Confirm `robots.txt` exists and exposes the sitemap URL.
- Confirm `sitemap.xml` exists, parses, and only contains preferred canonical URLs.
- Check redirect rules in hosting config so `.html`, non-trailing-slash, or legacy paths resolve to one preferred route.
- Keep a single production host in canonicals, Open Graph URLs, and sitemap entries.

## Per-Page Checks

- One `<title>` per page with a distinct primary intent.
- One meta description per page with a concrete value proposition.
- One canonical link with an absolute URL.
- One visible `h1`.
- Valid `lang` on `<html>`.
- Open Graph minimum set: `og:type`, `og:url`, `og:title`, `og:description`, `og:image`.
- Twitter minimum set: `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`.
- JSON-LD present when it reflects real business or page entities.
- Images that matter to content have meaningful `alt` text.

## Common Failure Modes

- Multiple pages targeting the same keyword with only token substitutions.
- Titles or descriptions reused across suburb pages.
- Canonical URLs pointing to the wrong route variant.
- Pages present on disk but omitted from the sitemap.
- `noindex` present on pages intended to rank.
- Schema mentioning locations or offers not supported by visible page content.

## Practical Workflow

1. Run the audit script.
2. Fix crawl and canonical issues before copywriting changes.
3. Remove metadata duplication across the route cluster.
4. Re-check home page, core service pages, and location pages in that order.
5. Re-run the audit script and confirm the sitemap still matches preferred URLs.
