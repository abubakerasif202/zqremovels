# SEO remaining actions — 5 November 2026

These items need an account, a measurement window, or a business fact that is not in the repository. They were not treated as code defects.

## Release

1. Review and merge `fix/seo-repair-2026-11-05`.
2. Confirm the Vercel production deployment finished.
3. Re-check these live URLs after deploy:
   - `/removalists-glenelg/` contains "City of Holdfast Bay" and does not contain "should be treated as an access variable".
   - `/services/piano-movers-adelaide/` description mentions upright, grand, and digital pianos.
   - `/sitemap.xml` still lists 79 indexable page URLs on `https://zqremovalsadelaide.com.au`.
4. In Search Console, inspect a sample of updated suburb URLs after Google recrawls them. Do not request indexing for redirect aliases.

## Search Console

The API was not queried in this session. Use the existing `scripts/gsc-live-audit.mjs` flow when a current token is available.

Watch, without treating an old export as a live error:

- Sitemap index status. A previous "General HTTP error" was traced to a transient 308 and later cleared on resubmit. Confirm the five child sitemaps stay on Success.
- `/adelaide-moving-guides/removalists-cost-adelaide/` and `/removalists-adelaide-prices/` for the query "removalists adelaide prices". Keep the prices page on published crew rates and the guide on what changes the time.
- Piano queries. The snippet now matches the grand-piano content. Average position in the October export was weak. That is a monitoring item, not a promise of movement.
- Office queries. `/office-removals-adelaide/` already owns "office removalists adelaide". Historical position was strong and clicks were low. Check the snippet after the next export before changing the title again.

## Content that still needs the business

- Suburb pages without a council and landmark record still share a shorter logistics template. Add a council and two or three real local references to `site-src/data/zq-suburbs.mjs` only when someone can confirm them.
- A few stored landmarks should be confirmed before they are expanded. Examples already in the data include the old Football Park precinct name at West Lakes. This change did not add landmarks.
- Customer reviews, completed-job examples, and insurance wording stay unpublished until the business supplies them. Do not add rating schema.
- Same-day availability must stay "subject to crew schedule". Do not turn it into a guarantee.

## External accounts

- Google Business Profile: confirm the name, phone `0433 819 989`, service area, and categories match the site. The site already links the profile from business data. Review requests belong in the GBP account.
- Bing Webmaster Tools: verify the apex property and submit `https://zqremovalsadelaide.com.au/sitemap.xml` if that is still outstanding.
- Field Core Web Vitals: read the Search Console experience report or a CrUX export. Local tests already cover hero preload, image dimensions on the homepage, and the decision not to preload Fraunces. A new Lighthouse run was not completed in this session.
- Analytics: confirm production still has `VITE_GA_MEASUREMENT_ID` set at build time. Quote success remains `zq_quote_submitted` with `form_name=quote_form`, `submission_status=accepted`, and a UUIDv4 `submission_id`, only after Web3Forms returns success and consent allows it. A button click is not a lead.

## Intentionally unchanged

- Redirect, `noindex`, and canonical consolidation for duplicate service URLs, legacy `.html` URLs, and the old `zqremovals.au` host.
- The 79-URL sitemap boundary. Thin or non-suburb aliases stay redirected.
- FAQ questions that name the suburb and the furniture service. They are repetitive in shape and specific in the suburb name. Replacing them would need a new question set per suburb, written from confirmed local jobs.
