# ZQ Removals release checklist

Audit date: 23 October 2026.

## Change context

- Repository: `C:\Users\abuba\zqremovels`
- Branch: `fix/ads-conversion-recovery-2026-10-22`
- Base HEAD: `d181b6f` (`style(site): apply premium template and preserve integrations`)
- Commit: this validated change set is prepared as a local commit; the hash is reported in the handoff.
- Deployment: not performed. Google Ads and GTM were not modified.
- Source export: `C:\Users\abuba\gsc-private\GSC_ALL_DATA\sc-domain_zqremovals.au.zip`; archived customer data was not copied into the repository.

## Validation status

| Check | Result | Evidence / limit |
| --- | --- | --- |
| Production build | PASS | `npm run build`; Astro built 122 pages. |
| SEO validation | PASS | `npm run seo:validate`; 108 route records, 0 bad pages. |
| Sitemap validation | PASS local | 79 indexable canonical URLs across four child page sitemaps; no invalid sitemap entries in local validation. |
| Redirect validation | BLOCKED live | Saved production crawl: 312 cases, 3 historical guide destinations final-404 before this branch was released. All three targets are present in current local output. Post-release live verification is required. |
| Canonical validation | PASS local | Generator validator passed; apex canonical policy and sitemap-host checks hold in local output. |
| Structured data | PASS local tests / NOT RUN live | Repository regression checks cover schema and host integrity; no live rich-results account validation was performed. |
| Quote API smoke | PASS | Included in `npm test`; no live provider call. |
| Node regression suite | PASS | `npm test`, including quote API smoke and all repository Node test files; no failures reported. |
| TypeScript check | PASS | `npx tsc --noEmit` completed with exit code 0. |
| Conversion contract | PASS local mocks | Node tests cover accepted/rejected/pending and duplicate receipt behavior. Staging receipt and Ads event remain NOT RUN. |
| Mobile quote form | PASS simulated Chromium | This turn's conversion/mobile Playwright run: 172 passed, 28 project-filtered skips, across mobile, tablet and desktop Chrome. Earlier six-route/eight-width evidence had 48 unchanged screenshot pairs and zero overflow. Physical devices NOT RUN; WebKit BLOCKED by missing host libraries. |
| Accessibility | PASS scoped automated evidence / NOT RUN physical | Prior Chromium/axe browser evidence is documented in the production verification report; native assistive technology and physical keyboard behavior are not verified here. |
| Lighthouse | PASS lab comparison; target unmet | Recorded median score 79→81 and simulated LCP 4663→4518 ms; local LCP remains above 2.5 s. Field INP/CrUX NOT RUN. |
| Lint | NOT RUN | No lint script is defined in `package.json`. |
| GSC account updates | NOT RUN | No sitemap submission, Change of Address, or URL inspection was performed. |
| Live deployment | NOT RUN | Explicitly outside this release action. |

## Files and workstreams

The current branch includes modifications to `site.js`, `analytics.mjs`, `api/quote.js`, `lib/server/quote-receipts.js`, `vercel.json`, the site build post-processing, SEO and conversion tests, existing conversion documentation, and SEO recovery reports. Review the full Git diff before committing. Preserve the existing in-progress work; do not reset or blanket-stage private exports or unrelated files.

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

**NOT READY — ISSUES REMAIN.** The local build and SEO checks pass, but the three live guide targets have not been checked after release, Preview receipt storage/provider/consent are not ready for controlled lead verification, and production conversion delivery remains unproven. No deployment was made.
