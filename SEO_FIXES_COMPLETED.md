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
| `npm test` | Passed, including the quote API smoke test and every `tests/*.test.mjs` file |
| Playwright `tests/conversion-tracking.spec.ts` at 390px and 1366px | 32 passed |

`setQuoteFormFeedback` again plays the existing fade-in entrance on a success state and clears it for an error. Reduced motion still skips the animation through `playEntrance`. Web3Forms still posts JSON directly, and a response is treated as accepted only when HTTP succeeds and `success` is boolean `true`. An explicit rejection can show the provider message. A 200 response without that boolean keeps the confirmation-failure message and does not redirect or emit `zq_quote_submitted`.

`tests/suburb-distinct-insights.test.mjs` decodes `&amp;` last. GitHub Advanced Security flagged the previous order as double-unescaping because `&amp;lt;` would become `<`. Decoding ampersands last leaves that value as the literal `&lt;`.

`tests/business-email-pricing.test.mjs` expected the old payload mapper `crew_package: getFirstNonEmptyPayloadValue(...)`. Public forms now post every field, including `crew_package`, to Web3Forms. The test matches that current path and still checks that the field is not deleted. The server quote handler still maps `crew_package`.

A duplicate Playwright title in `tests/conversion-tracking.spec.ts` blocked collection. The later copy of the consent keyboard and axe test was removed. The earlier test remains.

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

Branch `fix/seo-repair-2026-11-05` is pushed. Pull request: https://github.com/abubakerasif202/zqremovels/pull/91

Vercel preview deployment `dpl_Hq4MU4LEHexbBZM9ckS4JZXFN73Y` is READY at `https://zq-luykkrmia-abubakerasif202s-projects.vercel.app`. Requests for the preview returned the Vercel login page, so the preview HTML was not read from here.

Production at `https://zqremovalsadelaide.com.au` still serves the previous revision until the pull request is merged.
