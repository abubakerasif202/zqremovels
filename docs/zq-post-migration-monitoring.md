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

Delivery is documentation-only, committed locally without pushing or triggering deployment. No source/generator, page content, business facts, redirects, DNS or Vercel domain settings were changed. Existing unrelated asset/document deletions and untracked files were preserved. Production remains the verified repair release in section B. There is no new site deployment requiring post-deployment verification; live recon verified the existing release. Search Console actions remain pending regardless of local test results.

## Google reference guidance

Monitor both domains during the move and retain the working permanent redirects. Google's [site-move guidance](https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes) explains per-URL processing and expected ranking fluctuations.

Check an existing move through the [Change of Address tool](https://support.google.com/webmasters/answer/9370220?hl=en). Use the [Sitemaps report](https://support.google.com/webmasters/answer/7451001?hl=en) for submission/read status and [URL Inspection](https://support.google.com/webmasters/answer/9012289?hl=en) for indexed canonical evidence and selective indexing requests.
