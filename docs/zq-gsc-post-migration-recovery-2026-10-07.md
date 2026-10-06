# Executive summary

Prepared 7 October 2026. Read-only forensics preceded the one source change. Source: the 13 CSVs under `C:\Users\abuba\Desktop\ZQ-GSC-Data-2026-10-07`; a Desktop/Downloads filename search found no newer daily export. Raw exports remain untouched and uncommitted. Initial local/remote main: `a6226ec9c248258be5dd053800badb450299d5d5`. The migration repair is `0742363`; intervening commits are documentation-only. Production recon found a Ready deployment and healthy priority routing.

**Diagnosis:** visibility is moving to the new domain, while aggregate impressions have not been retained. The data ends 3 October, before the 4 October office/Hyde Park changes and 7 October repair. It cannot establish a post-repair trend or explain Google-selected canonicals. Snapshot losses do not prove an active technical defect. Wait for post-repair processing and matched recent exports before broad edits. One narrow, natural guide-to-piano link is justified by a directly observed guide referral gap; no ranking improvement is promised.

All figures below are calculated from the CSVs; displayed CTR/positions are rounded, not estimates. Daily ranges are continuous. Nondaily CSVs omit requested date ranges, search type, filters and final-data metadata, so old/new page/query comparisons are **snapshots, not measured temporal ranking changes**. The property export lists both domain properties as `siteOwner`; repository OAuth remained blocked with `deleted_client` in the preceding verified diagnostic. No fresh authentication or GSC manual action is claimed.

# Migration visibility comparison

First returned new-domain daily observation: **30 August 2026**, three clicks and 12 impressions. This is observed visibility onset, not the exact migration deployment or Change of Address date. Pre-onset window: **26 July–29 August** (35 days). Post-onset window: **30 August–3 October** (35 days). New-domain data before onset is absent; the pre-period benchmark below is the observed legacy total, not independently verified zero activity on the new domain.

| Period | Clicks | Impressions | CTR | Reconstructed impression-weighted position |
| --- | ---: | ---: | ---: | ---: |
| Legacy before onset | 87 | 11,989 | 0.7257% | 22.3013 |
| Old + new after onset | 43 | 9,549 | 0.4503% | 27.8174 |

Clicks: -50.5747%; impressions: -20.3520%; CTR relative change: -37.9454%; reconstructed position difference: +5.5161. Combining property positions is a diagnostic reconstruction, not a native combined GSC rank; URL/query mix changes limit interpretation.

# Old vs new domain traffic

| Post-onset property | Clicks / impressions / CTR / position |
| --- | --- |
| zqremovals.au | 21 / 5,855 / 0.3587% / 19.6082 |
| zqremovalsadelaide.com.au | 22 / 3,694 / 0.5956% / 40.8289 |

The legacy domain still contributes 21/43 post-onset clicks (48.84%) and 5,855/9,549 impressions (61.32%). That is material residual visibility, not proof the permanent redirects fail.

| Week | Old clicks / impressions | New clicks / impressions | Combined clicks / impressions | New impression share |
| --- | --- | --- | --- | ---: |
| 2026-08-30–2026-09-05 | 3 / 2,135 | 10 / 549 | 13 / 2,684 | 20.45% |
| 2026-09-06–2026-09-12 | 3 / 1,363 | 3 / 770 | 6 / 2,133 | 36.10% |
| 2026-09-13–2026-09-19 | 4 / 1,021 | 4 / 871 | 8 / 1,892 | 46.04% |
| 2026-09-20–2026-09-26 | 8 / 868 | 3 / 763 | 11 / 1,631 | 46.78% |
| 2026-09-27–2026-10-03 | 3 / 468 | 2 / 741 | 5 / 1,209 | 61.29% |

First daily new>old impression crossover: **11 September**; it was intermittent. The new domain exceeded old impressions on every returned day **28 September–3 October**. First full onset-aligned weekly majority: **27 September–3 October**. This is an impression crossover, not an exact ranking/click/canonical handoff. Old weekly impressions decline monotonically; new impressions rise initially then fall from 871 to 763 to 741. Combined weekly impressions decline throughout, 2,684 → 2,133 → 1,892 → 1,631 → 1,209. Total visibility is not recovering in this pre-repair sample.

The latest seven-day combined impression change is -25.9% (1,631 → 1,209); fourteen-day change is -29.4% (4,025 → 2,840). Full window tables are preserved in `zq-post-migration-monitoring.md`. Prior 28-day new-domain coverage contains only seven returned dates and must not be assumed zero for the missing 21 days.

# Query transfer analysis

Winning URL = highest returned **query+page impressions**, ties broken by clicks then lower position. This differs from picking the best-ranked URL or using query-wide averages. Paths are relative to the old/new hosts respectively. Cells show position / impressions / clicks. Position delta = new minus old; negative is a favorable snapshot difference. CTR delta is percentage points. Different/unknown snapshot periods prohibit causal handoff claims.

| Query | Old winning path | Old P / I / C | New winning path | New P / I / C | Position delta | CTR delta (pp) | Intent match / recommended action |
| --- | --- | --- | --- | --- | ---: | ---: | --- |
| office removalists adelaide | `/office-removals-adelaide/` | 14.5276 / 199 / 1 | `/office-removals-adelaide/` | 6.8961 / 77 / 0 | -7.6315 | -0.5025 | Office owner correct; observe current snippet before CTR experiment |
| removalists adelaide | `/` | 16.1550 / 129 / 3 | `/` | 10.2000 / 25 / 0 | -5.9550 | -2.3256 | Homepage returned; monitor Adelaide commercial hub ownership |
| removalists hyde park | `/removalists-hyde-park/` | 13.2609 / 115 / 0 | `/removalists-hyde-park/` | 11.7000 / 60 / 0 | -1.5609 | +0.0000 | Relevant owner; inspect and monitor, no broad rewrite |
| hyde park removalists | `/removalists-hyde-park/` | 7.6846 / 130 / 0 | `/removalists-hyde-park/` | 13.1216 / 74 / 0 | +5.4370 | +0.0000 | Relevant owner; inspect and monitor, no broad rewrite |
| local removalist hyde park | `/removalists-hyde-park/` | 11.3462 / 104 / 0 | `/removalists-hyde-park/` | 11.7544 / 57 / 0 | +0.4082 | +0.0000 | Relevant owner; inspect and monitor, no broad rewrite |
| removalists unley park | `/removalists-unley/` | 12.2837 / 208 / 0 | `/removalists-unley-park/` | 20.8571 / 35 / 0 | +8.5735 | +0.0000 | Old Unley winner differs; new Unley Park owner more precise |
| piano movers adelaide | `/services/piano-movers-adelaide/` | 23.1679 / 274 / 0 | `/services/piano-movers-adelaide/` | 82.0312 / 64 / 0 | +58.8634 | +0.0000 | Relevant owner; inspect and monitor, no broad rewrite |
| piano removalists adelaide | `/services/piano-movers-adelaide/` | 23.4939 / 326 / 0 | `/services/piano-movers-adelaide/` | 83.9014 / 71 / 0 | +60.4075 | +0.0000 | Relevant owner; inspect and monitor, no broad rewrite |
| removalists adelaide prices | `/adelaide-moving-guides/removalists-cost-adelaide/` | 21.8905 / 347 / 0 | `/removalists-adelaide-prices/` | 30.0649 / 77 / 0 | +8.1744 | +0.0000 | New commercial owner receives most page impressions; retain cost guide |
| adelaide to sydney removalists | `/adelaide-to-sydney-removalists/` | 30.5326 / 522 / 0 | `/adelaide-to-sydney-removalists/` | 80.2400 / 25 / 0 | +49.7074 | +0.0000 | Relevant owner; inspect and monitor, no broad rewrite |
| adelaide to brisbane removalists | `/adelaide-to-brisbane-removals/` | 26.6551 / 374 / 0 | `/adelaide-to-brisbane-removals/` | 83.0000 / 7 / 0 | +56.3449 | +0.0000 | Relevant owner; inspect and monitor, no broad rewrite |
| adelaide to melbourne removalists | `/adelaide-to-melbourne-removalists/` | 33.0893 / 224 / 0 | `/adelaide-to-melbourne-removalists/` | 89.5000 / 12 / 0 | +56.4107 | +0.0000 | Relevant owner; inspect and monitor, no broad rewrite |
| zq removals | `/removalists-adelaide-prices/` | 2.7500 / 180 / 1 | `/` | 1.6471 / 51 / 8 | -1.1029 | +15.1307 | Homepage brand owner correct; secondary rates result is expected |

The Unley Park query does not show a like-for-like old winner: old `/removalists-unley/` had 208 impressions; the new specific Unley Park page has 35. This is reason to preserve the separate suburb intent, not to duplicate pages. Branded query old winner by impressions is the prices page, although homepage has more clicks; do not mistake the selected metric for business preference.

# Page transfer analysis

Exact apex canonical paths only. Old aliases are reported separately where material, not silently combined. Snapshot cells show clicks / impressions / CTR / position. All page trend classifications remain **INSUFFICIENT DATA** because weekly page/query rows are absent.

| Page | Old snapshot | New snapshot | Position difference |
| --- | --- | --- | ---: |
| `/` | 217 / 6,235 / 3.4804% / 21.1196 | 17 / 469 / 3.6247% / 10.3433 | -10.7764 |
| `/office-removals-adelaide/` | 1 / 2,550 / 0.0392% / 36.8388 | 0 / 384 / 0.0000% / 38.5833 | +1.7445 |
| `/services/piano-movers-adelaide/` | 3 / 2,344 / 0.1280% / 28.8626 | 0 / 522 / 0.0000% / 77.2682 | +48.4056 |
| `/removalists-adelaide-prices/` | 2 / 1,752 / 0.1142% / 15.8876 | 1 / 409 / 0.2445% / 32.3325 | +16.4450 |
| `/removalists-hyde-park/` | 0 / 702 / 0.0000% / 9.3077 | 0 / 367 / 0.0000% / 15.5286 | +6.2209 |
| `/removalists-unley-park/` | 0 / 804 / 0.0000% / 8.4005 | 0 / 199 / 0.0000% / 20.1859 | +11.7854 |
| `/adelaide-to-sydney-removalists/` | 0 / 1,284 / 0.0000% / 34.6947 | 0 / 119 / 0.0000% / 81.0924 | +46.3977 |
| `/adelaide-to-melbourne-removalists/` | 0 / 610 / 0.0000% / 35.9721 | 0 / 54 / 0.0000% / 82.2963 | +46.3242 |
| `/adelaide-to-brisbane-removals/` | 0 / 1,784 / 0.0000% / 32.6676 | 0 / 92 / 0.0000% / 86.9457 | +54.2781 |

# Striking-distance queries

New-domain query snapshots with at least 20 returned impressions and average position 4–20. Bands are monitoring candidates, not exact current SERP ranks.

| Query | Impressions | Clicks | Average position |
| --- | ---: | ---: | ---: |
| office removalists adelaide | 83 | 0 | 6.4699 |
| hyde park removalists | 74 | 0 | 13.1216 |
| removalists hyde park | 60 | 0 | 11.7000 |
| hyde park removalist | 58 | 0 | 12.3621 |
| local removalist hyde park | 57 | 0 | 11.7544 |
| removalist hyde park | 55 | 0 | 11.6727 |
| local removalists hyde park | 47 | 0 | 16.0638 |
| removals prices | 43 | 0 | 15.6744 |
| removalists adelaide | 25 | 0 | 10.2000 |

Hyde Park cluster (all returned query rows containing `hyde park`): **351 impressions, zero clicks, weighted position 12.6980**. This is a cumulative snapshot, not a weekly trend. There is no date+query+page export from which to establish Hyde Park/Unley Park weekly ranking direction.

# CTR opportunities

**Office:** query-wide 83 impressions, zero clicks, position 6.4699. Intended office page owns 77 at 6.8961; homepage has only six at position 1. Current title is “Office Removalists Adelaide | Business Moves | ZQ Removals”; description explicitly addresses offices, clinics, studios, lifts, IT and restart order. H1 is “Office Removalists Adelaide: Office, Clinic & Studio Moves”. First 200 visible words give access, inventory, equipment and handover detail. Supporting headings cover office size, briefing, timing and restarts. Valid visible Service/FAQ/Breadcrumb schema and strong links are already present. No invented case studies or proof claims were added. The source was deliberately improved 4 October, after the export cutoff. **No metadata/copy change is justified now.**

**Hyde Park:** title already uses the suburb/local moving intent and the published rate; description names houses/units/furniture and travel qualifications. Recent dedicated access, villa/bungalow and nearby-suburb content must be given time. Generic Adelaide query currently associates with the homepage in the snapshot; use matched recent query+page rows to test whether commercial-hub ownership improves before another intervention.

# Ranking-loss outliers

The largest snapshot page differences are Brisbane (+54.2781 positions), piano (+48.4056), Sydney (+46.3977) and Melbourne (+46.3242). Exact values in the page table are authoritative if rounded figures differ. These are unequal-period aggregate differences, not a proven post-repair loss. Favorable snapshot gains include homepage (~10.8 positions), office query (~11.4 query-wide positions) and better brand homepage assignment. No genuine week-by-week page gains/losses can be claimed.

**Piano diagnosis:** old and new query winners use the same `/services/piano-movers-adelaide/` path; both priority piano queries have zero snapshot clicks, with new positions 82.0313 and 83.9014. Canonical/redirect/indexability are correct, and current visible content has instrument type, dimensions, route-to-room access, stairs/turns/surfaces, pickup/delivery and acceptance review. No alternate indexable piano URL appears in the current sitemap. Furniture and bulky-item pages do not receive the priority piano query rows. Google-selected canonical/last crawl are unavailable. Weak relative contextual support is demonstrated, but the cause of ranking loss cannot be isolated from the CSVs. Implement one relevant guide referral, then monitor indexing and query ownership.

# Cannibalisation findings

A candidate requires multiple currently indexable destinations, meaningful exposure and real intent overlap. Static snapshots cannot demonstrate unstable daily ownership. No confirmed harmful new-domain cannibalisation meets all required criteria.

| Query | Page A: impressions / position | Page B: impressions / position | Diagnosis / owner |
| --- | --- | --- | --- |
| removalists adelaide prices | Prices: 77 / 30.0649 | Cost guide: 9 / 13.0000 | Commercial owner is prices; low-volume informational overlap is not proven cannibalisation |
| office removalists adelaide | Office: 77 / 6.8961 | Home: 6 / 1.0000 | Office owns most exposure; preserve separation |
| zq removals | Home: 51 / 1.6471 (8 clicks) | Prices: 29 / 7.6207 (0 clicks) | Brand navigation can show secondary service/rates results; no fix justified |

For `removalists adelaide prices`, old query+page export has the cost guide at 347 impressions/21.8905 and prices at 216/17.3565. New prices has most page impressions, while guide has a better position on only nine impressions. Query+page sums may exceed query-wide totals because of URL aggregation. Never infer a winner from rank alone or add these as unique query impressions.

**Intent ownership:** prices = published rates/quote/booking; cost guide = budgeting and access/time factors. Current titles/H1s/introductions already distinguish these. The guide links directly to the prices table; prices links to the informational guide. Keep both. Preserve $75 per 30 minutes (2 men + truck), $89 per 30 minutes (3 men + truck) and applicable one-hour call-out/travel. No merge, redirect, canonical, pricing or forced differentiation change is justified.

# Internal authority findings

Graph baseline: all 80 live sitemap pages, excluding self-links. Total links count repeated anchors; sources are unique pages. Context counts exclude header/nav/footer, include body related-service/shared sections, and therefore are not pure editorial links or PageRank. Anchor diversity is unique contextual visible text. No external-backlink/authority metric is available; homepage and existing hubs are structural entry points, not measured high-authority claims.

| Destination | Total links | Unique sources | Context links | Context sources | Context anchors | Guide sources | Homepage context |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| `/office-removals-adelaide/` | 368 | 79 | 117 | 70 | 21 | 10 | Yes |
| `/services/piano-movers-adelaide/` | 7 | 7 | 7 | 7 | 4 | 0 | Yes |
| `/removalists-adelaide-prices/` | 545 | 79 | 149 | 64 | 18 | 7 | No; shared navigation supplies access |
| `/removalists-hyde-park/` | 9 | 8 | 8 | 7 | 8 | 0 | No; shared navigation supplies access |
| `/removalists-unley-park/` | 9 | 8 | 8 | 7 | 8 | 0 | No; shared navigation supplies access |
| `/adelaide-to-sydney-removalists/` | 128 | 79 | 47 | 46 | 3 | 0 | No; shared navigation supplies access |
| `/adelaide-to-melbourne-removalists/` | 128 | 79 | 47 | 46 | 3 | 0 | No; shared navigation supplies access |
| `/adelaide-to-brisbane-removals/` | 127 | 79 | 46 | 46 | 3 | 0 | No; shared navigation supplies access |
| `/removalists-adelaide/` | 448 | 79 | 146 | 67 | 62 | 10 | Yes |

| Destination | Adelaide hub | Regional hub | Interstate hub | Context depth from home |
| --- | --- | --- | --- | ---: |
| `/office-removals-adelaide/` | Yes | /removalists-northern-adelaide/, /removalists-southern-adelaide/ | Yes | 1 |
| `/services/piano-movers-adelaide/` | Yes | None | Yes | 1 |
| `/removalists-adelaide-prices/` | Yes | None | No | 2 |
| `/removalists-hyde-park/` | Yes | None | No | 2 |
| `/removalists-unley-park/` | Yes | None | No | 2 |
| `/adelaide-to-sydney-removalists/` | Yes | None | Yes | 2 |
| `/adelaide-to-melbourne-removalists/` | Yes | None | Yes | 2 |
| `/adelaide-to-brisbane-removals/` | Yes | None | Yes | 2 |
| `/removalists-adelaide/` | Self | /removalists-northern-adelaide/, /removalists-southern-adelaide/ | No | 1 |

Piano: homepage, Adelaide/interstate hubs, furniture/house/office and Hyde Park give seven contextual sources and four anchors, but no guide source. Hyde Park and Unley Park each have seven body sources from the Adelaide hub, nearby suburbs and house/furniture pages; their homepage link is in navigation. The three interstate routes each have 46 contextual sources via hubs/siblings/suburbs, but no guide sources. None of the priority pages is orphaned or deep in this graph. Office/prices/hub have extensive repeated shared links; no further broad insertion is needed.

There is no dedicated `/services/` hub to invent; existing homepage/service navigation and service landing pages are the entry points. Nearby-suburb links are already geographically appropriate. No exact-match stuffing or footer amplification was performed.

# Content parity findings

Reference: source immediately before `8fcc6c5`, the 30 August canonical-host change. This is git history, not a complete historical production crawl. Piano is defined in `zq-services.mjs`; its service profile, intent, FAQs and access advice were compared. Hyde Park/Unley Park/prices use generator registry history. Interstate comparisons included both legacy content partials and current generated profile/headings.

Piano removed equipment, fixed crew, acceptance, tuning-timetable and fixed-price assertions. Current assessment/access content preserves useful topical guidance. Those unsupported promises were not restored. Storage/interstate capabilities cannot be asserted from history alone; owner verification is required before future expansion.

Sydney and Melbourne partial differences primarily replace fixed-price wording with assessed quote language; Brisbane removes a fixed-price promise. Current route pages retain origin/destination, household/packing/business inventory, access, logistics, handover and quote planning. Titles/H1s are route-specific, and interstate-hub/sibling links are intact. No lost factual route-planning section was identified that requires restoration. All three exact legacy route URLs remain permanent redirects to their intended routes.

Hyde Park and Unley Park retain differentiated street/parking/home inventory advice, breadcrumbs and nearby suburb connections. Their old fixed-price wording is not a restoration target. Prices and cost retain the approved published rates with different commercial/informational purpose. No large copy change is warranted.

# Technical/indexability findings

Live recon time: `2026-10-06T14:17:50.207306+00:00`. Production CLI: deployment `dpl_rqHP3h7MP6aoFraMhx2TVCUpETYn`, production, Ready. Created 7 October 01:06:18 AEDT after the earlier documentation push. The known repair SHA is the site-code baseline, not the latest documentation-inclusive deployed commit. A read-only deployment API request independently confirmed Git SHA `a6226ec9c248258be5dd053800badb450299d5d5` matches remote main.

All ten priority URLs (homepage, eight service/suburb/routes and Adelaide hub) returned 200 directly, one nonempty H1, title and description, exactly one self-referencing apex canonical, index/follow robots, no header noindex/conflicting canonical and sitemap inclusion. Corresponding ten exact legacy URLs returned a single 308 to the precise new URL, then 200. Robots permits crawling and advertises new sitemap URLs. Sitemap XML and all 80 unique HTML page responses were inspected; JSON-LD parses without errors. One initial missing-H1 result on insurance was an analysis-parser false positive: its H1 is in a content `<header>` removed by the text filter. A separate raw response confirmed the H1; no website change was needed.

Priority pages have substantive useful content and no obvious soft-404 characteristics. JSON parsing does not alone prove rich-result eligibility. Google-selected canonical, coverage, actual Google soft-404 classification, rendered indexing and last crawl remain unverified. Local SEO validation will check internal target validity and schema consistency; final gate results are appended below. No form submissions or customer-data writes occurred.

# Changes implemented

**One guide service-link profile:** add a specific furniture-preparation support profile in `site-src/data/seo-v4.mjs`. Preserve house, packing, furniture and Adelaide-hub access, and add a distinct piano service path with the natural label **piano access assessment**. The guide now directs a special-item enquiry to assessment instead of relying on generic service fallback. No claim of specialist equipment or guaranteed acceptance is introduced.

The rendered guide uses `getGuideSupportProfile`, not the similarly named `zqGuideLinkProfiles.services` registry. Editing that unused field alone would not fix live discoverability. The existing duplicate furniture entry is therefore left alone as unrelated registry cleanup. A focused output regression verifies one contextual path per intended service, piano label and retained Adelaide hub. No test simulates Google rankings.

# Changes deliberately not implemented

No metadata, H1, intro or large content changes: office/Hyde Park already improved after cutoff, and current metadata matches intent. No prices/cost consolidation or new suburb/route pages. No unsupported piano equipment/crew/insurance/tuning/pricing restoration. No schema changes because none were proved broken. No optional GSC tooling expansion in this release: missing authenticated and date-qualified data is the monitoring blocker, and changing analytics behavior would broaden scope.

No redirects, trailing-slash policy, DNS, domain attachment, Vercel Project Domain configuration, canonical architecture, phone, review count, rates, business identity or legal content were changed. The working legacy domain-level redirect was preserved. Harmless normalization chains are not recovery defects.

# 7-day monitoring targets

Review **14 October**, using finalized 7–13 October versus 30 September–6 October when available. Record export settings/time and match search type/country/device filters across both properties. Track old/new/combined impressions, clicks, CTR and new impression share. Inspect piano/home/office/Hyde Park/Unley Park/Sydney/Brisbane for selected canonical, last crawl and referring sitemap. Confirm the guide referral is crawlable; a link deployment is not evidence of ranking recovery. Preserve homepage/office intent separation.

# 14-day monitoring targets

Review **21 October**, compare 7–20 October versus 23 September–6 October, and week two versus week one. Obtain date+query+page rows: office intended owner/CTR; six Hyde Park variants; Unley Park versus Unley query assignment; commercial prices versus informational cost; piano and interstate exposure. Escalate post-repair crawl/canonical exclusions with exact URL evidence. Request indexing only for eligible important pages with stale/missing indexed evidence.

# 28-day monitoring targets

Review **4 November**, compare 7 October–3 November versus 9 September–6 October, plus latter/earlier 14-day halves. Assess combined retention and stable intended landing pages, not old-domain decline alone. Obtain complete historical URL/backlink inventories before diagnosing transfer gaps beyond current coverage. Recommend scoped next changes only from date-qualified evidence.

# Warning thresholds

Operational triggers, not Google guarantees: any reproducible priority 404/5xx, redirect loop/wrong destination, legacy duplicate 200, noindex/block or conflicting canonical warrants immediate technical investigation. Submitted sitemap fetch errors persisting 24 hours warrant inspection. A wrong Google canonical after a post-repair crawl still present at day 14 warrants escalation. Combined impressions down >25% with >=100 baseline impressions across two complete weekly reviews warrants query/indexing analysis; clicks down >30% require >=20 baseline clicks. Query-position worsening >10 requires >=100 comparable impressions and consistent mix. No rank threshold authorizes domain rollback.

# Recommended future actions

Manual checklist — not completed: confirm active Change of Address from the legacy property to the canonical domain; check submitted sitemap `https://zqremovalsadelaide.com.au/sitemap.xml` status/last read and submit once only if needed; inspect priority new URLs, Google-selected canonical, last crawl, referring sitemap and index status; request indexing selectively after a successful live test; track old impressions falling alongside new and combined performance. **Change of Address requires Search Console UI verification.** Restore repository OAuth or supply date-qualified post-repair exports.

The strongest next action is to allow Google time to process the repaired migration while collecting evidence. Google's [site-move guidance](https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes) describes per-URL processing and ranking fluctuations. The one link addition follows [crawlable, relevant anchor guidance](https://developers.google.com/search/docs/crawling-indexing/links-crawlable); it is not proof of a ranking benefit.

## Validation and delivery record

Focused gates passed under Windows Node 22: Search Console regression 46/46, conversion 17/17 and E-E-A-T 9/9. Build passed. SEO validator passed for 109 pages with zero bad pages and 80 sitemap page URLs. The remediation audit passed: 80 indexable pages, 448 FAQ schema questions, zero unmatched questions and no failures. `git diff --check` passed. Final `npm test`: **191/191 passed, zero failures, zero skipped**, plus quote API smoke checks passed. The initially added regression used an unnormalized section ID and was corrected to the stable generated module marker before these final gates.

Generated-output verification shows piano contextual sources **7 → 8**, contextual links **7 → 8**, guide sources **0 → 1** and anchor diversity **4 → 5**. Source CSV hashes and daily CTR arithmetic were checked; all 13 originals remain unchanged.

Delivery scope: exactly this report, `site-src/data/seo-v4.mjs` and `tests/search-console-fixes.test.mjs`. Release uses a normal main push after checking the remote frontier, followed by Git-integrated deployment Ready verification and live priority/legacy/guide checks. Final deployment identity and post-release outcomes are recorded in the delivery response; the live graph above is explicitly the pre-release baseline. No manual redeployment or domain/DNS mutation is authorized or required.
