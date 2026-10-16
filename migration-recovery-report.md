# ZQ Removals domain migration recovery

Website changes are prepared on `fix/domain-migration-recovery-2026-10-15`. Nothing was pushed, deployed, submitted to Search Console or changed in DNS/Vercel account settings. The reported traffic decline, positions and historical indexing dates are owner-supplied evidence; they were not independently recalculated. The checks below establish routing/content conditions, not the cause of the decline or a guarantee of ranking recovery.

## Confirmed architecture

- Astro static output, currently Astro 7.3.5 in the manifest, with `scripts/build-site.mjs` as the production build entry point. No Next.js migration was made.
- `src/pages/[...slug].astro` consumes the source/generator route registry. `site-src/pages.json`, `site-src/content/` and generated data modules remain the edit surfaces.
- `renderHead` in the generator builds title, description, canonical, social tags and JSON-LD, inserted through the shared Astro layout.
- Vercel serves `site-dist`; `vercel.json` owns explicit redirect aliases, host redirects, headers and the new sitemap rewrite/function packaging.
- Sitemaps are generated from intended indexable canonical pages. They are not a dump of every historical URL.
- Existing unrelated worktree deletions/untracked files and the previous tracking commit were preserved.

## Task 1 — all supplied legacy URLs

`redirect-audit.csv` contains all **224 supplied URLs**, plus four clearly supplementary host/endpoint checks. Each row includes initial status, complete chain, hop count, final status/URL, title/canonical/OG/robots, topic-equivalence assessment, planned target/action and observation timestamp. `docs/legacy-redirect-live-audit.json` preserves the live observations independently of the proposed code changes. `data/migration/redirect-decisions.json` makes the semantic decisions reproducible on later audit runs.

Observed before deployment:

- 223/224 supplied URLs terminate at 200.
- One supplied URL terminates at 404: `/guides/how-to-prepare-furniture-for-moving/`.
- One supplied URL has two HTTPS redirect hops: the no-slash `/adelaide-moving-guides/moving-house-checklist-adelaide`.
- 131 existing consolidations lose a specific locality, route, guide question or comparison intent. They remain permanent redirects and are listed individually below for owner review; they are **not certified as true equivalents** merely because the destination returns 200.
- Croydon → Adelaide hub, move-duration guide → guide hub, and the fixed/cheap comparison aliases → pricing are existing deliberate decisions recorded in the consolidation registry. No standalone indexable equivalent currently survives for those precise intents. Recreating them without an owner decision would reverse prior consolidation. They were retained and flagged.

### Complete before → after table for changed redirects and routing

All URLs below use the existing canonical new host `https://zqremovalsadelaide.com.au` unless an old host is shown.

| Item | Live/configuration before | Prepared behaviour after approval/deployment |
| --- | --- | --- |
| `/guides/how-to-prepare-furniture-for-moving/` | Old host 308 → same new-domain path → 404 | Old or new alias 308 directly → `/adelaide-moving-guides/how-to-prepare-furniture-for-moving/`, existing matching guide |
| `/adelaide-moving-guides/moving-house-checklist-adelaide` (no slash) | Old host 308 → new no-slash URL → 308 → slash URL, 200 | Explicit first-match 308 directly → canonical slash URL |
| Old apex catch-all | `/(.*)` → new host `/$1`, every path | `/:path((?!legacy-sitemap\.xml$).*)` → new host `/:path`; exact XML endpoint is the only exception |
| Old www catch-all | Same catch-all as apex | Same precise XML exception and permanent new-host path preservation |
| Old apex `/legacy-sitemap.xml` | 308 → new-domain missing endpoint → 404 | Host-only rewrite → Node function → 200 XML with 224 old URLs |
| Old www `/legacy-sitemap.xml` | Covered by old www catch-all | Host-only rewrite → same 200 XML, listing the old apex URLs |
| New-domain `/legacy-sitemap.xml` and direct `/api/legacy-sitemap` | No working legacy sitemap | Remain 404; no old-URL sitemap exposed on the new host |

The guide alias is recorded in the verified registry and redirect builder so regeneration retains the fix. The no-slash normalization belongs in Vercel only: adding it to a slash-normalizing source consolidation registry could incorrectly suppress the actual canonical guide.

## Task 2 — legacy sitemap, without DNS changes

`api/legacy-sitemap.js` reads the exact supplied inventory from `data/migration/legacy-paths.txt`. Vercel `includeFiles` explicitly bundles that inventory. Rewrites target the trailing-slash API path to match the project’s `trailingSlash` policy; the existing production `/api/quote/` returns 405 to a read-only GET, confirming root-level function serving without sending an enquiry. GET/HEAD are supported; other methods receive 405. Only `zqremovals.au` and `www.zqremovals.au` may receive XML; arbitrary/new hosts receive 404. There are no invented last-modified dates. Both supplied checklist spellings are included exactly as requested.

Only the old-host catch-alls change, excluding the exact XML filename. Explicit aliases and every other old path continue to redirect. The new-domain sitemap index and robots file never advertise the legacy endpoint. The XML is generated by a host-restricted function, not copied into publicly served new-domain static output.

Live path-specific old-host redirects already go directly to their mapped final destinations. That is evidence that application/path routing is being applied, making a repository-level exception feasible. It does not prove the account dashboard state: the available read-only Vercel token returned **403**. No domain attachment or dashboard setting was changed.

After an approved deployment, check the old endpoint before submitting it to Search Console. If it still redirects despite the exception, an overriding domain-level redirect may be active. Stop at that point and inspect the domain assignment with an authorized Vercel owner; do not change DNS. Both old domains must be attached to this project as serving domains, with the repository host rules providing the redirects. Keep the old domain registered and retain permanent page redirects.

## Task 3 — HTTP normalization

Live `http://zqremovals.au/` and `http://www.zqremovals.au/` first receive Vercel’s HTTPS upgrade, then the canonical-host redirect. This occurs before the application routing under test. No DNS/proxy workaround or speculative header-based redirect was added. The extra HTTP hop is documented and retained as the low-priority platform limitation requested by the brief. HTTPS legacy URLs are the sitemap entries.

## Task 4 — new-domain hygiene

The current live index has **five** child sitemaps: pages (5 URLs), services (16), suburbs/hubs (48), guides (11), and images (80 page references). This is **80 unique page URLs**, with image sitemap references repeating those pages. The owner-supplied two-child/160+232 snapshot is not the current live structure.

Every one of the 80 live page URLs returned 200, a matching absolute self-canonical and `og:url`, no noindex, and no old-domain URL in the fetched HTML. Child sitemaps contained no old-host URLs. The old sitemap currently returns 308 to the new sitemap. Results are in `docs/live-sitemap-hygiene-audit.json`.

The complete local output is checked separately by `scripts/check-migration-hygiene.py`, including JSON-LD validity, internal/schema URL leftovers, every non-redirect page’s canonical/OG URL, sitemap XML and robots. Redirect-only HTML stubs are intentionally noindex and canonicalize their destination; making those aliases self-canonical would conflict with their redirect purpose. `admin@zqremovals.au` remains the existing business email, not an old website URL to replace.

No title/meta/canonical repair was needed in current output. No live route was removed or renamed by this change.

## Task 5 — thin-content report only

See `thin-content-report.md` and `docs/thin-content-metrics.json` for all 43 current locality pages, plus current destinations of all 15 GSC examples. Hubs and the pricing page are distinguished from suburb nodes even where the stylesheet uses the same body class.

The report measures actual main-text words, distinct vocabulary, recurring template words and unshared words. It excludes header/footer/navigation/forms and normalizes each page’s own place name when comparing seven-word sequences across at least three pages. Visible headings and content excerpts accompany the recommendations. The shared-word estimate is a reproducible diagnostic, not Google’s duplicate-content algorithm or an indexing threshold. Existing city/tower, rail/shared-access, heritage-handling and coastal-parking briefs receive explicit editorial retention decisions where appropriate.

No deletion, new noindex, route removal or speculative content expansion was performed. Existing broad consolidations are not evidence that their historical standalone pages still exist to measure. No new noindex recommendation is justified solely by the supplied GSC status.

## Task 6 — piano page

There is one indexable canonical piano service page, `/services/piano-movers-adelaide/`; the live sitemap does not expose a competing piano URL. Its existing title, H1 and description already target the requested terms accurately and were retained.

| Field | Before | After |
| --- | --- | --- |
| Title | Piano Movers Adelaide \| Piano Removalists \| ZQ Removals | Unchanged |
| H1 | Piano Movers Adelaide | Unchanged |
| Meta description | Piano movers Adelaide for upright and digital pianos. Send instrument dimensions and access photos for a handling assessment and moving quote. | Unchanged |
| Canonical and og:url | `https://zqremovalsadelaide.com.au/services/piano-movers-adelaide/` | Unchanged |
| Homepage link anchor | Discuss a heavy item | Piano movers Adelaide |
| Adelaide service hub link anchor | Specialist piano movers Adelaide | Piano removalists Adelaide |

The real service entry hub is `/removalists-adelaide/`, which already contains the service links; there is no rendered `/services/` hub to patch. No new service hub URL or duplicate piano page was created. No specialist-equipment, qualifications or unsupported handling guarantees were added.

## Verification

| Verification | Result |
| --- | --- |
| Production `npm run build` | PASS (Windows Node 22) |
| Full `npm test` | PASS: quote API smoke plus 202 tests across 27 files |
| Final affected sitemap/routing/piano tests after API rewrite normalization | PASS: 4/4 |
| TypeScript `npx tsc --noEmit` | PASS |
| `npm run lint` | UNAVAILABLE: missing lint script, exact command attempted |
| Changed JS/MJS syntax and Python compilation | PASS |
| Official Vercel JSON schema | PASS: zero errors |
| Full local generated-output hygiene | PASS: 95 non-redirect pages + 27 intentional noindex redirect stubs, zero errors |
| Live canonical-domain sitemap/page hygiene | PASS: 5 child sitemaps, 80 unique page URLs, zero errors |
| Local endpoint/rule HTTP harness | PASS: host restriction, 224 XML entries and direct prepared mappings |
| Full Playwright desktop/mobile suite | PASS: 100/100 across 375, 390, 768, 1366 and 1920 px viewports |
| Production legacy sitemap and new alias fixes | NOT DEPLOYED / NOT VERIFIED live; CSV preserves current before-state |

Logs are retained locally under `tmp/migration-*.log`. Local HTTP checks use the actual function with a small changed-rule harness; they are not claimed as deployed Vercel edge verification. `docs/migration-local-http-checks.txt` records these outcomes:

- Old apex/www sitemap: 200 XML, 224 `<loc>` entries.
- New host sitemap: 404, no old URL body.
- Both repaired aliases: direct permanent 308 to their matching canonical guides.
- Old `/contact-us/` and unknown paths: still permanently redirect to the corresponding new-host path.

Vercel JSON passed the current official draft-04 schema with zero validation errors. TypeScript passed. `npm run lint` was attempted and cannot run because no lint script is defined; JS/MJS syntax checks and Python compilation were used for the changed audit/endpoint code. No dependency upgrades were introduced. The first full suite found an outdated host-redirect assertion that required all hosts to use the exact old wildcard syntax; it was updated to assert the intentional sitemap exception, while dedicated tests cover the host restrictions and exact inventory.

### Reproduce from repo root

Use Windows Node 22 for the generator/build suites because the installed native packages target Windows:

```powershell
npm.cmd run build
npm.cmd test
npx.cmd tsc --noEmit
node --check api/legacy-sitemap.js
node --check scripts/audit-legacy-redirects.mjs
node --check scripts/audit-live-sitemaps.mjs
npx.cmd playwright test --reporter=line --workers=3
```

Run the Python reports only after builds/tests have stopped rewriting `site-dist`:

```sh
python3 scripts/check-migration-hygiene.py
python3 scripts/report-thin-content.py
node scripts/audit-legacy-redirects.mjs
node scripts/audit-live-sitemaps.mjs
```

Audit scripts make read-only public HTTP requests. The legacy redirect script updates the CSV with current observations while retaining the reviewed semantic decision registry.

Before a separately authorized release:

```sh
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" https://zqremovals.au/legacy-sitemap.xml
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" https://zqremovals.au/guides/how-to-prepare-furniture-for-moving/
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" https://zqremovals.au/adelaide-moving-guides/moving-house-checklist-adelaide
curl -s https://zqremovalsadelaide.com.au/services/piano-movers-adelaide/
```

These commands currently inspect the unchanged production deployment; they will not show the prepared corrections until approval and deployment. Keep a separately approved rollback to the prior host rules available if the old-domain sitemap exception fails at the edge. No automatic push/deploy is part of this work. Once live and submitted, retain the legacy sitemap for the requested 3–6 months while monitoring recrawls; retain the permanent redirects and old domain for at least a year.

## Owner decisions and limits

- No `[[OWNER TO CONFIRM: …]]` placeholders were added to site copy. No new business claims were needed.
- Review the 131 retained broad consolidations below, especially the four examples in the brief. The CSV explicitly distinguishes successful HTTP delivery from true intent equivalence.
- Approve or reject the thin-page enrichment/merge recommendations before any route/indexability change.
- The manual Change of Address, sitemap submission, indexing requests, directory/GBP changes and old-domain renewal remain owner steps. None was executed by this run.
- Current Search Console indexing/ranking/traffic was not authenticated/refreshed, and no recovery timeline is promised.
- The previous conversion-tracking commit remains in branch history. Its documented GTM publication prerequisites remain separate and must be reconciled before any later deployment of the branch.

## Retained consolidations requiring owner review

| Old path | Existing final destination | Decision required |
| --- | --- | --- |
| /adelaide-moving-guides/apartment-lift-bookings-adelaide/ | /apartment-removalists-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /adelaide-moving-guides/apartment-loading-zone-guide-adelaide/ | /apartment-removalists-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /adelaide-moving-guides/booking-timing-guide-adelaide/ | /adelaide-moving-guides/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /adelaide-moving-guides/cheap-vs-fixed-price-removalists-adelaide/ | /removalists-adelaide-prices/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /adelaide-moving-guides/coastal-moving-access-adelaide/ | /removalists-southern-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /adelaide-moving-guides/downsizing-move-adelaide/ | /adelaide-moving-guides/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /adelaide-moving-guides/fixed-price-vs-hourly-removalists-adelaide/ | /removalists-adelaide-prices/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /adelaide-moving-guides/hourly-vs-fixed-price-movers-adelaide/ | /removalists-adelaide-prices/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /adelaide-moving-guides/how-long-moves-take-adelaide/ | /adelaide-moving-guides/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /adelaide-moving-guides/how-much-do-movers-cost-adelaide/ | /removalists-adelaide-prices/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /adelaide-moving-guides/how-to-get-accurate-removalist-quotes-adelaide/ | /removalists-adelaide-prices/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /adelaide-moving-guides/interstate-moving-checklist-adelaide/ | /interstate-removals-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /adelaide-moving-guides/interstate-removal-checklist-adelaide-guide/ | /interstate-removals-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /adelaide-moving-guides/last-minute-moving-adelaide/ | /same-day-removalists-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /adelaide-moving-guides/moving-cost-adelaide-2026/ | /removalists-adelaide-prices/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /adelaide-moving-guides/moving-fragile-items-adelaide/ | /packing-services-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /adelaide-moving-guides/moving-from-apartment-buildings-adelaide/ | /apartment-removalists-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /adelaide-moving-guides/moving-heavy-furniture-adelaide/ | /furniture-removalists-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /adelaide-moving-guides/moving-heavy-items-adelaide-guide/ | /furniture-removalists-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /adelaide-moving-guides/moving-with-stairs-adelaide/ | /adelaide-moving-guides/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /adelaide-moving-guides/northern-suburbs-moving-adelaide/ | /removalists-northern-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /adelaide-moving-guides/office-relocation-checklist-adelaide-guide/ | /office-removals-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /adelaide-moving-guides/office-relocation-preparation-adelaide/ | /office-removals-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /adelaide-moving-guides/packing-fragile-items-adelaide/ | /packing-services-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /adelaide-moving-guides/packing-timeline-adelaide/ | /packing-services-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /adelaide-moving-guides/pricing-breakdown-adelaide/ | /removalists-adelaide-prices/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /adelaide-moving-guides/removalist-quote-checklist-adelaide/ | /removalists-adelaide-prices/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /adelaide-moving-guides/removalists-cost-marion/ | /removalists-adelaide-prices/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /adelaide-moving-guides/settlement-day-moving-adelaide/ | /adelaide-moving-guides/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /adelaide-moving-guides/small-office-move-adelaide/ | /office-removals-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /adelaide-moving-guides/storage-planning-adelaide/ | /adelaide-moving-guides/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /adelaide-moving-guides/storage-unit-move-adelaide/ | /adelaide-moving-guides/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /adelaide-moving-guides/suburb-move-preparation-adelaide/ | /adelaide-moving-guides/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /adelaide-moving-guides/weekend-vs-weekday-moving-adelaide/ | /adelaide-moving-guides/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /adelaide-moving-guides/when-to-book-packing-services-adelaide/ | /packing-services-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /adelaide-to-queensland-removals/ | /interstate-removals-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /adelaide-to-smithfield-nsw-removalists/ | /interstate-removals-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /apartment-removalists-glenelg/ | /apartment-removalists-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /apartment-removalists-hallett-cove/ | /apartment-removalists-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /apartment-removalists-henley-beach-south/ | /apartment-removalists-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /apartment-removalists-henley-beach/ | /apartment-removalists-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /apartment-removalists-prospect/ | /apartment-removalists-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /apartment-removalists-queens-park/ | /removalists-queens-park/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /budget-removalists-adelaide/ | /removalists-adelaide-prices/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /cheap-vs-fixed-price-removalists-adelaide/ | /removalists-adelaide-prices/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /fixed-price-removalists-adelaide/ | /removalists-adelaide-prices/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /fixed-price-vs-hourly-removalists-adelaide/ | /removalists-adelaide-prices/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /guides/interstate-moving-from-adelaide/ | /interstate-removals-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /interstate-removalists-vs-backloading-adelaide/ | /interstate-removals-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /melbourne-to-adelaide-removalists/ | /interstate-removals-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /moving-from-adelaide-cbd-to-marion/ | /removalists-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /moving-from-adelaide-cbd-to-mawson-lakes/ | /removalists-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /moving-from-adelaide-cbd-to-salisbury/ | /removalists-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /moving-from-marion-to-noarlunga/ | /removalists-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /moving-from-modbury-to-salisbury/ | /removalists-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /moving-from-port-adelaide-to-west-lakes/ | /removalists-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /moving-from-prospect-to-mawson-lakes/ | /removalists-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /moving-quotes-adelaide/ | /removalists-adelaide-prices/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /no-limits-removalists-alternative-adelaide/ | /removalists-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /office-removals-adelaide-cbd/ | /office-removals-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /office-removals-edwardstown/ | /office-removals-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /office-removals-glenelg/ | /office-removals-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /office-removals-mile-end/ | /office-removals-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /office-removals-modbury/ | /office-removals-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /office-removals-oaklands-park/ | /office-removals-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /office-removals-port-adelaide/ | /office-removals-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /office-removals-salisbury/ | /office-removals-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /packing-services-adelaide-cbd/ | /packing-services-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /packing-services-elizabeth/ | /packing-services-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /packing-services-glenelg/ | /packing-services-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /packing-services-marion/ | /packing-services-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /packing-services-norwood/ | /packing-services-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /packing-services-queens-park/ | /removalists-queens-park/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /packing-services-salisbury/ | /packing-services-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /packing-services-unley-park/ | /packing-services-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /professional-packers-vs-diy-packing-adelaide/ | /packing-services-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /removalist-cost-adelaide/ | /removalists-adelaide-prices/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /removalists-adelaide-quote/ | /removalists-adelaide-prices/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /removalists-albert-park/ | /removalists-southern-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /removalists-athelstone/ | /removalists-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /removalists-belair/ | /removalists-adelaide-hills/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /removalists-blackwood/ | /removalists-adelaide-hills/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /removalists-blakeview/ | /removalists-northern-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /removalists-bridgewater/ | /removalists-adelaide-hills/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /removalists-christies-beach/ | /removalists-southern-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /removalists-clarence-park/ | /removalists-southern-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /removalists-clearview/ | /removalists-northern-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /removalists-colonel-light-gardens/ | /removalists-southern-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /removalists-coromandel-valley/ | /removalists-adelaide-hills/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /removalists-croydon/ | /removalists-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /removalists-dudley-park/ | /removalists-northern-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /removalists-edwardstown/ | /removalists-southern-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /removalists-elizabeth-vale/ | /removalists-northern-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /removalists-findon/ | /removalists-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /removalists-fulham/ | /removalists-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /removalists-glandore/ | /removalists-southern-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /removalists-glengowrie/ | /removalists-southern-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /removalists-hallett-cove/ | /removalists-southern-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /removalists-hope-valley/ | /removalists-northern-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /removalists-kilburn/ | /removalists-northern-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /removalists-klemzig/ | /removalists-northern-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /removalists-largs-bay/ | /removalists-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /removalists-mile-end/ | /removalists-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /removalists-moana/ | /removalists-southern-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /removalists-morphett-vale/ | /removalists-southern-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /removalists-myrtle-bank/ | /removalists-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /removalists-newton/ | /removalists-northern-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /removalists-noarlunga/ | /removalists-southern-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /removalists-north-adelaide/ | /removalists-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /removalists-north-park/ | /removalists-northern-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /removalists-northfield/ | /removalists-northern-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /removalists-oaklands-park/ | /removalists-southern-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /removalists-parafield-gardens/ | /removalists-northern-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /removalists-port-noarlunga/ | /removalists-southern-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /removalists-reynella/ | /removalists-southern-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /removalists-ridgehaven/ | /removalists-northern-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /removalists-rosemont/ | /removalists-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /removalists-rosewater/ | /removalists-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /removalists-seacliff/ | /removalists-southern-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /removalists-seaford/ | /removalists-southern-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /removalists-seaton-park/ | /removalists-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /removalists-seaton/ | /removalists-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /removalists-somerton-park-west/ | /removalists-southern-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /removalists-trott-park/ | /removalists-southern-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /removalists-urrbrae/ | /removalists-southern-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /removalists-valley-view/ | /removalists-northern-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /removalists-victor-harbor/ | /removalists-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /removalists-woodville/ | /removalists-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /removalists-yatala-vale/ | /removalists-northern-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /small-removalists-adelaide/ | /removalists-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |
| /small-removals-adelaide/ | /removalists-adelaide/ | Retain merge or restore a differentiated equivalent; broader target is not a one-to-one intent match |


## Files changed

- `api/legacy-sitemap.js` — old-host-only XML endpoint.
- `data/migration/legacy-paths.txt` — all 224 supplied URL paths.
- `data/migration/redirect-decisions.json` — per-path semantic assessment and planned action.
- `vercel.json` — two alias fixes, old-host sitemap exception/rewrites and explicit function inventory packaging.
- `site-src/data/zq-redirects-verified.json`, `scripts/seo-redirects-build.mjs` — persistent furniture-guide alias correction.
- `site-src/content/index.html`, `site-src/content/removalists-adelaide/index.html` — descriptive piano anchors.
- `scripts/audit-legacy-redirects.mjs`, `scripts/audit-live-sitemaps.mjs` — reproducible live audits.
- `scripts/check-migration-hygiene.py`, `scripts/report-thin-content.py` — local canonical-host/content measurements.
- `tests/migration-recovery.test.mjs`, `tests/search-console-fixes.test.mjs` — endpoint/routing/piano regressions and updated sitemap-exception contract.
- `redirect-audit.csv`, `thin-content-report.md`, `migration-recovery-report.md` — requested delivery reports.
- `docs/legacy-redirect-live-audit.json`, `docs/live-sitemap-hygiene-audit.json`, `docs/migration-hygiene-audit.json`, `docs/thin-content-metrics.json`, `docs/migration-local-http-checks.txt` — supporting observations and measurements.

References: [Google’s site-move guidance](https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes), [Vercel host conditions/redirects/function packaging](https://vercel.com/docs/project-configuration/vercel-json), [Vercel rewrites](https://vercel.com/docs/routing/rewrites). Google documents that redirect warnings for old-URL sitemaps are expected during a move; submission does not guarantee prompt recrawling or index replacement.
