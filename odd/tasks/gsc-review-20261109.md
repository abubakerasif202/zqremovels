# Search Console review improvements
Branch: seo/gsc-review-20261109; base: 1a2ab02; delivery: ask-on-risk, local scoped commit, draft PR only if authorized workflow supports it; no production deployment.
Runner: Node 22, node:test, existing npm/build/SEO/Playwright checks. Forecast: ~300 authored source/test/report lines, plus verbatim brief/tracking and HTTP evidence.

## Specs
S1. "Change a rule only if a defect is reproduced or source configuration proves a real conflict. Otherwise preserve and record as currently healthy." Check: timestamped public HTTP GET evidence, deduplicated recursive sitemap and redirects.
S2. "If content is already strong, make a proportionate improvement rather than rewriting for word count. Google decides indexing." Check: Pennington useful quote/access advice and contextual discovery links, preserve source facts.
S3. "Make useful, specific improvements to pricing, office and piano first. Keep current canonical paths." Check: actual published rates/limitations, metadata before/after, same-day/Hyde Park/Unley Park review.
S4. "Preserve Web3Forms, consent, GTM and accepted quote submission tracking; mock submissions rather than sending real customer leads." Check: build, SEO regressions, full tests, mocked conversion tests, mobile/tablet/desktop and keyboard.
S5. "A scoped commit on the dedicated branch with passing relevant checks and a reviewable diff. Prepare a draft PR if the existing authenticated workflow supports it; this brief ends before a production merge/deployment." Check: diff review, commit, truthful handoff, pending Google/ownership/field data noted.

## Tasks
- T1 [S1] delegated public HTTP audit; complete; commit a995a183457ce3fdfb251df8384fcafe4b3e912d; isolated public HTTP evidence report.
- T2 [S2-S3] inline content/metadata improvements after read-only map; complete; commit a995a183457ce3fdfb251df8384fcafe4b3e912d; seven targeted RED-to-GREEN regressions and final functional checks passed.
- T3 [S4-S5] inline regression checks and handoff; long checks delegated; complete; commit a995a183457ce3fdfb251df8384fcafe4b3e912d; all change-specific checks passed; documented pre-existing warnings and unrun checks; draft PR handoff.

## Log
L1. Original implementation brief (verbatim):

You are continuing ZQ Removals SEO work after a live Search Console and production HTTP review on 9 November 2026.

Project
- Repository: abubakerasif202/zqremovels
- Expected Windows checkout: C:\Users\abuba\zqremovels
- Production: https://zqremovalsadelaide.com.au
- Use native PowerShell if running in Windows. Inspect the actual repository and package manager before choosing commands.

Objective
Implement focused website improvements supported by current evidence, strengthen Pennington and high-opportunity service pages, and produce a verified handoff. Preserve the working SEO migration, redirects, sitemap structure, forms and tracking. Complete implementation and testing; do not stop at an audit or a plan.

Start
1. Read AGENTS.md and relevant project instructions completely. Inspect git status, current branch, worktrees, package.json, build scripts and recent SEO commits. Preserve unrelated changes. Use a dedicated branch/worktree if the current checkout is dirty.
2. Locate editable source and the actual generation pipeline. Existing areas may include scripts/build-site.mjs, site-src/content, site-src/data and site.js; verify rather than assume. Edit the authoritative source and regenerate required output.
3. Save a short current baseline before changes. Read existing SEO reports and test configuration. Avoid mass rewrites, dependency upgrades or design changes unrelated to this brief.

Verified evidence — recheck before changing behavior
- GSC aggregate update 6 Nov: 79 indexed, 45 excluded: 38 Page with redirect, 3 Redirect error, 2 intentional legal noindex, 2 Crawled - currently not indexed.
- Duplicate canonical and Discovered - currently not indexed both zero and validation passed.
- All 79 current unique sitemap page URLs passed direct HTTP 200, self-canonical and index/follow checks on 9 Nov.
- sitemap.xml is now an index: pages/services/suburbs/guides/images. 158 location entries resolve to 79 unique page URLs because image sitemap repeats the page locations. This is not a duplicate-content bug.
- All 38 ordinary redirect examples tested as one permanent hop to final 200. Sources were absent from sitemap; static page anchors did not link to this checked source set.
- Three GSC redirect-error cases now work and all passed Google live tests:
  /removalists-klemzig/ -> 308 -> /removalists-northern-adelaide/ -> 200
  http://zqremovalsadelaide.com.au/ -> 308 -> https://zqremovalsadelaide.com.au/ -> 200
  /adelaide-moving-guides/how-much-do-removalists-cost-adelaide/ -> 301 -> /adelaide-moving-guides/removalists-cost-adelaide/ -> 200
- Redirect-error validation restarted 9 Nov; confirmed started, three pending. Do not report validation as passed.
- /removalists-pennington/ is still saved as Crawled - currently not indexed, last crawl 31 Aug. Current page passes HTTP and Google live test; indexing request accepted 9 Nov. Avoid repeated requests.
- /services/furniture-removals-adelaide/ is the other stale crawled-not-indexed example. It now 308-redirects to indexed /furniture-removalists-adelaide/. Preserve the redirect.
- All 79 indexed examples were compared with 79 unique sitemap URLs: 78 overlap. Sitemap-only: /removalists-pennington/. Indexed-only: /apartment-removals-adelaide/, which now 308-redirects to /apartment-removalists-adelaide/. Preserve consolidation and distinguish saved Google state from live state.
- Toorak Gardens is indexed, declared and Google canonical match, crawl 28 Oct. Brighton and Kensington Gardens are indexed too. Preserve these successes.
- /privacy-policy/ and /terms-and-conditions/ intentionally noindex,follow and excluded from sitemap.
- Manual actions/security/HTTPS/breadcrumb reports have no reported defects. CWV has insufficient field usage data.

Phase 1 — reproduce only actionable technical issues
Fetch sitemap.xml recursively. Deduplicate page loc values; handle image sitemap namespaces correctly. Check every unique page with actual HTTP GET responses. Save each status, every Location hop, final URL/status, canonical, meta robots, X-Robots-Tag, robots.txt allowance and sitemap membership. A browser ending at a page does not prove the HTTP chain.
Check the three reported redirect errors, the legacy furniture and apartment routes, HTTP/HTTPS and www/apex behavior against existing deployment rules. Look for route precedence, slash normalization loops, middleware interference and inconsistent source/generated redirect rules. Change a rule only if a defect is reproduced or source configuration proves a real conflict. Otherwise preserve and record as currently healthy.
Review broad guide/suburb redirects for destination content that satisfies the old topic. Improve relevant destination content when justified; do not resurrect thin pages or redirect everything to the homepage.
If deployment logs are available through already authorized access, investigate the dated Google failures. Distinguish evidence from a hypothesis. Never print credentials or require access changes merely to finish this work.

Phase 2 — Pennington
Review the actual Pennington content against nearby suburb pages. Improve usefulness and distinct local moving guidance: access planning, parking/loading questions, stairs, apartment/house considerations, what customers should provide for a quote, and related services. Use defensible facts, qualified advice and existing verified business information.
Add or improve relevant contextual links from Port Adelaide, the suburb/service hub and suitable service pages only where this helps readers. Retain a direct HTTP 200, self-canonical, sitemap inclusion and crawlable HTML.
Do not invent completed jobs, reviews, addresses, insurance promises, guarantees, licenses, team credentials or local facilities. If content is already strong, make a proportionate improvement rather than rewriting for word count. Google decides indexing.

Phase 3 — search opportunity pages
28-day Web search baseline (11 Oct–7 Nov): 36 clicks, 7,520 impressions, CTR displayed 0.5%, average position 29.
- /removalists-adelaide-prices/: 627 impressions, 4 clicks, 0.6% CTR, position 18.2.
- /office-removals-adelaide/: 1,071 impressions, 1 click, 0.1% CTR, position 38.6. Query office removalists adelaide: 68 impressions, 0 clicks, position 4.8; broader office terms are much lower.
- /services/piano-movers-adelaide/: 922 impressions, 0 clicks, position 50.1.
- Same-day: 134 impressions, 2 clicks, position 13.7.
- Hyde Park and Unley Park query variants around positions 8–16 merit a small relevance/internal-link review.
Inspect current title, meta description, H1, body content, intent overlap and contextual links. Make useful, specific improvements to pricing, office and piano first. Keep current canonical paths. Explain pricing inclusions/fees clearly using the actual current published business rules; verify small/big truck distinctions and rates rather than assuming old figures apply everywhere. Preserve accurate limitations on availability and piano handling.
Improve calls to action and quote guidance without disrupting mobile layout. Use truthful service details and appropriate existing schema only. Avoid repetitive suburb keyword insertion, generic FAQ padding, fake review schema and promises of rankings.
Record before/after titles and descriptions and explain each content change. Do not attribute all low CTR to snippets when rankings and query mix explain much of it.

Phase 4 — regression protection and verification
Use existing appropriate checks and add a compact meaningful SEO regression check only if missing. It should catch sitemap URLs that redirect, have noindex or mismatch canonical; redirect loops/chains; wrong apex; accidental inclusion of legal/legacy sources. Keep valid image sitemap overlap supported. Avoid freezing an arbitrary URL count if legitimate content changes.
Run the project build, appropriate existing SEO/functional tests and git diff --check. Review the touched pages at desktop and mobile widths for readable headings, layout, links, quote actions and keyboard use. Preserve Web3Forms, consent, GTM and accepted quote submission tracking; mock submissions rather than sending real customer leads.
If running lab performance checks, label them as lab measurements, investigate measured regressions only, and preserve accessibility/reduced-motion behavior. Insufficient GSC CWV field data is not a performance failure or a field pass.

Ownership-token warning
GSC reports one unused domain-provider ownership token associated with admin@zqremovals.au. Document this for owner review. Determine active Google services and account dependencies before proposing any removal. Website content work does not authorize speculative DNS or ownership changes.

Deliver
- Complete focused source changes and generated output, if required by the project.
- A scoped commit on the dedicated branch with passing relevant checks and a reviewable diff. Prepare a draft PR if the existing authenticated workflow supports it; this brief ends before a production merge/deployment.
- A concise report separating confirmed defects fixed, improvements made, working behavior preserved, stale GSC findings, validation/indexing pending and incomplete checks.
- Exact HTTP evidence and sitemap-vs-indexed set differences, with dates; do not claim the historic 80-vs-79 change is explained without the historic full export.
- Verification results and remaining owner actions. Do not repeat GSC validation/indexing submissions already accepted on 9 Nov unless fresh evidence warrants it.

L2. 2026-11-09: Existing checkout dirty in package manifests and unrelated artifacts; clean linked worktree created from 1a2ab02. No original files changed. Engram project detection returned zqremovels but search/review returned unknown_project, so project memory mirror pending. Default shell login resets cwd to home; commands now explicitly Set-Location and disable login. Node on PATH is 24.22.2; locate Node 22 before checks.

L3. Public GET audit 2026-11-09 12:48 UTC: 79 unique sitemap pages healthy; all38 supplied redirects one permanent hop;3 saved errors healthy. Reports preserve exact headers/hops and saved-GSC set differences. Existing guards already cover sitemap redirects/noindex/canonical and image sitemap overlap, so no duplicate audit engine added.
L4. Route-specific content improves packages, Pennington/Port Adelaide guidance, office IT handoff, piano rate scope, same-day claim and guide-hub timing/stairs destination. Seven new tests observed failing rules then passing. Initial checks exposed a64-character title and old exact title fixture; title shortened rather than relaxing guardrail, fixture intentionally updated. Baseline package audit has2 transitive advisories; no upgrades authorized.

L5. Final Node22 checks: build PASS, focused91/91 PASS, npm test525/525 PASS, SEO bad-pages0 (79 sitemap pages), TypeScript/syntax PASS, mocked conversion16/16 PASS. UI28/28 PASS across320/375/768/1366 with screenshots and keyboard/reduced-motion checks. Remediation editorial regex flags unchanged how-to-choose wording; baseline/candidate content hashes equal. Physical-device/WCAG-full/lab/production checks NOT RUN.
L6. Source diff reviewed independently twice, no blockers. Native staged-candidate assess: medium, review_due=false, under_budget; no native review/consent started. Only7 authored routes differ semantically; all122 raw HTML hashes differ with cause unproven. Remote main fetched at035ed6b has same source tree as baseline1a2ab02, so feature PR will not include unrelated prior-branch changes.

L7. Implementation/evidence commit a995a183457ce3fdfb251df8384fcafe4b3e912d. Authored source/test/task/report narrative diff267 additions +24 deletions =291 lines; generated JSON and28 screenshots excluded. Native committed-slice assess: medium, review_due=false, under_budget; informational only, no approval claimed. No additional review lifecycle started.
