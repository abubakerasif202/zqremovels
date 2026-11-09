# Search Console review implementation — 9 November 2026

## Scope and baseline

Isolated branch `seo/gsc-review-20261109`, based on `1a2ab02`. Original checkout and unrelated manifest/task/artifact work preserved. No production deployment, merge, DNS, ownership-token removal, GSC submission or real lead submission is authorized by this delivery.

The supplied review is the Google-state baseline, not a fresh URL Inspection API result. Its 11 October–7 November Web report contains 36 clicks, 7,520 impressions, displayed 0.5% CTR and average position 29. Low office/piano aggregate CTR is not diagnosed as a snippet-only problem: rankings and query mix remain important.

Before editing: locked install, build and 72 focused SEO tests passed under Node 22.23.1. New focused tests observed RED for six requested improvements; final checks are recorded below.

## Confirmed defects versus improvements

No actionable HTTP, canonical, robots or sitemap defect was reproduced. Redirect/configuration rules, canonical paths, sitemap structure, legal noindex, quote integration, consent and tracking were not changed.

- **Prices:** the homepage already publishes small truck $65/30 minutes ($130/hour), crew confirmed in quote; large truck 2 movers $75/30 minutes ($150/hour), 3 movers $89/30 minutes ($178/hour). The prices page now distinguishes these packages. Existing arithmetic examples remain explicitly hypothetical large-truck examples, not small-truck or piano/office quotes. Call-out applicability and part-increment treatment remain quote-confirmed; no new fee policy was invented.
- **Pennington:** retained existing sourced council/Census content; added address-level loading restrictions, carry-path photos, stairs/landings/turns, property types, inventory/date and shared-access questions. This improves usefulness, not a guarantee of indexing.
- **Port Adelaide:** retained its existing direct Pennington card and added a short two-address planning brief directing readers to that contextual planning path. Existing hub/service discovery links remain in place; no extra repetitive link pool was added.
- **Office:** clarified customer/IT shutdown, backup, cable and reconnection responsibilities versus removalist transport/placement; added floor-plan, restart-order and sign-off details. Existing access/restart-focused title and description retained rather than rewritten arbitrarily.
- **Piano:** labelled published rates as large-truck crew packages and required confirmation of truck/crew/handling after assessment. Existing instrument/access acceptance limits and own-technician advice retained. Existing assessment-led title/description retained.
- **Guide hub:** added direct timing/stair planning advice for visitors arriving from the retired timing/stairs guides. It links to existing furniture and cost resources without unsupported duration estimates. Packing, furniture and northern-hub consolidation destinations already provide useful next steps and were preserved.
- **Same-day:** removed the unsupported claim that access/inventory are reviewed "instantly"; retained schedule-dependent availability and no guarantee.
- **Hyde Park/Unley Park:** already contain specific access guidance, reciprocal routes and service/quote paths; reviewed and preserved instead of rewriting for word count.

Metadata before/after: `reports/seo/gsc-review-20261109-metadata.json`. Authoritative source: `site-src/data/seo-v4.mjs`, `site-src/data/zq-services.mjs`, and `site-src/content/office-removals-adelaide/index.html`. Generated `site-dist/` is ignored and regenerated, never hand-patched.

## Live HTTP evidence

`reports/seo/gsc-review-20261109-http.json` records actual public HTTP GETs, headers and every Location hop, 9 November 2026 23:48 Sydney (12:48 UTC). It distinguishes sitemap page `<loc>` from image-namespace locations.

- Six sitemap documents (index plus five children): 158 page-location entries, 79 unique page URLs; AI sitemap has the same 79. Image sitemap overlap is valid and preserved.
- All 79 pages: direct HTTP 200, matching self-canonical, index/follow, one H1, robots allowed, no detected X-Robots-Tag noindex.
- All 38 supplied redirect examples: one permanent hop to expected HTTP 200 destination. No loops, request errors or static anchors to the checked redirect-source set were found.
- Three saved redirect errors currently healthy: Klemzig 308 to northern hub; HTTP apex 308 to HTTPS apex; old how-much cost guide 301 to current cost guide, all then 200.
- Legacy furniture and apartment routes remain permanent redirects to their canonical 200 destinations.
- HTTPS www homepage has one normalization hop; HTTP www uses two (HTTP to HTTPS www, then apex). This does not reproduce a loop or justify speculative configuration edits.
- Both legal pages remain 200, noindex/follow and absent from sitemap.

## Google and owner follow-up

- Redirect-error validation was **started** on 9 November: three pending; not passed. Allow Google to process it.
- Pennington indexing request was accepted on 9 November. Do not repeat it without fresh evidence; indexing remains Google's decision.
- Supplied indexed examples versus sitemap: both 79 entries, 78 overlap; sitemap-only Pennington, indexed-only retired `/apartment-removals-adelaide/`. The latter redirects to `/apartment-removalists-adelaide/`. These saved Google examples are not a live canonical index database.
- Historic 80 versus 79 remains unreconciled without the original full dated export.
- Domain-provider ownership token associated with `admin@zqremovals.au`: owner must establish account/service dependencies before any removal. No token value collected or changed.
- CWV field usage remains insufficient; no field pass or ranking gain claimed. Deployment logs were not accessed; historical Google fetch-failure root cause remains unproven.
- Engram detected this project but rejected scoped reads/writes as `unknown_project`; the local feature document remains authoritative and the memory mirror is pending.

## Verification

- PASS: build under Node 22.23.1; expanded focused SEO 91/91; full npm test 525/525 (zero skipped); SEO validation 79 unique sitemap pages; TypeScript; changed-module/test syntax; mocked conversion tracking 16/16; diff whitespace check.
- FAIL (pre-existing, unchanged): remediation audit editorial-language regex matches "guide support" inside "This guide supports comparison research..." on the how-to-choose guide. Baseline/candidate content hashes match; proof in the checks report. No out-of-scope content edit applied.
- FAIL (pre-existing dependency audit): transitive follow-redirects high and qs moderate advisories; no upgrades applied.
- Differential: seven authored route changes, no generated output removals or canonical/robots changes. Raw hashes differ for all 122 HTML files; their precise cause remains unproven, so no claim of byte-identical unaffected output. Semantic generation/static-source comparison isolates the seven intended routes.
- PASS: responsive UI 28/28 (seven routes at 320/375/768/1366px), keyboard focus and quote CTA checks, reduced-motion checks and no JavaScript page errors. Evidence: reports/seo/gsc-review-20261109-ui.json and artifacts/seo/gsc-review-20261109/ (28 screenshots). Existing fixed privacy/chat controls can cover lower-right scrolling body/table edges; tested primary CTAs remain clear. Physical-device and full WCAG audits NOT RUN.
- Lighthouse lab checks and production deployment are NOT RUN. No field-performance, indexing or ranking improvement is claimed.

Detailed check evidence: reports/seo/gsc-review-20261109-checks.json.

Risk: none. Changes are route-specific data/copy and regression assertions, not shared parsing/rendering behavior, credentials, delivery configuration, stored data or forms.

Implementation/evidence commit: a995a183457ce3fdfb251df8384fcafe4b3e912d. Native committed-slice assessment: medium, review_due=false (under_budget); no native approval claimed. Generated JSON/screenshot evidence is separate from291 authored changed lines.
