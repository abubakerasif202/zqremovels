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

## Continuation verification — 23 October 2026

- Vercel project `zq` read-only metadata: receipt Redis variables target Production only; Preview has no Redis receipt variables. Preview provider-key presence does not establish a safe destination. There is no Preview deployment for the current branch.
- Old-host redirect checks: each of the three legacy paths returns 308 to the same path on the apex; that apex path returns 404 on the current Production deployment. Their mapped canonical targets return 200. Current local rules, canonical HTML and sitemap entries are correct; deploy this branch to test path routing in Vercel, then investigate domain/route precedence only if the post-deploy check still fails.
- Consent: denied defaults confirmed; no source CMP choice UI/restoration exists. Keep consent and Ads attribution validation blocked until the real approved CMP is connected and verified.
- Lighthouse repeat run (three mobile simulations): median performance 79, LCP 4,502.026 ms, TBT 168 ms, CLS 0. Largest Contentful Paint node was the homepage H1. The local static test server serves content uncompressed; this is not a field or production measurement. No additional CSS/hero change was justified because the H1, not the prioritized hero image, is the LCP node and the existing route stylesheet is already PurgeCSS-scoped.
- Final checks after the telemetry privacy fix: `npm test` PASS (446 test cases: 445 passed, 1 existing TODO, 0 failures); `npm run build` PASS; `npm run seo:validate` PASS (108 pages); `npx tsc --noEmit` PASS; Chromium browser suite PASS; selected WebKit 26.4 cases PASS. No Preview or production quote delivery was exercised.
- Current continuation state: code is ready for isolated Preview validation after infrastructure setup; real staging delivery is NOT RUN/BLOCKED; production deployment readiness is NOT READY. Existing untracked `artifacts/` files remain preserved.
