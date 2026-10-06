# ZQ post-migration SEO recovery monitoring

Prepared 7 October 2026 (Australia/Sydney). Owner: site owner for Search Console actions; repository maintainer for technical investigations. This report is an operational checklist, not evidence that Google has processed the move.

## A. Dates and evidence boundaries

- Original canonical-host migration source commit: `8fcc6c5`, 30 August 2026. This establishes a repository milestone, not the exact first successful production migration or Change of Address submission date. Those dates remain unverified.
- Recovery baseline D0: 7 October 2026, the verified migration-repair release. Production deployment was created at 00:26:31 AEDT.
- Recovery checkpoints: D+7 = 14 October; D+14 = 21 October; D+28 = 4 November 2026. Use completed Search Console reporting days; revisit each checkpoint when its final day is available.
- User-supplied post-repair full crawl: 515 cases, no unexpected 404s, wrong destinations, temporary redirects or sitemap metadata failures; 51 permanent normalization chains. This full-crawl result was not rerun in this recovery audit.
- `docs/zq-migration-live-audit.json` is the **pre-repair** crawl, timestamped 6 October 2026 13:10:56 UTC. Its defects are historical, not current regressions.
- The older migration report's statement that no domain-level redirect overrides existed is superseded by the owner's current safety instruction. Preserve the existing legacy-to-new Project Domain redirect. Do not reproduce the duplicate-content experiment.

## B. Current production and fresh technical baseline

Local and remote `main` both matched `074236312308f5462a994884bd3d3a441b7e473e` at recon. Vercel CLI inspection of the production hostname returned deployment `dpl_6aLvHq8SE5AVGLttqhTpDLAcvThf`, target production, status **Ready**. The disconnected Vercel connector was not used as deployment evidence. CLI status and HTTP results are separate evidence; the CLI summary did not independently expose the deployment Git SHA.

Fresh read-only GET checks:

- All **80 unique HTML page URLs** discovered in the live sitemap returned HTTP 200, without redirects, with exactly one self-referencing apex canonical and one H1. No page robots `noindex` was found. Image sitemap page references were deduplicated; image locations are not counted as HTML pages.
- `sitemap.xml`, `sitemap-pages.xml`, `sitemap-services.xml`, `sitemap-suburbs.xml`, `sitemap-guides.xml` and `sitemap-images.xml` returned 200 and parsed as XML.
- `robots.txt` returned 200, with `User-agent: *`, `Allow: /`, and the new-domain `sitemap.xml` plus `ai-sitemap.xml` references. No priority path is excluded.
- All nine legacy URLs in section C returned a single permanent 308 to their exact new-domain counterpart, followed by 200. No temporary redirect, homepage misrouting or legacy duplicate content appeared in this sample.
- Priority pages have `index,follow,max-image-preview:large`, no X-Robots-Tag exclusion, sitemap inclusion, useful internal navigation, substantial page content and a primary H1. No obvious HTTP/content soft-404 indicator was found. Google's soft-404 classification and selected canonical remain unverified until URL Inspection.

No current migration regression was found. Harmless permanent normalization chains are not a reason to alter production routing.

## C. Priority URLs and inspection order

Prepend `https://zqremovalsadelaide.com.au` for new URLs and `https://zqremovals.au` for legacy equivalents. Every row passed the fresh technical checks above.

| Path | Inspection priority | Intended role |
| --- | --- | --- |
| `/services/piano-movers-adelaide/` | 1 | Piano assessment and moving enquiries |
| `/adelaide-to-sydney-removalists/` | 1 | Adelaide to Sydney route |
| `/adelaide-to-brisbane-removals/` | 1 | Adelaide to Brisbane route |
| `/removalists-adelaide-prices/` | 1 | Published rates and cost factors |
| `/removalists-unley-park/` | 1 | Unley Park local moving |
| `/removalists-hyde-park/` | 1 | Hyde Park local moving |
| `/office-removals-adelaide/` | 2 | Office moving; preserve separation from homepage |
| `/adelaide-to-melbourne-removalists/` | 2 | Adelaide to Melbourne route |
| `/` | 2 | Brand, broad local trust and navigation |

Also inspect `/removalists-adelaide/` for the generic Adelaide commercial cluster and `/house-removals-adelaide/` for the repaired historical house-service mapping. Keep each page's existing intent; do not create competing landing pages.

## D. Priority query monitoring

| Cluster | Exact queries to export | Intended new-domain landing page |
| --- | --- | --- |
| Office | office removalists adelaide | `/office-removals-adelaide/` |
| Adelaide | removalists adelaide | `/removalists-adelaide/` |
| Hyde Park | removalists hyde park; hyde park removalists; local removalist hyde park | `/removalists-hyde-park/` |
| Unley Park | removalists unley park | `/removalists-unley-park/` |
| Piano | piano movers adelaide; piano removalists adelaide | `/services/piano-movers-adelaide/` |
| Prices | removalists adelaide prices | `/removalists-adelaide-prices/` |
| Sydney | adelaide to sydney removalists | `/adelaide-to-sydney-removalists/` |
| Brisbane | adelaide to brisbane removalists | `/adelaide-to-brisbane-removals/` |
| Melbourne | adelaide to melbourne removalists | `/adelaide-to-melbourne-removalists/` |

Record query-to-page distribution as well as cluster totals. An unexpected homepage appearance is an investigation signal, not proof of cannibalization from one impression. Use exact query filters or an anchored regex, preserving spaces and spelling. Separate branded queries into their own view.

## E. Known Search Console baselines and missing evidence

Canonical property: `sc-domain:zqremovalsadelaide.com.au`.
Legacy property: `sc-domain:zqremovals.au`.

These are **owner-supplied historical migration-era figures**. Their date ranges, country/device filters and extraction dates are unspecified. Do not treat the figures as comparable periods, sum them into a current traffic baseline, or interpret page counts as indexed-page counts.

| Property | Clicks | Impressions | Reported queries | Reported pages |
| --- | ---: | ---: | ---: | ---: |
| Legacy historical | 308 | 41,741 | 1,267 | 313 |
| New domain historical | 22 | 3,923 | 331 | 63 |

| Page/cluster | Historical old average position | Historical new average position |
| --- | ---: | ---: |
| Piano | ~28.9 | ~74.6 |
| Prices | ~15.8 | ~32 |
| Unley Park | ~8.5 | ~20 |
| Hyde Park | ~9.3 | ~15.9 |
| Sydney | ~34.7 | ~80 |
| Brisbane | ~32.7 | ~86 |
| Homepage | ~21 | ~10 |

Office and Melbourne positions were not supplied. Position is an aggregate with changing query mix, not a fixed rank or transferable score.

Local `data/gsc/*.raw.json` includes old-domain data from April–May 2026; it cannot establish today's recovery trend. A fresh read-only Search Analytics attempt for both domain properties, Web search, final data, 8 September–5 October 2026 returned **HTTP 401 for both**. No current performance or indexing results were retrieved, and no credential material was printed or committed. Restore authenticated GSC access or use manual exports before filling the monitoring ledger.

### Manual Search Console checklist — all pending verification

1. Confirm verified ownership/access for both domain properties. In the legacy property's Settings → Change of Address, record destination, submission date and active/current status. Do not cancel or resubmit an active move merely to refresh it.
2. In the canonical property's Sitemaps report, submit/resubmit `https://zqremovalsadelaide.com.au/sitemap.xml`. Record submitted date, status, last read, discovered pages and child-sitemap errors. HTTP 200 is not evidence that Google read it successfully.
3. Inspect each priority new-domain URL. Record indexing verdict, coverage reason, last crawl, crawl allowed, indexing allowed, user-declared canonical, Google-selected canonical and referring sitemap. Record “not reported” if Google does not expose a referring sitemap; that alone is not a defect.
4. Run the live test where indexed information is stale or a URL is excluded. Request indexing for an important unindexed/repaired page only after the live test passes. Do not repeatedly request already-correct indexed pages or every alias. Submission does not guarantee indexing.
5. Inspect representative old-domain URLs in the legacy property; confirm Google sees the redirect and the intended new canonical. “Page with redirect” on an old URL is expected. A live test cannot establish Google's selected canonical; use indexed inspection data.
6. Check Page indexing, Crawl stats, Manual actions and Security issues on both properties. Track exclusions for the submitted sitemap separately from intentionally excluded redirects, previews and utility pages.
7. Export matched-date Web performance totals, page, query and query+page views from both properties. Track legacy impressions declining and canonical impressions increasing alongside **combined-domain** traffic retention, rather than declaring success from a legacy decline alone.
8. Export the complete historical URL and external Links inventories. Reconcile the reported 313 historical pages with the older local 140-URL inventory. Prioritize correcting controllable high-value backlinks to their exact new destination through the owner's existing accounts; no external edits or outreach were performed here.

Ledger columns: checkpoint, export timestamp, property, dates, data completeness, search type, country/device filters, clicks, impressions, CTR, position, query, page, Google canonical, index verdict, last crawl, referring sitemap, technical result, issue owner, action, next review. Keep exports dated and immutable; never overwrite one property's snapshot with another.

## F. D+7 procedure — 14 October

1. Establish a comparable pre-repair baseline: 30 September–6 October versus 7–13 October, both complete seven-day windows. If final data is delayed, wait or label the interim view provisional; never compare a partial week with a full week.
2. Use identical Web search, country and device settings for both properties and both windows. Start unfiltered, then examine Australia and mobile/desktop separately. Keep filters with every export.
3. Repeat section B's priority HTTP/indexability checks. Review all priority URL Inspection entries and submitted sitemap status. Reconcile Google crawl dates with D0; a pre-D0 crawl can explain stale information.
4. Compare old, new and combined clicks/impressions; calculate new-domain share = new / (old + new), with zero denominators recorded as unavailable. Calculate CTR from totals; never add CTR or average positions across properties.
5. Check cluster query-to-page distribution and the seven supplied ranking-transfer comparisons. Report movement direction; avoid conclusions from sparse query rows.

## G. D+14 procedure — 21 October

Compare 7–20 October with 23 September–6 October (14 versus 14 days). Also compare week two, 14–20 October, with week one, 7–13 October, to distinguish migration progress from the pre-repair period.

Reinspect pages still unindexed or selecting the old/wrong canonical after a post-D0 crawl. Review sitemap errors, server/crawl errors and persistent “Crawled — currently not indexed” or “Duplicate, Google chose different canonical” cases. Audit intent overlap from query+page exports before suggesting new content or consolidation. Review the piano and suburb guide-link opportunities below if those clusters still lag. Record backlink corrections only when actually completed.

## H. D+28 procedure — 4 November

Compare 7 October–3 November with 9 September–6 October (28 versus 28 days), and compare 21 October–3 November with 7–20 October for recent direction. Annotate the repair date and earlier migration milestone separately.

Evaluate combined traffic retention, new-domain share, priority-page indexing, selected canonical, cluster landing-page stability and observed enquiries where reliable existing analytics are available. No enquiry/analytics baseline was verified here. If recovery stalls, investigate historical URL/backlink coverage and useful content gaps first. Produce a ranked, evidence-backed next-change brief; do not recreate suburb pages or roll the domain back because rankings are lower.

## I. Warning thresholds

These are operational investigation triggers chosen for this report, **not Google guarantees or automatic rollback thresholds**.

| Signal | Trigger | Response |
| --- | --- | --- |
| Technical/indexability | Any priority unexpected 404/5xx, loop, wrong destination, legacy 200 duplicate, noindex/block, or conflicting canonical | Recheck with two GETs five minutes apart; inspect deployment and source immediately |
| Sitemap | Non-200/invalid XML or a submitted sitemap fetch error persisting 24 hours | Investigate endpoint and GSC last-read evidence; do not change domain redirects |
| Google canonical/indexing | Wrong canonical or exclusion persists after a post-repair crawl at D+14 | Inspect indexed/live differences, intent, links and historical mapping; escalate with URL evidence |
| Combined impressions | Down >25% in matched complete windows, with at least 100 baseline impressions; persists across two weekly reviews | Check filters, seasonality, query mix, crawl and indexing; review cluster breakdown |
| Combined clicks | Down >30%, with at least 20 baseline clicks, across two weekly reviews | Investigate alongside impressions and CTR; avoid percentage alarms on tiny counts |
| Priority cluster position | Worse by >10 positions with at least 100 comparable cluster impressions | Review exact-query/page/device/country mix and canonical before editing |
| Transfer stalls | At D+14 no increase in new-domain impression share versus week one; at D+28 still flat/falling across two weekly windows | Escalate a GSC/URL/backlink investigation; legacy decline alone is insufficient |

Query exports omit some queries; use property-level performance totals for domain totals. Combined metrics are a diagnostic, not a unique-user count. Low-volume clusters should be assessed over 28 days with absolute counts.

## J. Escalation and rollback policy

Capture exact source URL, UTC/AEDT observation time, status/location chain, response canonical/robots, deployed version and comparison against the working repair baseline before proposing a fix. Reproduce any critical defect before acting. A rank drop, GSC reporting lag or permanent extra hop is not a critical routing defect.

For a proven repository regression, propose the smallest reversible source fix, run the full gates below, commit only relevant files, and verify the live affected URLs after deployment. For a proven platform defect, provide evidence and obtain an explicitly scoped production instruction. Do not remove/disable/modify the existing legacy Project Domain redirect, change DNS/domain attachments, move domains between projects, add redirect middleware, replace routing architecture or mass rewrite `vercel.json`.

Any rollback must be limited to the change that introduced the proven defect and preserve the functioning migration and legacy redirect. Do not roll back to a pre-migration configuration. Recovery work has introduced no production content/configuration change requiring rollback.

## Internal authority findings and restrained opportunities

Generated-output audit covered all 80 unique HTML pages. Counts below are unique referring pages, excluding the destination itself and links inside header/nav/footer; body-wide shared sections remain included, so these are discoverability counts, not a PageRank estimate.

| Priority destination | Body referring pages | Existing support and gap |
| --- | ---: | --- |
| Office | 70 | Homepage, Adelaide/regional/interstate hubs and office checklist; ample support |
| Piano | 7 | Homepage, Adelaide/interstate hubs, furniture/house/office and Hyde Park; no guide referral |
| Prices | 64 | Adelaide hub, service/suburb pages and seven guide sources; ample support |
| Unley Park | 7 | Adelaide hub, furniture/house and nearby suburbs; no guide referral |
| Hyde Park | 7 | Adelaide hub, furniture/house and nearby suburbs; no guide referral |
| Sydney | 46 | Adelaide/interstate hubs, sibling routes and suburb pages; no guide referral |
| Brisbane | 46 | Adelaide/interstate hubs, sibling routes and suburb pages; no guide referral |
| Melbourne | 46 | Adelaide/interstate hubs, sibling routes and suburb pages; no guide referral |

All eight destinations are linked from the homepage when shared navigation is included. The effective services entry points are the existing homepage/service navigation and service pages; a separate services hub should not be invented. Regional and guide coverage is uneven, but none of these pages is orphaned.

Candidate improvements, subject to selecting a genuinely relevant passage:

- The furniture preparation guide's `zq-internal-links.mjs` profile contains two entries for the same furniture destination. Before adding another generic block, consider replacing the redundant entry with one piano-assessment link near heavy/special-item planning. Confirm actual rendered deduplication and preserve the furniture primary link.
- If a furniture/home-access guide discusses inner-south character homes, add one contextual Hyde Park or Unley Park example there, rather than adding both suburbs to every guide. Their nearby-suburb support already exists.
- Where an existing interstate planning passage discusses destination access, link to the appropriate Sydney/Melbourne/Brisbane route. Their current hub and sibling coverage does not justify a sitewide three-route insertion.

These are narrower recovery opportunities, not proven causes of ranking loss. No source links were changed during this recon/report pass; preserving a clean measurement baseline is preferable to speculative broad link additions.

## Content parity findings

Historical reference: repository source immediately before `8fcc6c5` (canonical-host migration), compared with current HEAD. This is available historical source, not a complete capture of every old production page. Review included `zq-services.mjs`, `seo-v4.mjs` and the Sydney/Melbourne/Brisbane content partials. Unley Park, Hyde Park and prices are generated; their relevant history is in the registry, not standalone old content files.

- Piano retains instrument dimensions, access photos, stairs/turns/surfaces, quote assessment and post-move technician advice. Removed promises about dedicated ramps/trolleys, equipment, acceptance of particular instruments, fixed crew sizes, fixed pricing and a universal tuning timetable are not safe restoration candidates. Potential opportunity: clarify storage-transfer or larger interstate-move enquiry needs only after the owner confirms current capability; report before changing copy.
- Sydney and Melbourne partial changes primarily replace unverified fixed-price promises with assessed quote wording; Brisbane similarly removes a fixed-price claim. Useful route, inventory and access preparation survives. No proven useful route-content loss requires restoration.
- Hyde Park and Unley Park now have differentiated access/inventory planning, accurate suburb separation, FAQs and nearby links. Historical fixed-price language was deliberately replaced; do not restore it. Existing locality differentiation should be retained.
- Prices retains published rates and factors affecting the total. Historical guaranteed/fixed-price positioning is not evidence of useful lost content. Preserve current rates and business facts.

No large copy change is justified. Obtain the complete old-page/archive inventory before making a stronger claim of exhaustive parity.

## Validation and reproduction

Run from the actual checkout `C:\Users\abuba\zq`, using Windows Node 22:

```powershell
Set-Location 'C:\Users\abuba\zq'
npm.cmd test
npm.cmd run build
npm.cmd run seo:validate
git diff --check
git ls-remote origin refs/heads/main
npx.cmd --no-install vercel inspect https://zqremovalsadelaide.com.au
# Optional full read-only HTTP recrawl; writes a new local artifact, preserves the old audit:
node.exe scripts/audit-domain-migration.mjs --output "$env:TEMP\zq-post-migration-recrawl.json"
```

The full test suite includes the focused Search Console, conversion and E-E-A-T regressions. The crawler's report-generation exit status alone is not a pass: inspect `summary`, final destinations and failures, separating allowed permanent normalization chains from critical defects. No customer form submission is needed.

Current-run validation completed successfully under Windows Node 22:

- `npm.cmd test`: 190 tests passed, zero failures, zero skipped, plus quote API smoke checks passed.
- `npm.cmd run build`: passed.
- `npm.cmd run seo:validate`: passed for 109 pages; zero bad pages; 80 sitemap page URLs (5 core, 16 service, 48 suburb, 11 guide), 80 image page entries, 28 redirect exclusions and one noindex exclusion.
- `git diff --check`: passed.

The initial delivery was documentation-only, committed locally as `62ed67ad3d8ba2d602fc69db0cb27476fa317688`. The subsequent authentication investigation and authorized documentation push are recorded below. No source/generator, page content, business facts, redirects, DNS or Vercel domain settings were changed. Existing unrelated asset/document deletions and untracked files were preserved. No manual production deployment is required for these reports; pushing main may still trigger the existing Git-integrated Vercel build. Search Console actions remain pending regardless of local test results.

## Verified GSC authentication investigation — 7 October 2026

Checked at **2026-10-06 13:50:55 UTC / 2026-10-07 00:50:55 AEDT**. Authentication was not repaired and no new authorization was completed.

- `.gsc-token.json` exists with an access token, a refresh token, Bearer token type and exactly `https://www.googleapis.com/auth/webmasters.readonly`.
- Its recorded access-token expiry is **10 May 2026 18:41:38 UTC**. The client library attempts refresh automatically, but an explicit refresh failed with **HTTP 401 / `deleted_client`**.
- The configured OAuth client is an installed/Desktop client. Client ID and secret fields exist; authorization/token endpoints are Google endpoints. Its configured redirect is `http://localhost`, without a callback port.
- `sites.list` and individual read-only Search Analytics queries for **both** `sc-domain:zqremovalsadelaide.com.au` and `sc-domain:zqremovals.au` failed with the same **401 / `deleted_client`**. This establishes a client-level blocker, not a proven property-permission problem.
- Current Google account identity, property permissions, API enablement and consent-screen publishing status cannot be verified through this failed grant. The deletion date and whether deletion was manual or automatic are unknown. No credentials or tokens were displayed, rewritten or committed.

Google's [OAuth client management guidance](https://support.google.com/cloud/answer/15549257?hl=en) confirms that deleted clients cannot authorize or use associated tokens. Restore the existing client from Google Cloud's Deleted Credentials screen if recoverable; otherwise create a Desktop OAuth client in the intended project and save its downloaded JSON locally to `C:\Users\abuba\zq\secrets\gsc-oauth-client.json`. Confirm Search Console API enablement and use an account with access to both properties. Do not supply credentials in chat.

Then run the existing workflow in PowerShell:

```powershell
Set-Location 'C:\Users\abuba\zq'
$env:GSC_WRITE_SCOPE = '0'
Remove-Item Env:GSC_AUTH_PRINT_ONLY -ErrorAction SilentlyContinue
npm.cmd run gsc:auth
```

Approve only Search Console read-only access. With the current portless `http://localhost` redirect, the script prints an authorization URL and waits for a code; it does not automatically open the browser in that branch. Open the printed URL manually, approve access, then copy the `code` value from the redirected browser address into the waiting PowerShell terminal. A localhost connection error after consent does not itself invalidate the returned code. If replacement credentials configure a supported loopback port, the script captures the callback automatically. Do not paste authorization codes or tokens into chat. Client restoration/replacement and browser consent require user interaction; dependent data collection is stopped at this boundary.

### Fresh-data status

| Window | Old-domain clicks/impressions/CTR/position | New-domain clicks/impressions/CTR/position | Combined clicks/impressions/CTR | Previous equivalent period |
| --- | --- | --- | --- | --- |
| Last 7 complete days | NOT RETRIEVED | NOT RETRIEVED | NOT RETRIEVED | NOT RETRIEVED |
| Last 14 complete days | NOT RETRIEVED | NOT RETRIEVED | NOT RETRIEVED | NOT RETRIEVED |
| Last 28 complete days | NOT RETRIEVED | NOT RETRIEVED | NOT RETRIEVED | NOT RETRIEVED |

**Data freshness cutoff: unverified. Migration trend: insufficient data.** Every priority URL in section C and every priority query in section D is **INSUFFICIENT DATA** for this attempted refresh; metrics are unavailable, not zero. No page-one or striking-distance opportunity can be established from fresh evidence yet. Historical baselines above remain intact.

Canonical sitemap submission/read dates, warnings, errors and discovered URL counts: **NOT VERIFIED through the API**. No sitemap was submitted and no write scope requested. The seven requested new-domain URL Inspection results (home, piano, office, Hyde Park, Unley Park, Sydney, Brisbane) were not retrieved; indexing verdict, coverage, Google/user canonical, crawl time, robots state and referring sitemap remain unverified.

**Change of Address: MANUAL SEARCH CONSOLE UI CHECK REQUIRED.** The documented [Search Console API services](https://developers.google.com/webmaster-tools/v1/api_reference_index) cover Search Analytics, Sites, Sitemaps and URL Inspection, not Change of Address. No authenticated browser automation was used.

### Tooling findings for the next authenticated pass

All four existing GSC scripts and `package.json` were inspected. The existing fetcher includes today's date in its requested 28-day window, resolves one property, exports into one shared directory and lacks daily/device/country reports and 7/14-day comparisons. Running it sequentially for old/new would overwrite the shared exports. The opportunities script expects those shared files and makes heuristic recommendations; it must not be treated as evidence to change production SEO.

Do not run the unchanged fetcher for the pair comparison. After authentication succeeds, use isolated `data/gsc/zq-new/` and `data/gsc/zq-old/` exports, explicitly exclude incomplete days, use `dataState: final`, and query property-level totals separately from dimension rows. Discover a common finalized cutoff before defining equal-length windows; Search Analytics dates use Pacific time. Retrieve daily, query, page, query+page, device and country views; compute combined CTR from summed clicks/impressions, not averaged property CTRs. Query/page exports are top-row datasets and may omit anonymized queries, so they cannot replace property totals. [Search Analytics query reference](https://developers.google.com/webmaster-tools/v1/searchanalytics/query).

The existing ignore rule `data/gsc/*.raw.json` does not establish protection for arbitrary nested exports. Before saving new exports, ensure those exact local export directories are ignored without changing or overwriting historical files. No fresh exports were written in this blocked pass. No GSC tooling source changes were made; only this report was updated.

The original documentation commit and this verified-blocker report update are approved for a normal push to main after fetching and checking the remote frontier. No force push or unrelated staging is permitted. Website validation results above belong to the prior recovery pass; this report-only update requires `git diff --check`, not another site build.

## Google reference guidance

Monitor both domains during the move and retain the working permanent redirects. Google's [site-move guidance](https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes) explains per-URL processing and expected ranking fluctuations.

Check an existing move through the [Change of Address tool](https://support.google.com/webmasters/answer/9370220?hl=en). Use the [Sitemaps report](https://support.google.com/webmasters/answer/7451001?hl=en) for submission/read status and [URL Inspection](https://support.google.com/webmasters/answer/9012289?hl=en) for indexed canonical evidence and selective indexing requests.

## Supplied CSV evidence — analysed 7 October 2026

Source directory: `C:\Users\abuba\Desktop\ZQ-GSC-Data-2026-10-07`. All 13 supplied CSVs were read; originals remain unchanged outside the repository. No raw export or credential was committed. This section supplements the earlier blocked-API record and preserves historical baselines.

### Provenance, access and cutoff

`search-console-properties.csv` lists both exact domain properties with `siteOwner`. This establishes permission as represented in the supplied export, not the Google account identity or live access through the repository OAuth client. A fresh repository-client diagnostic at 6 October 2026 14:03:39 UTC / 7 October 01:03:39 AEDT still returned **401 / deleted_client** for refresh, Sites listing and both property queries. Authentication date and exporter identity are not supplied.

Latest supplied daily date: **3 October 2026**. Old-domain daily range: 14 September 2025–3 October 2026, 385 rows. New-domain range: 30 August–3 October 2026, 35 rows. Both ranges are continuous without duplicate dates. CSVs contain no search-type/filter/dataState/fetch-time metadata; finalized API status and identical report settings are not independently proven. Comparisons below use fully populated calendar windows in these exports, exclude newer absent days, and assume matching settings. The directory date is not the reporting cutoff.

All performance observations precede the **7 October repair** and the 4 October office/Hyde Park work. They cannot assess those changes. Page/query/query+page/device/country snapshots contain no date columns and cannot establish period-specific movement.

### Daily-data 7/14/28-day baselines

Cells show **clicks / impressions / CTR / average position**. Previous and latest windows have equal calendar lengths; incomplete coverage is explicitly marked. CTR is calculated from totals. Average position is reconstructed using daily impression weights; no combined average position is used.

#### 7-day window

| Property | Previous window | Latest window | Click change | Impression change |
| --- | --- | --- | --- | --- |
| Old | 8 / 868 / 0.922% / 14.07 | 3 / 468 / 0.641% / 13.28 | -62.5% | -46.1% |
| New | 3 / 763 / 0.393% / 26.75 | 2 / 741 / 0.270% / 31.39 | -33.3% | -2.9% |
| Combined | 11 / 1,631 / 0.674% | 5 / 1,209 / 0.414% | -54.5% | -25.9% |

Previous dates: 2026-09-20–2026-09-26. Latest dates: 2026-09-27–2026-10-03.
New-domain impression share: **46.8% → 61.3%** (+14.5 percentage points).

#### 14-day window

| Property | Previous window | Latest window | Click change | Impression change |
| --- | --- | --- | --- | --- |
| Old | 7 / 2,384 / 0.294% / 18.46 | 11 / 1,336 / 0.823% / 13.79 | +57.1% | -44.0% |
| New | 7 / 1,641 / 0.427% / 44.87 | 5 / 1,504 / 0.332% / 29.03 | -28.6% | -8.3% |
| Combined | 14 / 4,025 / 0.348% | 16 / 2,840 / 0.563% | +14.3% | -29.4% |

Previous dates: 2026-09-06–2026-09-19. Latest dates: 2026-09-20–2026-10-03.
New-domain impression share: **40.8% → 53.0%** (+12.2 percentage points).

#### 28-day window

| Property | Previous window | Latest window | Click change | Impression change |
| --- | --- | --- | --- | --- |
| Old | 66 / 9,107 / 0.725% / 22.85 | 18 / 3,720 / 0.484% / 16.78 | -72.7% | -59.2% |
| New | 10 / 549 / 1.821% / 61.07 **PARTIAL: 7/28 days** | 12 / 3,145 / 0.382% / 37.30 | Not comparable | Not comparable |
| Combined | 76 / 9,656 / 0.787% **PARTIAL new-domain coverage** | 30 / 6,865 / 0.437% | Not comparable | Not comparable |

Previous dates: 2026-08-09–2026-09-05. Latest dates: 2026-09-06–2026-10-03.
Previous new-domain export covers only 30 August–5 September; 9–29 August is absent. Do not assume these absent days are zero or claim a comparable 28-day new/combined decline. The latest 28-day totals and old-domain comparison are usable on their own.

**Interpretation:** visibility is shifting toward the new domain, but total visibility is not fully retained in the supplied seven- and fourteen-day windows. Seven-day combined impressions fell 25.9% and clicks fell from 11 to 5; fourteen-day impressions fell 29.4% while clicks rose from 14 to 16. Small click counts do not meet the report's 20-click baseline warning threshold. The two overlapping impression comparisons are not two independent weekly reviews, and the report's warning does not justify a rollback. Observe post-repair weeks before attributing loss or proposing site changes.

### Priority page snapshots

Exact apex URLs only; historical aliases/www variants are not silently merged. Cells show **clicks / impressions / CTR / position**. Export date ranges are unspecified; old/new cumulative figures are not equal-period recovery measurements. All formal temporal classifications remain **INSUFFICIENT DATA**.

| Path | Old snapshot | New snapshot | Recovery classification |
| --- | --- | --- | --- |
| `/` | 217 / 6,235 / 3.480% / 21.12 | 17 / 469 / 3.625% / 10.34 | INSUFFICIENT DATA |
| `/office-removals-adelaide/` | 1 / 2,550 / 0.039% / 36.84 | 0 / 384 / 0.000% / 38.58 | INSUFFICIENT DATA |
| `/services/piano-movers-adelaide/` | 3 / 2,344 / 0.128% / 28.86 | 0 / 522 / 0.000% / 77.27 | INSUFFICIENT DATA |
| `/removalists-adelaide-prices/` | 2 / 1,752 / 0.114% / 15.89 | 1 / 409 / 0.244% / 32.33 | INSUFFICIENT DATA |
| `/removalists-unley-park/` | 0 / 804 / 0.000% / 8.40 | 0 / 199 / 0.000% / 20.19 | INSUFFICIENT DATA |
| `/removalists-hyde-park/` | 0 / 702 / 0.000% / 9.31 | 0 / 367 / 0.000% / 15.53 | INSUFFICIENT DATA |
| `/adelaide-to-sydney-removalists/` | 0 / 1,284 / 0.000% / 34.69 | 0 / 119 / 0.000% / 81.09 | INSUFFICIENT DATA |
| `/adelaide-to-brisbane-removals/` | 0 / 1,784 / 0.000% / 32.67 | 0 / 92 / 0.000% / 86.95 | INSUFFICIENT DATA |
| `/adelaide-to-melbourne-removalists/` | 0 / 610 / 0.000% / 35.97 | 0 / 54 / 0.000% / 82.30 | INSUFFICIENT DATA |

The homepage has a favorable new-domain snapshot position (~10.34 versus old ~21.12), but this alone does not prove transfer. Piano, Sydney, Brisbane and Melbourne remain deep in the new-domain snapshot; Unley Park is around 20 and Hyde Park around 15.5. Do not classify these as stalled/declining without matched page periods and post-repair inspection.

### Priority query snapshots

Cells show **clicks / impressions / position**. The impression-sum column adds exported old/new impressions as a snapshot inventory only, **not matched-period total visibility**. Movement direction over time is unavailable for every query.

| Query | Old snapshot | New snapshot | Exported impression sum | New versus old average position (not temporal trend) |
| --- | --- | --- | ---: | --- |
| office removalists adelaide | 1 / 267 / 17.82 | 0 / 83 / 6.47 | 350 | Lower (better); temporal trend unknown |
| removalists adelaide | 3 / 215 / 15.65 | 0 / 25 / 10.20 | 240 | Lower (better); temporal trend unknown |
| removalists hyde park | 0 / 289 / 17.01 | 0 / 60 / 11.70 | 349 | Lower (better); temporal trend unknown |
| hyde park removalists | 0 / 196 / 10.65 | 0 / 74 / 13.12 | 270 | Higher (worse); temporal trend unknown |
| local removalist hyde park | 0 / 290 / 15.21 | 0 / 57 / 11.75 | 347 | Lower (better); temporal trend unknown |
| removalists unley park | 0 / 405 / 13.71 | 0 / 44 / 21.59 | 449 | Higher (worse); temporal trend unknown |
| piano movers adelaide | 0 / 274 / 23.17 | 0 / 64 / 82.03 | 338 | Higher (worse); temporal trend unknown |
| piano removalists adelaide | 0 / 326 / 23.49 | 0 / 71 / 83.90 | 397 | Higher (worse); temporal trend unknown |
| removalists adelaide prices | 0 / 573 / 22.02 | 0 / 79 / 28.30 | 652 | Higher (worse); temporal trend unknown |
| adelaide to sydney removalists | 0 / 528 / 30.63 | 0 / 25 / 80.24 | 553 | Higher (worse); temporal trend unknown |
| adelaide to brisbane removalists | 0 / 409 / 30.76 | 0 / 7 / 83.00 | 416 | Higher (worse); temporal trend unknown |
| adelaide to melbourne removalists | 0 / 235 / 33.53 | 0 / 12 / 89.50 | 247 | Higher (worse); temporal trend unknown |

### Query-to-page evidence and opportunity queue

- **Office:** new query snapshot average position 6.47, 83 impressions, zero clicks. Query+page places 77 impressions at position 6.90 on the intended office page and six at position 1 on the homepage. Most visibility is associated with the right page in this snapshot. Confirm that assignment after the 4 October office-intent change and 7 October repair before considering a CTR experiment.

- **Generic Adelaide:** all 25 new-domain query+page impressions for `removalists adelaide` are assigned to the homepage at position 10.20; no intended `/removalists-adelaide/` row is present for that query. Absence is not proof of zero exposure beyond the returned dataset. Monitor homepage/hub assignment in matched recent query+page exports; do not change canonicals or copy from this snapshot.

- **Hyde Park:** `removalists hyde park` associates all 60 new impressions with the intended suburb page at 11.70. Other priority variants average 11.75 and 13.12. These are the clearest near-page-one monitoring candidates, with low volume and no clicks. Assess post-4-October data before recommending further changes.

- **Unley Park:** priority query position 21.59; page-wide position 20.19. Watch as a secondary opportunity, not a verified page-one candidate.

- **Piano and interstate routes:** prioritize Google-selected canonical, last crawl and matched-window recovery evidence. Their current supplied snapshot query positions are ~80–90; there is no basis for redirect experimentation or new competing pages.

Average positions are aggregates, not exact live rankings; page-one/striking-distance labels here are candidate monitoring bands, not confirmed current SERP positions.

### Device/country snapshots and reconciliation

| Dataset | Old clicks / impressions | New clicks / impressions |
| --- | --- | --- |
| daily | 308 / 41,677 | 22 / 3,694 |
| devices | 308 / 41,677 | 22 / 3,694 |
| countries | 308 / 41,677 | 22 / 3,694 |
| pages | 314 / 50,181 | 22 / 4,014 |
| queries | 93 / 32,393 | 12 / 3,150 |
| query-page | 94 / 37,212 | 12 / 3,293 |

Daily, country and device sums reconcile exactly for each property. Page-level aggregation differs from property-level totals; query datasets can exclude anonymized/omitted queries. Because snapshot date/filter metadata is absent, do not assume every difference is explained solely by aggregation or corruption. Use daily totals for the pair comparison, not sums of page/query rows. These figures also differ from the owner-supplied historical baselines (old 41,741 versus supplied daily 41,677 impressions; new 3,923 versus 3,694), so both records are retained with separate provenance. New query export contains 318 rows, not the historical 331.

| Device | Old clicks / impressions / CTR / position | New clicks / impressions / CTR / position |
| --- | --- | --- |
| MOBILE | 203 / 14,563 / 1.394% / 18.14 | 18 / 1,305 / 1.379% / 32.29 |
| DESKTOP | 100 / 26,943 / 0.371% / 26.70 | 4 / 2,360 / 0.169% / 45.61 |
| TABLET | 5 / 171 / 2.924% / 22.95 | 0 / 29 / 0.000% / 35.90 |

| Country | Old clicks / impressions / CTR / position | New clicks / impressions / CTR / position |
| --- | --- | --- |
| Australia (`aus`) | 302 / 39,077 / 0.773% / 24.15 | 20 / 3,615 / 0.553% / 41.27 |

Device/country files are cumulative snapshots, not date-segmented comparisons. Mobile versus desktop CTR can reflect query/position mix and does not establish a UX defect.

### Still unresolved and next data request

Sitemap status and all seven URL Inspection results remain API-unverified: these CSVs contain no sitemap or inspection evidence. No sitemap submission, indexing request or browser automation was performed. **Change of Address: MANUAL SEARCH CONSOLE UI CHECK REQUIRED.** The property listing does not verify Change of Address.

Next: restore/re-authorize the repository client, or supply an export manifest (property, search type, filters, requested start/end, export timestamp, finalized-data setting) and date-bounded page/query/query+page/device/country exports for each current/previous 7/14/28-day window. For the prior 28-day new-domain window, provide explicit coverage or exporter confirmation of zero activity before 30 August. Obtain post-7-October performance and the priority URL Inspection/sitemap results before recommending website changes.

No website source/configuration or business data was changed. This report update is documentation-only; raw files remain on Desktop. `git diff --check` is the relevant check; prior 190-test/build/SEO results were not rerun or presented as new validation.
