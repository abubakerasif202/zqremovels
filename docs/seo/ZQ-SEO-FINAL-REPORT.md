# ZQ SEO recovery — final implementation report

**Scope:** local feature branch `seo/gsc-migration-recovery-2026-11` and read-only production verification. Baseline `6412c60`. No production settings, forms, tracking, domains, sitemap submissions or booking records were changed.

## Search baseline and interpretation

| Property | Clicks | Impressions | CTR | Impression-weighted position | Previous → latest 28-day clicks | Previous → latest impressions |
|---|---:|---:|---:|---:|---:|---:|
| Legacy | 203 | 36,608 | 0.55% | 22.49 | 3 → 1 | 1,134 → 271 |
| Current | 88 | 15,445 | 0.57% | 32.12 | 25 → 41 | 6,023 → 6,069 |

The new property gained 64% in clicks with essentially flat impressions; CTR rose from 0.42% to 0.68% and weighted position improved from 32.50 to 26.51. Combined windows went from 28 to 42 clicks and 7,157 to 6,340 impressions (−11.4%). These combined property counts are directional, not deduplicated SERP totals. The six-month combined baseline is 291 / 52,053 (0.56%). The latest window contains 27 reported days on both properties; the 25 November row is absent. The new property first shows data on 30 August, so comparing absolute six-month totals as if both had full history is misleading. Evidence is consistent with consolidation **and** fewer combined impressions in the latest window; it does not establish complete migration or isolated ranking losses. The new property received 54 mobile clicks and 84 Australian clicks overall; office query impressions instead skewed strongly to desktop. The automated overlap screen flagged 58 new-property and 169 old-property queries; the curated intent-level review is in the CSVs and is not a merge recommendation.

The [audit](ZQ-SEO-AUDIT-2026-11.md) records baseline gaps and acceptance criteria. The [monitoring runbook](../../reports/seo/README.md) describes export reproduction, intent analysis and 30/60/90-day checkpoints.

## Changes and verification

| Area | Verified outcome |
|---|---|
| Migration | Audited 329 records (275 paths). All end on eligible canonical HTTPS apex pages; 131 are direct and 198 have two permanent hops. All 198 already have exact destination rules in `vercel.json`; adding duplicates would not intercept the observed first-hop forwarding. All 79 unique submitted page destinations were directly reachable and eligible. [URL Inspection](../../reports/seo/gsc-url-inspection.json) confirmed indexing and matching canonicals for six priority URLs. |
| Commercial and local | The generated office page now exposes the commercial metadata, one concise H1, a higher quote CTA, and a short brief covering workload, access and restart. Hyde Park and Unley Park distinguish access questions. Removed the false $75 starting-rate claim from seven suburb leads, preserved their pricing links, and respected the owner's existing allowlist for the $65 rate. No unverified GST, minimum, fixed-price, piano or availability claims added. |
| Director | About uses the supplied Qasim Ali portrait as a 384×384, 20 KB WebP with 192×192 layout dimensions, lazy loading and meaningful alt text. The generic team hero no longer labels him. |
| Build and crawl | Node 22 production build: 122 generated HTML files. SEO validator: 80 pages checked, zero bad pages, 79 unique page sitemap URLs. No new redirect config or sitemap format was needed. |
| Responsive and lead flow | Production and initial local: 45 route/viewport checks each, no horizontal overflow, all 200 and one H1. Final office quote link and About portrait checked at all requested nine widths; CTA reached the existing quote form and portrait decoded. Existing Playwright suite on the isolated built snapshot: 349 passed, 147 skipped by project/test conditions. The final office/suburb copy changes were separately checked in the final generated HTML and responsive probe. No live enquiry was submitted. |
| Static and unit checks | TypeScript compiler and JavaScript syntax checks passed. No standalone lint command is defined. Python monitor tests and the focused source regression passed. All 70 Node test files plus the quote API smoke passed across a split run (576 passing tests total). A title/CTA fixture exposed the longer footer label contract; that label was restored, then the failing file and every remaining file were rerun successfully. The early Playwright baseline was stopped because it shared mutable build output with Node tests; the isolated run above is the browser suite result. |

### Performance

Single mobile Lighthouse runs: production home **3.74 s LCP / CLS 0 / 1,243 ms TBT**, local candidate **3.90 s LCP / CLS 0.029 / 734 ms TBT**. Production versus localhost is not a controlled before/after comparison. Both lab LCP results miss 2.5 s; no field INP result was established, and TBT is not INP. A matched hosted preview run and field p75 remain required. The homepage payload was not redesigned.

Desktop and phone baseline/final screenshots were captured in local scratch `%TEMP%/zq-recovery-visual/`, with final 390 and 1440 px office/director views.

## Commit evidence

- `4c9478b` — migration evidence, GSC monitor, source protection and initial audit.
- `dba1a75` — office metadata and quote copy, portrait and targeted regression.
- `90f3916` — final first-screen CTA order, corrected suburb copy and preserved pricing placements.
- `d6cd23e` — preserved the longer business relocation CTA at page end.

## Release blockers and follow-up

1. **Preview and PR:** Built and verified locally; no push, Vercel preview, PR, merge or production deploy. The requested delivery still needs explicit selection of the GitHub and Vercel credential/session under the repository's remote-operation rule.
2. **Old-domain forwarding:** Inspect the active old-domain forwarding rule in the authorised hosting account, confirm exact mappings and no-match behaviour, then authorise and stage a reversible cutover. Re-run the complete map and retain synthetic attribution proof. Do not move DNS or disable forwarding without a verified replacement.
3. **Google:** Manually check old-property Change of Address; the connector can inspect URLs but did not expose that status. At 30/60/90 days follow the runbook and assess success by complete comparable windows, canonical coverage and genuine leads.
4. **Excluded/not proven:** Field CWV, authenticated preview-versus-production parity, end-to-end provider delivery or real booking completion. Existing tracking/consent kept intact.

Risk: none of the project-defined high-risk implementation items; deployment and old-host forwarding remain separate approval gates.
