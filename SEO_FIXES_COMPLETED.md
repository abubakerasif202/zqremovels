# SEO fixes completed — 5 November 2026

## Fixes

### Suburb access notes now use the existing local record

File: `site-src/data/seo-v4.mjs`

`buildSuburbLocalInsightParagraphs()` replaces the shared parking paragraphs. Where `zqSuburbGeoData` has a council and landmarks, the section names that council, lists up to three existing landmarks as location references, and keeps the suburb's logistics label. Suburbs without that record use the logistics label and the nearby suburb names already generated for the page.

The opening local-intro sentence also leads with the council and two landmarks when that record exists.

The Adelaide CBD page still says "service lift" when the logistics label mentions lifts, towers, or apartments, so the apartment access note stays on that page.

No reviews, job counts, travel times, parking laws, or guarantees were added. Landmark names are the ones already stored in `site-src/data/zq-suburbs.mjs`.

### Hyperlocal links point at surviving pages

File: `site-src/data/seo-v4.mjs`

The hyperlocal link list is now:

- `/removalists-adelaide/`
- `/house-removals-adelaide/`
- `/furniture-removalists-adelaide/`
- `/packing-services-adelaide/`
- `/removalists-adelaide-prices/`
- `/adelaide-moving-guides/prepare-house-move-adelaide/`
- `/contact-us/#quote-form`

Each href is a final indexable URL. The prices page is linked once, with the label "Published crew rates".

### Piano description matches the page

File: `site-src/data/zq-services.mjs`

Description is now: "Piano movers Adelaide for upright, grand and digital pianos. Send dimensions and access photos so handling can be confirmed before you book."

The title remains `Piano Movers Adelaide | Piano Removalists | ZQ Removals`.

## Tests updated

- `tests/suburb-distinct-insights.test.mjs` asserts unique local-insight text, the absence of the old shared parking sentence, council and landmark presence, and distinct hyperlocal destinations.
- `tests/search-console-fixes.test.mjs` and `tests/migration-recovery.test.mjs` expect the piano description that includes grand pianos.
- `tests/business-email-pricing.test.mjs` expects the current Web3Forms field submission, which keeps `crew_package` in the posted form data.

## Verification

| Check | Result |
| --- | --- |
| `npm run build` | Passed |
| `npm run seo:validate` | Passed. 80 pages checked, 79 sitemap page URLs, 0 bad pages, 1 intentional noindex exclusion |
| `node --test tests/suburb-distinct-insights.test.mjs` | Passed, 2 tests |
| `node --test tests/seo-conversion-pass.test.mjs` | Passed after the CBD service-lift sentence was restored |
| `node --test tests/search-console-fixes.test.mjs` | Passed, 46 tests |
| `node --test tests/migration-recovery.test.mjs` | Passed in the focused run |
| `node --test tests/semrush-cannibalization-fixes.test.mjs` | Passed in the focused run |
| `node --test tests/zq-local-seo-content-system.test.mjs` | Passed in the focused run |
| `node --test tests/eeat-audit.test.mjs` | Passed in the focused run |
| `node --test tests/business-email-pricing.test.mjs` | Passed after the assertion below |
| `git diff --check` | Passed |
| `npm test` | Did not finish. Quote API smoke passed. The runner then stopped in `tests/entrance-animations.test.mjs` because `setQuoteFormFeedback` in the already committed `site.js` does not add `animate__fadeIn`. That file was not part of this SEO edit. |

`tests/business-email-pricing.test.mjs` expected the old payload mapper `crew_package: getFirstNonEmptyPayloadValue(...)`. Public forms now post every field, including `crew_package`, to Web3Forms. The test matches that current path and still checks that the field is not deleted. The server quote handler still maps `crew_package`.

A parallel run of several test files that each rebuild the site hit `Timed out waiting for the site build lock` in `tests/search-console-fixes.test.mjs`. The same file passed when run alone after the build lock was free.

Browser screenshots were not captured. The checks above read the generated HTML for titles, canonicals, H1s, internal links, schema, and the new suburb copy.

## Counts

| Item | Count |
| --- | --- |
| Generated suburb pages whose shared parking paragraph was removed | 40 |
| Hyperlocal blocks given distinct canonical links | 5 (Glenelg, Salisbury, Adelaide CBD, Marion, Norwood) |
| Meta descriptions corrected | 1 (piano movers) |
| Canonical host defects repaired in this change | 0 (already consistent) |
| Broken internal links repaired in validator output | 0 reported after the build |
| Structured data types added or removed | 0 |
| Performance code changes | 0 |
| New indexable pages | 0 |
| Pages removed | 0 |

## Deployment

Not deployed. The work is on branch `fix/seo-repair-2026-11-05`. Production still serves the previous revision until this branch is merged and Vercel finishes a production deployment.
