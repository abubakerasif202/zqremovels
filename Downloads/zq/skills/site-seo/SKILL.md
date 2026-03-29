---
name: site-seo
description: Audit and improve SEO for brochure sites, landing pages, and static business websites. Use when Codex needs to review or update titles, meta descriptions, canonicals, robots.txt, sitemap.xml, Open Graph or Twitter tags, JSON-LD, internal linking, or service and location landing pages, especially on plain HTML or Netlify-style sites.
---

# Site SEO

## Start With The Audit

Map the site before editing anything:

1. Find the public routes and route sources such as `index.html`, nested `*/index.html`, and standalone policy pages.
2. Check crawl and routing controls such as `robots.txt`, `sitemap.xml`, redirects, and hosting config like `netlify.toml`.
3. Run `python scripts/seo_audit.py <site-root>` from this skill directory, or call the script by absolute path if you are working elsewhere.

Treat the audit as the baseline. Do not rewrite metadata blindly page by page until the crawl, sitemap, canonical, and duplication picture is clear.

## Fix In This Order

Prioritize the highest-impact issues first:

1. Indexability and discoverability:
   missing or broken `robots.txt`, invalid `sitemap.xml`, `noindex` pages inside the sitemap, duplicate canonicals, or conflicting hosts.
2. Primary page signals:
   missing or weak `<title>`, meta description, canonical, `h1`, `lang`, Open Graph, Twitter, or JSON-LD.
3. Route and canonical consistency:
   keep one canonical URL per page, use absolute canonicals, and sync redirects with sitemap entries.
4. Local landing page quality:
   make each service or suburb page materially unique, not a spin of another page with only the location name swapped.
5. Internal link support:
   connect home, service, and suburb pages with descriptive anchors so authority flows through the site.

## Write Metadata Deliberately

Keep one primary search intent per page. For local-service sites, that is usually `service + location`.

Use these working targets, not rigid rules:

- Title: roughly 30-65 characters and front-load the primary phrase.
- Meta description: roughly 70-165 characters and state the value proposition plus location.
- H1: one clear page heading that matches the primary intent without duplicating the title verbatim.
- Canonical: absolute URL matching the preferred live route.
- Open Graph and Twitter: mirror the page intent and point to a valid image.

Avoid keyword stuffing. If a keyword feels unnatural in the first paragraph, heading, or CTA, rewrite the sentence instead of forcing the phrase.

## Update Structured Data Conservatively

Prefer accurate schema over more schema.

- Use `LocalBusiness` or a specific subtype when the site represents a real business.
- Use `Service` on service or location landing pages when the service is genuinely offered there.
- Use `WebPage` when the page itself needs explicit identity.
- Only use `FAQPage` for real visible FAQs.
- Keep NAP, service area, URL, and phone consistent with visible content.

If JSON-LD is invalid or stale, fix or remove it before adding more.

## Use The References

Read the relevant reference file only when needed:

- `references/static-site-seo-checklist.md`
  Use for plain HTML or Netlify-style sites, crawl controls, canonicals, sitemap work, and technical on-page checks.
- `references/local-service-landing-pages.md`
  Use when rewriting home, service, city, suburb, or corridor pages for a local-service business.

## Deliver A Useful Result

When you use this skill, finish with:

1. A short problem summary.
2. The highest-likelihood root causes or SEO weaknesses.
3. The exact files changed or the exact blockers found.
4. Concrete validation commands, including rerunning `scripts/seo_audit.py`.
5. Any remaining risks such as duplicated search intent, thin pages, or schema ambiguity.
