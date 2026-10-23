# ZQ Removals release checklist

Audit date: 23 October 2026.

## Change context

- Repository: `C:\Users\abuba\zqremovels`
- Branch: `fix/ads-conversion-recovery-2026-10-22`
- Base HEAD: `d181b6f` (`style(site): apply premium template and preserve integrations`)
- Base implementation commit: `27cdc49e56bc16c4fb93aee603c07b1ccb7b81fc`; this continuation adds the telemetry privacy fix and verified blocker evidence in a local follow-up commit.
- Deployment: not performed. Google Ads and GTM were not modified.
- Source export: `C:\Users\abuba\gsc-private\GSC_ALL_DATA\sc-domain_zqremovals.au.zip`; archived customer data was not copied into the repository.

## Validation status

| Check | Result | Evidence / limit |
| --- | --- | --- |
| Production build | PASS | `npm run build`; Astro built 122 pages. |
| SEO validation | PASS | `npm run seo:validate`; 108 route records, 0 bad pages. |
| Sitemap validation | PASS local | 79 indexable canonical URLs across four child page sitemaps; no invalid sitemap entries in local validation. |
| Redirect validation | BLOCKED live | Live checked 23 Oct: all 3 old-host URLs 308 to the same legacy path on the new host, then return 404. Intended destinations return 200 with self-canonicals. Local permanent mappings/build/sitemaps are correct but undeployed. |
| Canonical validation | PASS local | Generator validator passed; apex canonical policy and sitemap-host checks hold in local output. |
| Structured data | PASS local tests / NOT RUN live | Repository regression checks cover schema and host integrity; no live rich-results account validation was performed. |
| Quote API smoke | PASS | Included in `npm test`; no live provider call. |
| Node regression suite | PASS | `npm test`, including quote API smoke and all repository Node test files; no failures reported. |
| TypeScript check | PASS | `npx tsc --noEmit` completed with exit code 0. |
| Conversion contract | PASS local mocks | Node tests cover accepted/rejected/pending and duplicate receipt behavior. Staging receipt and Ads event remain BLOCKED: no branch Preview deployment, Preview Redis variables absent, provider destination unverified. |
| Server telemetry privacy | PASS local test | Accepted-quote telemetry is allowlisted to timestamp, business name and static event; PII and attribution are excluded. |
| Mobile quote form | PASS simulated | Current Playwright rerun: 177 passed, 28 project-filtered skips across 375px/390px mobile, 768px tablet and 1366px/1920px desktop Chromium; WebKit 26.4: 5 selected mobile cases passed at 390px. No real provider requests. |
| Accessibility | PASS scoped automated / NOT RUN physical | Contact-page checks include WCAG AA contrast for CTA, label and input text plus focus/readability and overflow at five Chromium viewports, and WebKit 390px. Physical keyboard/assistive-technology checks NOT RUN. |
| Lighthouse | PASS lab comparison; target unmet | Recorded median score 79→81 and simulated LCP 4663→4518 ms; local LCP remains above 2.5 s. Field INP/CrUX NOT RUN. |
| Lint | NOT RUN | No lint script is defined in `package.json`. |
| GSC account updates | NOT RUN | No sitemap submission, Change of Address, or URL inspection was performed. |
| Live deployment | NOT RUN | No push/deploy authorization; Production remains on earlier code. |

## Files and workstreams

The preceding implementation commit changes `site.js`, `analytics.mjs`, `api/quote.js`, `lib/server/quote-receipts.js`, `vercel.json`, build post-processing, SEO/conversion tests and recovery reports. The follow-up commit removes PII from accepted-quote telemetry and records the final blocker evidence. Preserve the untracked `artifacts/` directory; it was not included in either commit.

## Manual actions before production

- Add isolated Preview Redis endpoint/token and verify required ACL operations.
- Confirm Preview provider destination is controlled and approved.
- Verify the real CMP consent callback and persisted user choices.
- Run the controlled staging accepted/replay conversion test.
- Publish/deploy only through the approved release process; then rerun live migration checks and verify the three guide URLs return a permanent redirect to a 200 canonical target.
- In Search Console, resubmit the apex sitemap, inspect priority migrated URLs and compare both properties after recrawl.
- In GTM Preview and Google Ads diagnostics, confirm the existing quote action records the accepted UUID once. Do not publish a new GTM version as part of this source change.
- Complete physical iOS Safari and Android Chrome keyboard/focus checks. Review field Core Web Vitals after sufficient live data.

## Rollback

Before deployment, record the exact approved deployment and commit to restore. Use Vercel's previous-deployment promotion/rollback only under the normal release authorization. If code needs reverting, use a reviewed revert commit. Preserve Redis receipt records during incident investigation; never clear pending/accepted receipts as a rollback shortcut. Restore a GTM version only if a GTM change was separately published.

## Release decision

**NOT READY — ISSUES REMAIN.** The local build and SEO checks pass, but production legacy paths still 404 after the host redirect; Preview receipt storage, provider destination and real consent management are unverified. No staging enquiry, Ads/GTM edit or deployment was made. Code is ready for a controlled Preview only after those Preview prerequisites exist; it is NOT ready for production deployment.

## Final continuation — 23 October 2026, HEAD `7cf1ef9`

- Exact checkout: branch `fix/ads-conversion-recovery-2026-10-22`, HEAD `7cf1ef97776583f23bf18b2730b8d548fa16c90b`. Working tree was clean except the preserved, pre-existing untracked `artifacts/` directory before this continuation.
- Vercel project `zq` read-only environment names/scopes: Preview lacks `KV_REST_API_URL` and `KV_REST_API_TOKEN`; `WEB3FORMS_ACCESS_KEY` is scoped to Preview but its destination cannot be verified from Vercel metadata. No Preview deployment exists for this branch. No secret value was retrieved, a database was not created, and no enquiry or deployment was attempted.
- Consent remains denied by default before GTM. No approved CMP or actual preference, persistence, restoration or revocation UI exists in source. No account-side CMP or GTM read access was available. Do not grant optional analytics/Ads consent; no tracking verification beyond local event-contract tests is claimed.
- Added `scripts/verify-migrated-guides.mjs` and `seo:verify-migrated-guides` to test the three direct permanent aliases, target 200/canonical/indexability, guide sitemap presence, and optional direct old-host redirects. Preview and Production invocations are recorded in `02-DOMAIN-MIGRATION.md`. This script has not been run against a branch deployment.
- Performance evidence is unchanged: median simulated Lighthouse score 79, LCP 4,502 ms, TBT 168 ms and CLS 0. The H1 is the LCP element; hero image is already preloaded/high priority; font-display insight passes; measured unused home CSS is 49,548 bytes of 155,205. The local server does not provide Vercel Brotli delivery, and the metric's LCP breakdown reports only about 228 ms (35 ms TTFB + 192 ms render delay), so it does not isolate an actionable source-level delay. No speculative stylesheet/font change was made; target LCP remains unmet and must be remeasured against Preview/CDN.
- No Google Ads/GTM settings, Production variables, Production data or external configuration were changed. No push, merge or deployment was performed.

### Safe Preview runbook

1. Obtain/confirm an approved, non-billable Redis database dedicated to Preview. Confirm it differs from Production and supports atomic `GET`, `SET NX`, `SET XX` and `EVAL`.
2. Add Preview-only `KV_REST_API_URL` and `KV_REST_API_TOKEN` in Vercel. Do not copy Production values.
3. Verify the Preview-only `WEB3FORMS_ACCESS_KEY` delivers only to the approved test inbox.
4. Confirm an approved CMP integration and its true consent callbacks. Keep consent denied until then.
5. After separate deployment authorization, deploy the reviewed branch to Preview. Confirm Ready, then run `npm run seo:verify-migrated-guides -- --origin https://<preview-host>`.
6. Run the isolated synthetic quote matrix documented in `04-CONVERSION-VALIDATION.md`; retain only sanitized receipt/event counts and the provider inbox result. Stop on any ambiguous delivery or store outage; never resend under a new ID until reconciled.
7. Validate GTM Preview read-only and the existing Ads action after the approved consent state and accepted receipt are proven. Do not publish GTM or alter Ads.

### Production release and rollback gates

Production remains blocked until the real Preview accepted-delivery/replay matrix, provider test inbox, Redis isolation/ACL, approved consent behavior, GTM accepted-event/transaction mapping, and direct route checks pass. After separately authorized deployment, run `npm run seo:verify-migrated-guides -- --origin https://zqremovalsadelaide.com.au --legacy-origin https://zqremovals.au`, confirm critical route/API/canonical/sitemap behavior and one controlled authorized production smoke only if separately approved. Before releasing, record the currently approved Vercel deployment SHA and an export/version of the existing GTM container for reference. If rollback is authorized, promote the recorded previous Vercel deployment; preserve receipt data, do not clear Redis keys, and do not change GTM unless it was separately published.

Current decision: **CODE READY — STAGING BLOCKED.**

### Validation of this continuation

- `node --check scripts/verify-migrated-guides.mjs`: PASS.
- `npm run build`: PASS; Astro generated 122 pages; stylesheet outputs unchanged at 155,204/139,831/198,337 bytes.
- `npm run seo:validate`: PASS; 108 route records, 0 bad pages, 79 canonical page URLs, 28 redirect exclusions and one noindex exclusion.
- `npm test`: PASS (exit 0; quote API smoke and all sequential Node test files completed; no test failures, one pre-existing TODO as in the prior full-suite report).
- `npx tsc --noEmit`: PASS (exit 0).
- Mock-only self-test of `verify-migrated-guides.mjs`: PASS for three synthetic 308→canonical, target 200, self-canonical and sitemap cases. It queried no deployed host.
- Chromium 390px: 24/24 focused conversion and contact visual/accessibility cases PASS. WebKit 390px, single worker: 5/5 selected accepted-event/contact visual cases PASS. A broader 24-case parallel WebKit retry emitted all cases but hung before its runner summary; it was interrupted and is not counted as passing. Earlier committed five-case WebKit evidence also passed. All browser form requests were intercepted; no provider delivery occurred.
- Read-only Production GET recheck: each old-host guide URL returns 308 to the identical path on the canonical host, then 404. This remains an actual live defect until the authorized release is deployed and route/domain precedence is addressed.
- Lighthouse remains the existing three-run local simulation (median score 79, LCP 4,502 ms, TBT 168 ms, CLS 0). No performance code changed and no CDN-backed result is available.

The tracked changes in this continuation are limited to the release verifier, its npm command, and the reports listed above. The pre-existing `artifacts/` directory remains untracked and preserved. Generated `site-dist/` output was recreated only through the normal build and was not edited directly.

## Continuation verification — 23 October 2026

- Vercel project `zq` read-only metadata: receipt Redis variables target Production only; Preview has no Redis receipt variables. Preview provider-key presence does not establish a safe destination. There is no Preview deployment for the current branch.
- Old-host redirect checks: each of the three legacy paths returns 308 to the same path on the apex; that apex path returns 404 on the current Production deployment. Their mapped canonical targets return 200. Current local rules, canonical HTML and sitemap entries are correct; deploy this branch to test path routing in Vercel, then investigate domain/route precedence only if the post-deploy check still fails.
- Consent: denied defaults confirmed; no source CMP choice UI/restoration exists. Keep consent and Ads attribution validation blocked until the real approved CMP is connected and verified.
- Lighthouse repeat run (three mobile simulations): median performance 79, LCP 4,502.026 ms, TBT 168 ms, CLS 0. Largest Contentful Paint node was the homepage H1. The local static test server serves content uncompressed; this is not a field or production measurement. No additional CSS/hero change was justified because the H1, not the prioritized hero image, is the LCP node and the existing route stylesheet is already PurgeCSS-scoped.
- Final checks after the telemetry privacy fix: `npm test` PASS (446 test cases: 445 passed, 1 existing TODO, 0 failures); `npm run build` PASS; `npm run seo:validate` PASS (108 pages); `npx tsc --noEmit` PASS; Chromium browser suite PASS; selected WebKit 26.4 cases PASS. No Preview or production quote delivery was exercised.
- Current continuation state: code is ready for isolated Preview validation after infrastructure setup; real staging delivery is NOT RUN/BLOCKED; production deployment readiness is NOT READY. Existing untracked `artifacts/` files remain preserved.
