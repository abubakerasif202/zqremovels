# ZQ SEO phase 2 — migration and performance

Application baseline: deployed PR #121, `85c23a5ff769658ab424e38b9519245e7891e8e1`. Work is isolated in the sibling `phase-2` worktree. The original modified checkout was not edited.

## Legacy forwarding: readiness and rollback

Authenticated Vercel project-domain lookup showed that **both** verified legacy hosts have a domain-level 301 to the current apex. Requests do not reach the site routing rules on the old host first. Vercel DNS is authoritative; existing mail routing includes Google MX. **No DNS or forwarding changes were made.** On both legacy hosts, representative live HTTPS GETs verified TLS and attribution, direct root, two-hop budget and cost-guide aliases, and final 404 for an unknown path. The legacy sitemap path currently forwards to a 404 on the new host.

All 198 chained records already have an unconditioned exact path rule to the audited final canonical (196 permanent 308 and two 301). These rules precede the legacy-host catch-all. Do not duplicate them. The 329-record baseline remains **131 direct / 198 chained / 0 broken final destinations**. There is no post-cutover count. The target is 329 direct if verification confirms the runtime ordering.

1. Obtain explicit permission for **only** the Vercel project-domain forwarding settings on the legacy www and apex. Capture current target and status for both records. Preserve DNS, certificates, verified bindings, and mail records.
2. With approval, change legacy **www** from Redirect to Production without deleting the binding. Verify certificate, root, budget and cost aliases, synthetic UTM and gclid, unknown path, legacy sitemap, and the new apex. Require a single 301/308 to the expected canonical 200 for mapped routes; check the legacy sitemap serves the intended XML and unknown URLs stay non-indexable with a final 404.
3. Abort on loops, loss of attribution, TLS failure, unexpected status or canonical, or production degradation. Roll back by restoring the changed host's previous 301 target `zqremovalsadelaide.com.au`; rerun the sample. Do not change the old apex until www passes.
4. Repeat on legacy apex, then re-run all 329 documented probes with synthetic rather than private attribution. Keep HTTP scheme-upgrade hops separately classified; review both HTTPS hosts for one application redirect. See [Vercel domain forwarding](https://vercel.com/docs/domains/working-with-domains/deploying-and-redirecting).

## Search Console

Live web/date results, previous Sep 30–Oct 27 → latest Oct 28–Nov 24, 2026. Both windows have 28 rows; Nov 25 was conservatively excluded, and the connector does not expose API finalisation state. This is a pre-release monitoring baseline, not release attribution.

| Property | Clicks | Impressions | CTR | Approx. impression-weighted position |
|---|---|---|---|---|
| Legacy | 3 → 1 | 1,185 → 289 | 0.25% → 0.35% | 13.57 → 12.31 |
| Current | 23 → 43 | 5,837 → 6,348 | 0.39% → 0.68% | 32.63 → 26.58 |
| Combined, not deduplicated | 26 → 44 | 7,022 → 6,637 | 0.37% → 0.66% | Not combined |

Current Australian clicks/impressions moved from 22/5,740 to 42/6,068; Australian mobile increased from 11/1,984 to 24/2,444. Eight current priority URLs were submitted and indexed, successfully fetched, and selected by Google at the exact apex canonical. Crawl dates ranged from 2–25 November. The submitted new sitemap reported zero errors/warnings and 158 web / 227 image submissions, not indexed counts. Old sitemap and Google-selected canonicals were not verified: the connector scoped these operations to the default new property; an alternate read attempt returned HTTP 400.

**Manual procedure:** In Google Search Console, sign in with the same verified owner of both properties. Select `zqremovals.au` → **Settings → Change of Address** and read any outgoing notice; repeat on `zqremovalsadelaide.com.au` for the incoming notice. Check relevant verified variants separately. Notices can disappear after 180 days; absence does not establish that no move was filed. Do not submit or cancel from this review. [Google instructions](https://support.google.com/webmasters/answer/9370220?hl=en).

## Intent and trust

Australian query×page data Oct 1–Nov 25 is descriptive (last day potentially preliminary). The office URL had 140 impressions at position 4.8 with zero clicks: retain the deployed metadata and improve only with evidence, not another title rewrite. Pricing intent was split between the rates page (107 impressions, position 15.1) and cost guide (85, 13.2). The guide now directs rate-table intent to the existing approved pricing page without repeating a partial rate card. The guide continues covering inventory, access and move time. Local Hyde Park and Unley Park variants primarily favour their respective pages; no merges or changes to canonicals. Generic Adelaide visibility favoured the homepage; house and piano queries have weaker positions. Preserve distinct service pages for house, furniture and piano and avoid unverified allowances or availability. Compare pricing transparency, not competitor prices: [ADL Removalists guide](https://adlremovalists.com.au/cost/) and [Find a Mover Adelaide](https://www.findamover.com.au/removalists/adelaide).

About preserves the 384px WebP portrait (192px layout dimensions, descriptive alt, lazy loading), verified director role, and links the leadership section to the existing quote form. No biography or booking logic was added.

## Monitoring and rollback

Use `scripts/gsc-monitor.py` for future authorised local exports. At day 30 rerun both complete 28-day windows, the eight URL inspections and the complete redirect map after any approved cutover. At day 60 compare Australian mobile vs desktop, commercial landing/query pairs and CTR; check cheap and generic Adelaide against rates intent. At day 90 review non-brand clicks, qualified leads, redirect coverage, field p75 LCP/CLS/INP if available, and sitemap health. Do not attribute trends to a release without a meaningful post-release window.

Application rollback is independent of forwarding: revert the bounded Phase 2 PR or restore the previous verified production deployment, then check homepage, contact, office title, About portrait and sitemap.

## Mobile Lighthouse evidence

Two default mobile Lighthouse runs per route (simulated throttling, Chrome on the same machine; not field data). The spread shows repeatability limits:

| Production baseline | LCP (s), runs | Performance scores |
|---|---|---|
| Home | 3.18 / 2.70 | 73 / 79 |
| Office | 3.02 / 2.57 | 74 / 88 |
| Prices | 2.33 / 1.91 | 86 / 99 |
| Piano | 2.77 / 2.56 | 78 / 80 |
| Hyde Park | 2.60 / 2.77 | 79 / 77 |
| Unley Park | 2.30 / 2.48 | 93 / 86 |
| Contact | 2.03 / 2.42 | 93 / 86 |
| About | 1.94 / 2.40 | 94 / 83 |

Live CLS was at most 0.027 in the sample. Home's first trace identified its text H1, not the CSS background, as LCP; render delay and a blocking stylesheet were visible, and TBT varied substantially. The mobile-only background preload still discovers the same WebP, now with low fetch priority. Desktop retains high priority. Stylesheets, fonts, consent scripts, animations, imagery, and form code were not removed or deferred without evidence. Under the same local Lighthouse command, paired home runs were **3.875 / 3.912 s before** and **3.754 / 3.685 s after** (midpoint 3.894 → 3.720 s, −0.174 s); scores were 62/71 before and 85/68 after. The small sample supports retaining the change, not promising a production gain. Neither the 2.5 s LCP nor 90 score target was consistently reached. No real-user INP or field CWV compliance was established.

## Verification and release

- App commit c3a333a; [PR #122](https://github.com/abubakerasif202/zqremovels/pull/122); [first Vercel Preview](https://vercel.com/abubakerasif202s-projects/zq/6VcggTzBMWBK9r7ibUSHF6zhgeSg) Ready. Public Preview access remains protected.
- Local build, TypeScript, SEO validation and three focused regressions passed. Sampled five routes at nine widths (45 checks): HTTP 200 throughout, no horizontal overflow. Booking and quote logic unchanged; browser workflow uses mocked submissions. Full suite and release attestations will be posted on the PR; do not infer production from Preview.
- Application risk: mobile background paint timing; desktop unchanged. Infrastructure remains untouched and is a separate approval gate.
