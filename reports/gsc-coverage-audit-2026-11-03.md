# Search Console coverage audit — 3 November 2026

## Executive summary

The supplied export contains 28 example URLs. On 3 November live GET requests found all 28 returned a single 308 redirect to an HTTP 200 destination, each with one self-referencing canonical and `index,follow`. None of the original URLs appeared in the live sitemap. The inventory records each observed chain, destination and classification. Fifteen straightforward aliases are classified EXPECTED; 13 mappings to broader hubs, different suburbs or services need an intent review. No confirmed defect was repaired and no redirect was removed. Search Console counts from separate observations are not a current unified snapshot.

## Findings and remaining verification

The old `/adelaide-moving-guides/how-much-do-removalists-cost-adelaide/` (not one of the 28 exported examples) returned 301 directly to `/adelaide-moving-guides/removalists-cost-adelaide/`, which returned 200, a self canonical and `index,follow`. `/removalists-toorak-gardens/` returned 200, self canonical and `index,follow`; this does not establish Google's selected canonical. The live robots file permits all crawlers and lists the main and AI sitemaps.

The mapping of Kings Park to the northern hub and other broader or neighbouring location mappings deserve particular review against service geography and the former page intent. The two guide URLs redirected to the guide hub also merit content relevance review. HTTP health alone cannot establish that these are the best destinations. Historical redirect error, noindex exclusions and Google-selected canonical cases cannot be identified or resolved from this export alone. There is no evidence here to classify any as stale GSC data.

Live sitemap index and five children returned XML; page sitemap children contain 5, 15, 48 and 11 URLs respectively; the image sitemap contains 79 page entries. The crawler checked links from successfully fetched sitemap pages but did not record failures per page, so absence of links is provisional. No exhaustive orphan, title, structured data, heading or Core Web Vitals audit was completed. Quote submission, analytics event delivery and desktop accessibility remain unverified. No live lead was submitted.

## Environment and changes

The checkout runs on WSL2's read-write Windows mount. The former read-only Git restriction is no longer present; branch `fix/gsc-coverage-2026-11-03` was created from `fix/gsc-seo-pass`, preserving the existing six commits and untracked files. Windows Node v22.23.1 and the existing Windows native dependencies successfully built the project; no dependency reinstall or lockfile changes were needed. The original Linux Node 20 build failed on the missing Linux Lightning CSS binding. Only this report and the inventory were authored for this audit; no production source repair was made.

## Validation

- Windows `npm run build`: passed.
- Windows `npx tsc --noEmit`: passed.
- Windows `npm run seo:validate`: passed, 80 pages validated, 79 page sitemap entries, zero bad pages.
- Windows `npm test`: failed in `tests/homepage-editorial-redesign.test.mjs` because the homepage H1 does not match the test's expected exact markup; the runner stopped there. This predates audit source changes.
- Focused SEO regressions: 68 passed, 4 failed out of 72. Failures concern homepage H1 expectations and office page title expectations.
- Mobile Playwright: interrupted after failures; overflow assertions failed on multiple routes, including the homepage at 390px. Complete visual QA remains open.
- Live HTTP audit: all 28 chains checked, 28 final 200s and self canonicals. Internal-link results are limited as described above.

## Risks and next steps

Review the 13 uncertain destination mappings against original content and confirmed operating geography, then make and test any justified source-level correction. Investigate the failing homepage test and finish the full suite, desktop/mobile visual and accessibility checks, quote flow and tracking checks. Verify deployed revision and live routes separately if a release is later approved. Do not request indexing for redirect URLs. After a confirmed repair is deployed, use Search Console's validation workflow as appropriate and allow Google to recrawl before expecting its reports to change. No deployment was performed or authorized.

## Follow-up review — local changes

Kings Park's north-hub mapping is geographically incorrect. The [Electoral Commission SA](https://www.ecsa.sa.gov.au/electoral-districts/electoral-district-profiles/unley) identifies Kings Park in Unley, immediately south of Adelaide. The existing Unley Park page is a closer local destination. `vercel.json` and `site-src/data/zq-redirects-verified.json` now point to that canonical route; the live site remains unchanged until deployment. A local regression asserts the permanent rule, single hop, and destination canonical and robots. The old live destination and chain remain in the CSV as before-change evidence.

The other 12 mappings were reviewed and preserved pending stronger evidence: Croydon and small removals use the general Adelaide hub; Klemzig and Glandore use their respective regional hubs; Seaton, Newton, and Clarence Park use nearby locality pages; apartment CBD uses the apartment service; heavy furniture and packing tips use their corresponding service pages; stairs and moving duration lead to the guide index. These remain broader or different-location substitutes, and the historical content and available pages do not establish that a different existing destination would better answer every original query. In particular, the previous decision matrix records that a duration guide needs owner-confirmed durations before restoration. Their intent remains a risk rather than a verified repair. No new pages or speculative factual claims were added.

The outdated exact homepage H1 and office title assertions were updated to recognize current source wording and business-move metadata while retaining the surrounding conversion and SEO assertions. Subsequent verification results are recorded in the final handoff.

## Follow-up verification on stable output

- Windows Node 22 production build and TypeScript check passed; SEO validation passed with 79 canonical page sitemap entries and zero bad pages.
- The first full Node run stopped on an outdated Unley Park title assertion. The test now checks its current location and homes-and-townhouses title; the focused file passed 6/6. The subsequent complete `npm test` run passed all 52 test files.
- Mobile visual suite on stable build: 62 passed, 28 project-specific skips. It tests 320, 375, 390, 768, 1366 and 1920px; separate 1024px checks passed on home, contact, Adelaide, house removals and guides for HTTP status, one H1 and document overflow. Screenshots were captured; the 1024px homepage and 390px homepage were inspected. No mobile CSS change was made. The earlier failed run overlapped a rebuild and is not reliable visual evidence.
- `conversion-tracking.spec.ts`: 50 passed at 390px and 1366px with network requests mocked. This includes accepted quote handling, invalid and rejected submissions, thank-you navigation, consent, one accepted submission and one `zq_quote_submitted` event. Live GA4/GTM delivery and real leads were not tested.
- The Playwright visual test writes screenshots to `test-results/screenshots` using fixed names even when its results directory is overridden; matching existing screenshot files may have been replaced.

The final full `npm test` rerun passed its first 44 test files and then stopped on `seo-v7.test.mjs` because it expected the former phrase “quote preparation checklist”. The visible office section is now titled “Office removalists quote checklist”; its assertion was updated while retaining the other office planning, link and unsupported-claim checks. The focused `seo-v7.test.mjs` rerun passed all 10 tests. The remaining seven files were run separately; their final result is reported in the handoff. At that point the full `npm test` command had not yet passed in a single run after the assertion change.

The remaining files exposed another stale homepage heading expectation in `top-page-targeting.test.mjs`; it now checks the current Adelaide removalist heading, retaining pricing and conversion checks. The previously unrun files passed when run in sequence after that correction, and the corrected office checklist test passed separately. Thus all test files have passed across the full run and targeted follow-up runs, but the earlier full command itself stopped before the final two test-only corrections. A fresh full-command rerun subsequently passed all 52 test files.

The complete final `npm test` command exited successfully after all 52 test files. `git diff --check` passed. The production redirect remains unchanged until an approved deployment and subsequent live verification.

Post-test `npm run seo:validate` passed: 79 canonical page URLs, 80 pages checked, zero bad pages and one intentional noindex exclusion.
