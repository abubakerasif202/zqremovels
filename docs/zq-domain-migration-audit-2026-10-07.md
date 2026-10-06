# ZQ production domain migration audit

## Scope and evidence

Repository: `abubakerasif202/zqremovels`, production branch `main`.
Canonical origin: `https://zqremovalsadelaide.com.au`.

The initial production crawl is preserved in `zq-migration-live-audit.json`.
It covers 511 requests: all 80 sitemap pages, 140 historical URLs available in
the local Search Console page export, priority paths, concrete aliases and host
variants. This export is an older snapshot, not the complete 313-page historical
inventory supplied in the brief. Rankings and the owner's traffic figures were
not independently refreshed. The source inventory and priority mappings are in
`zq-migration-route-inventory.json`.

## Findings and repairs

- Historical `/moving-house-services-adelaide/` redirected to the new host but
  returned 404. Added permanent mappings for the slash, no-slash and `index.html`
  forms to `/house-removals-adelaide/`, the existing house-moving equivalent.
- `/cheap-removalist-adelaide` had an explicit redirect, but platform slash
  normalization reached an unmapped singular path and returned 404. Added slash
  and `index.html` aliases to `/cheap-removalists-adelaide/`. This preserves the
  established budget-moving intent rather than redirecting to the homepage.
- Sitemap dates came from filesystem modification times, with today's date as
  fallback. Deployment checkouts therefore suggested content changed when it
  had not. Dates now use validated explicit dates or committed source history;
  unavailable history is omitted. Shared generated registries provide
  conservative dates, not independent editorial timestamps for every page.
- Robots previously advertised the valid `sitemap-index.xml` alias. It now
  advertises the requested `sitemap.xml` entry point; both index URLs remain valid.
- Piano metadata was truncated mid-sentence. A shorter factual description now
  supplies consistent description, Open Graph and Twitter text.

## Already-correct behavior preserved

All 80 sitemap pages returned 200 and passed live self-canonical, robots, H1 and
OG URL checks. All 18 priority old URLs returned permanent 308 redirects directly
to their exact new canonical page, followed by 200. A 308 is a permanent redirect.
No priority route was missing, blocked or redirected to the homepage.

The piano and Sydney/Melbourne/Brisbane content remains substantial and relevant.
Historical piano promises about specialist equipment were not restored because
their accuracy could not be established. Existing office and Hyde Park query
targeting changes were preserved. Existing service/cost/furniture consolidations
already select primary landing pages; no new speculative consolidation or local
page canonicalization was justified.

Generated pages contain no unintended old-domain web links. Remaining old-domain
references are the approved business email, intentional redirect host conditions,
tests, migration documentation and historical Search Console exports. Business
facts, pricing, contact details, reviews and visual design were preserved.

## Remaining platform behavior and Search Console actions

The initial crawl recorded 50 multi-hop cases, primarily no-slash aliases and
`index.html` forms normalized by Vercel before configured redirects. HTTP legacy
and HTTP www requests also undergo HTTPS normalization before host migration.
These are permanent chains, not loops or temporary redirects. Do not remove the
site-wide trailing-slash policy or domain protection experimentally to save a hop.
Any replacement routing configuration needs isolated preview proof across the
complete route/asset/API inventory before production rollout.

Vercel domain API inspection found all four domains verified, with no domain-level
redirect overrides; apex served directly and deployment host rules migrated the
legacy/www hosts. No DNS or domain setting change was needed.

In Search Console, verify both properties, confirm the old property's Change of
Address points to the new domain, resubmit the new `sitemap.xml`, and inspect the
repaired house URL plus piano, office, prices, Hyde Park, Unley Park and interstate
pages. Compare Google's selected canonical and last crawl after deployment.
Obtain the complete old URL and backlink exports to reconcile historical paths
outside the available 140-URL snapshot. Retain the old domain and redirects.
Google's migration guidance explains that processing occurs per URL and permanent
redirects preserve link credit:
https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes

## Validation boundaries

`npm test` passed: 190 tests, zero failures, zero skipped tests, plus the quote
API smoke check. `tsc --noEmit` passed; no lint or typecheck npm script exists.
The final `npm run build` and `npm run seo:validate` passed (80 page URLs, zero bad
pages). Read-only production browser checks covered seven priority pages at
320, 375, 768, 1366 and 1920px: all 35 had one H1, the correct canonical, HTTP 200
and no horizontal overflow. Code and JavaScript reviews found no unresolved
blocking issues. No dependencies, lockfiles or runtime bundles were changed.

The initial crawl reports defects before this release; it is not evidence that
the repaired aliases were already live. Post-release verification must check the
deployed commit, repaired aliases, robots target and piano snippet separately.
The reproducible read-only crawler is `node scripts/audit-domain-migration.mjs`.
Its report records failures without treating the report-generation exit code as
a release pass. No customer form submission or production data mutation was used.
