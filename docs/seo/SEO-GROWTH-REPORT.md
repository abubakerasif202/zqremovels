# ZQ Removals Adelaide: SEO Growth Report

Date: 2026-11-25. Evidence window for Search Console: 2026-10-27 to 2026-11-23 (the latest data available).
Raw exports: `data/gsc/2026-11-25-gsc-*.csv`.

Anything marked **Not verified** could not be confirmed with the tools available in this session.

## 1. Summary

- Production is healthy. All checked pages return 200 with correct canonicals, valid JSON-LD, a single H1 and sitemap inclusion.
- The site is small and young. Search Console has no data before 2026-08-26. In the last 28 days it earned 43 clicks on 6,410 impressions (average position 26.2). **77% of those clicks (33 of 43) came from branded queries.** Non-brand organic search produced 10 clicks on about 5,085 impressions (0.2% CTR).
- The main limiter is not on-page SEO. Pages already have 1,000 to 2,500 words, correct schema and clean internal linking. The gap is authority, reviews and visibility on the SERP types that actually rank (see section 7).
- Position #1 for generic terms such as "removalists adelaide" is not realistic in the short term. The page-one SERP is dominated by directories, listicles and social posts. Suburb and long-tail terms are the winnable ground.
- Lab performance is mixed: two hub pages have high Total Blocking Time. There is no field data (CrUX), so Core Web Vitals pass or fail cannot be claimed.

## 2. Git, deployment and production state

| Item | Result |
|---|---|
| Initial local state | Branch `seo/serp-ctr-titles`, 3 unpushed commits, 38 commits behind `main`, with uncommitted changes in `package.json`, `package-lock.json`, `odd/tasks/premium-truck-selection.md`, `site-src/data/zq-services.mjs` |
| Finding | The local branch was stale. PR #113 had already merged the title work and deliberately kept `main`'s suburb titles. Pushing the local branch would have needed a force-push and overwritten live titles. |
| Action | Only the genuinely new commit was carried over (cherry-picked onto fresh `origin/main` in a separate worktree). Your local checkout and uncommitted files were not touched. |
| PR | #114 `fix(seo): link cost guide directly instead of via legacy redirect`, squash-merged as `a158fc3`. All checks passed (Lighthouse CI, CodeQL, Vercel). |
| Production deploy | Vercel production deployment of `a158fc3` succeeded at 2026-11-24 16:38 UTC. |
| Follow-up PRs | #115 report and CSVs (`c104363`). #116 `fix(reviews): show 102 Google reviews and read review data in Astro-rendered pages` (`0e9b93a`), verified live on 2026-11-25. |
| Local branch `seo/serp-ctr-titles` | Left in place, now redundant (two commits superseded by `main`, one merged via #114). Safe to delete when you are ready. |

Checks before merge: `npm run build` passed, `npm run seo:validate` passed (80 pages), `npm test` passed (563 tests, 0 failed).

## 3. Live title verification and deployment dates

Titles live on production on 2026-11-25:

| Page | Live title | Deployed (UTC) | PR |
|---|---|---|---|
| `/removalists-adelaide-prices/` | Removalists Adelaide Prices \| $75 & $89 Truck Rates \| ZQ | 2026-11-21 01:44 | #113 |
| `/removalists-hyde-park/` | Hyde Park Removalists \| Local Home Movers \| ZQ Removals | 2026-11-15 07:37 | #108 |
| `/removalists-unley-park/` | Unley Park Removalists \| Local Home Moves \| ZQ Removals | 2026-11-15 07:37 | #108 |
| `/removalists-medindie/` | Medindie Removalists \| Local House Movers \| ZQ Removals | 2026-11-15 07:37 | #108 |
| `/removalists-toorak-gardens/` | Toorak Gardens Removalists \| From $75/30 min \| ZQ | 2026-11-17 04:24 | #109 |
| `/services/piano-movers-adelaide/` | Piano Movers Adelaide \| Upright & Grand Pianos \| ZQ | 2026-11-17 04:24 | #109 |

Important: these are `main`'s titles, not the different wording on the stale local branch. Earlier in this session I described the local-build titles as "covered"; that referred to the stale branch and was not what production serves.

Because the 28-day Search Console window ends 2026-11-23, it includes only about 1 to 8 days after these changes. It is a partial baseline, not a clean pre-change one. Re-measure in 2 to 3 weeks.

Production checks (13 pages, 66 internal links, sitemap): all pages returned 200 with self-referencing apex canonicals, `index,follow`, exactly one H1, valid JSON-LD (no parse errors), no duplicate FAQPage or BreadcrumbList blocks, and sitemap inclusion. All 66 internal links returned 200 with no redirect hops. HTTPS redirects, `www` to apex and trailing-slash redirects are single 308 hops. `robots.txt` allows all and lists both sitemaps.

The canonical cost guide remains `/adelaide-moving-guides/removalists-cost-adelaide/`. Singular `/removalist-cost-adelaide/` and `/guides/removalist-cost-adelaide/` are legacy redirect stubs, kept.

Minor: `/cheap-removalists-adelaide/` has a 161-character meta description (1 over a common 160 guide). Not worth a change on its own.

## 4. Pricing consistency

Source of truth: `site-src/data/business.mjs` (small truck `$65 per 30 minutes` confirmed by the owner on 2026-11-21; 2 men + large truck `$75`; 3 men + large truck `$89`; 1-hour call-out/travel where applicable). The prices page and suburb pages match these numbers. No rates were changed.

Observation to decide (no change made): the cheapest rate, $65 per 30 minutes, appears in the body of the prices page but not in the prices page title, and the Toorak Gardens title says "From $75/30 min". A competitor (HF Removals) advertises "From $69/30 min" in its search snippet. A truthful "From $65" in a title or description could improve click-through, but you asked not to rewrite these titles without strong evidence, so this is a business decision for you.

## 5. Performance (Phase 3)

**Mobile visual suite** (`npm run test:visual-mobile`): 111 passed, 0 failed. Covers 320, 360, 375, 390, 768, 1440 and 1920 px. A separate live check at 320, 360, 375, 390, 414 and 768 px on 7 pages (home, prices, contact, office, Hyde Park, Unley Park, Salisbury) found no page-level horizontal overflow, no console errors and no unlabeled form fields (42 checks). One small interactive element under 24 px appears on most pages at most widths; it was not identified (**not verified** as a defect).

**Lighthouse on the live site, mobile, lab only** (single run each, simulated throttling):

| Page | Perf | A11y | Best practices | SEO | FCP ms | LCP ms | TBT ms | CLS |
|---|---|---|---|---|---|---|---|---|
| `/contact-us/` | 99 | 100 | 100 | 100 | 1255 | 1741 | 15 | 0.000 |
| `/removalists-unley-park/` | 99 | 100 | 100 | 100 | 1111 | 2047 | 19 | 0.000 |
| `/removalists-adelaide-prices/` | 89 | 100 | 100 | 100 | 1533 | 2252 | 367 | 0.000 |
| `/office-removals-adelaide/` | 88 | 100 | 100 | 100 | 1650 | 2581 | 367 | 0.000 |
| `/` | 77 | 100 | 100 | 100 | 2123 | 2670 | 686 | 0.013 |
| `/removalists-adelaide/` | 64 | 100 | 100 | 100 | 2404 | 3540 | 1119 | 0.017 |

- Accessibility, best-practices and SEO scores are 100 on all six pages. CLS is at or under 0.017 everywhere.
- LCP exceeds 2.5 s on the home page (2.67 s), the office page (2.58 s) and `/removalists-adelaide/` (3.54 s).
- The cause is main-thread work, not network. On `/removalists-adelaide/`, Style & Layout takes about 3.0 s versus about 0.16 s of script evaluation. Long tasks are attributed to `consent-manager.mjs`, `site.js` and `chat-widget.mjs`, but those scripts are cheap themselves; they trigger expensive style and layout on a larger page (87 KB HTML versus 42 KB on the fast suburb page). An unthrottled trace shows one initial layout of 309 ms for about 1,870 boxes.
- The repository's own `npm run lhci` (local static server, uncompressed) shows a different bottleneck: render-blocking CSS (165 to 202 KB). In production the same CSS is served at about 34 KB with brotli and a one-year immutable cache, so that local figure overstates real impact. The local harness also reports TBT 0, so it cannot reproduce the live TBT.
- An experiment with `content-visibility: auto` on below-the-fold sections produced no measurable change in the local harness and could not be judged with it. It was **reverted and not shipped**.

**Field data: none.** The Chrome UX Report has no data for the origin (insufficient traffic), so field LCP, INP and CLS are unknown. No Core Web Vitals pass or fail claim is made.

Recommended next step: A/B the hub-page rendering cost on a Vercel preview URL (live-like compression and consent banner), starting with `/removalists-adelaide/` and the home page.

## 6. Search Console findings

| Segment (28 days) | Clicks | Impressions | CTR | Avg position |
|---|---|---|---|---|
| Site total | 43 | 6,410 | 0.67% | 26.2 |
| Prior 28 days | 23 | 5,652 | 0.41% | 33.0 |
| Last 7 days | 7 | 1,293 | 0.54% | 31.2 |
| Prior 7 days | 12 | 1,258 | 0.95% | 25.7 |
| Mobile | 25 | 2,511 | 1.00% | 20.7 |
| Desktop | 17 | 3,815 | 0.45% | 29.5 |
| Non-brand (query without "zq"), mobile | 7 | 1,935 | 0.36% | 24.9 |
| Non-brand, desktop | 3 | 3,079 | 0.10% | 32.9 |
| Australia | 42 | 6,134 | 0.68% | 26.4 |

(Prior-period dates are inferred from the tool's comparison and not stated by it. 90-day: 88 clicks, 15,234 impressions; no data before 2026-08-26.)

- **Trend:** 28-day clicks are up 87% (23 to 43) with position improving from 33.0 to 26.2. The 7-day drop (12 to 7 clicks) is on a very small base and is within noise.
- **Brand:** the query "zq removals" ranks at position 1.4 with 9 clicks. Most other clicks come to the home page.
- **Mobile outperforms desktop** on CTR and position. Almost all impressions (96%) are Australian.
- **Largest zero-click opportunity pages:** `/office-removals-adelaide/` (957 impressions, 0 clicks, position 31.9), `/services/piano-movers-adelaide/` (577, position 53.7), `/removalists-malvern/` (363, position 19.1). "office removalists adelaide" ranks 3.9 on 74 impressions with 0 clicks.
- **Positions 4 to 10:** "malvern removalist" and "local removalists malvern" (4.1), "office relocation adelaide" (5.4), "local removalist malvern" (6.1), "queens park removalists" (7.4), "local removalist hyde park" (7.5), "local removalist medindie" (7.8).
- **Positions 11 to 20:** "removalists adelaide prices" (10.8), "unley park" queries (12 to 14), "hyde park removalists" (11 to 15), "removals prices" (12.2), "removalists malvern" (13.0), "same day removalists" (18.1).
- **Page-level declines** (`traffic_drops`): three pages lost one click each. That is noise.
- **Genuine cannibalisation** (queries where several pages appear):
  - "unley park" queries: `/removalists-unley-park/` at positions 8 to 10 and `/removalists-unley/` at 24 to 27.
  - "removalist salisbury": four pages, with the dedicated page at 17.1 on 26 impressions; the home page and northern hub rank 61 to 64.
  - "removalists adelaide prices": the cost guide (position 10.1) and the prices page (11.9) split the query. This is intentional and was left alone, per your instruction.

## 7. Internal linking and content structure (Phase 5)

Measured on the built site (inbound links from indexable pages):

- Money and hub pages (prices, cost guide, cheap, office, piano, Salisbury, Northern hub) each receive links from **78 pages**, mostly sitewide footer or related-link blocks with identical anchors.
- The near-page-one suburb pages (Unley Park, Hyde Park, Malvern) receive links from only **8 to 11 pages** each.
- 93 pages mention "Salisbury", and 78 link to the Salisbury page with the same anchor ("Salisbury and northern suburbs moves"). The Northern hub gets three sitewide links per page. This repeated, identical anchoring may contribute to several Salisbury URLs surfacing; it is a hypothesis, not a proven cause.
- Content depth is not the gap: Salisbury 1,737 words, Unley 1,553, Unley Park 1,050, Hyde Park 1,506, Malvern 1,575, office removals 2,515, prices 2,104.
- The prices page and the cost guide already serve distinct intents (commercial rates versus informational planning) and link to each other.

No code change was made in this phase: no confirmed defect, and changes would be speculative at this traffic level.

## 8. Competitor research (Phase 6)

Live Adelaide-located SERPs on 2026-11-25 (search snippets only; competitor pages were not fully analysed):

- **"removalists adelaide":** page one is Adelaide Examiner and Handyman Reviewed "best of" lists, three Facebook group posts, Upmove, Yelp, Crazy Rise and a furniture blog. No removalist's own homepage appears in the top 10.
- **"removalists adelaide prices":** Muval ("from $72 / half hour"), FindAMover, **HF Removals** ("Rated 5.0 on Google (491 reviews). From $69/30 min; 3-hour minimum + 1-hour call-out"), TT Moving, Removals R Us, Anspach (cost guide), two Reddit threads, Moving24.
- **"office removalists adelaide":** Grace Removals, CBD Movers, Richard Mitchell, Office Moves Group, Anspach; **ZQ appears at position 6** (snippet "Crew rates from $75/30 min"). HF is at position 9.

Gaps versus HF Removals, from its snippet only:
- Reviews: HF shows 491 Google reviews in the snippet; ZQ shows 102 on its pages (since 2026-11-25; it was 100 when this report was first written). The gap is visible to searchers.
- Price visibility: HF's "from $69/30 min" is in the snippet, while ZQ's lower $65 is not.
- ZQ's strengths: published rates with hypothetical examples, a shared pricing source, no fake review schema.

**Not verified:** competitor backlink profiles, content depth, conversion experience and review authenticity (no backlink data source was used in this session).

## 9. Local SEO and authority (Phase 7)

Verified on production:
- **NAP:** one phone number (0433 819 989) on all 121 built pages, one email (admin@zqremovalsadelaide.com.au). Schema address is locality-level only (Andrews Farm SA 5114), which suits a service-area business.
- **Schema:** `MovingCompany` with opening hours (07:00 to 19:00, 7 days), `priceRange` `$65-$89 per 30 minutes`, `areaServed` (9 items), `sameAs` (Google listing, Facebook), `hasMap`. There is no `aggregateRating` or `Review` markup, which is compliant with the repository's no-fake-ratings rule.
- **Reviews (updated 2026-11-25):** shown as visible text ("5.0 from 102 Google reviews") from the Places API data file. The owner confirmed 102 five-star reviews, so the refresh from `origin/chore/google-reviews-20261123` was shipped in PR #116 (`0e9b93a`) and verified live on the home page and `/removalists-unley-park/`. The Google Business Profile link supplied by the owner resolves to the listing "ZQ Removals Adelaide", and its place ID matches the site's `hasMap` CID. That PR also fixed a loader bug: Astro-rendered pages had been using the 100-review fallback and ignoring the data file. The automation branch is now redundant and can be deleted.

**Not verified:** the Google Business Profile landing-page URL, listing categories and photos, citation consistency on directories, and real project photographs on the site.

Prioritised local authority plan (no fake reviews, locations or purchased links):
1. Ask recent genuine customers for Google reviews; the visible gap to HF is the largest trust difference.
2. Complete the Google Business Profile: categories, service areas, photos of real jobs, Q&A, regular posts.
3. Claim consistent listings (same name, phone and service area) on Australian directories such as Localsearch, Yelp, Hotfrog and True Local, plus Facebook.
4. Seek inclusion in "best removalists" roundups (Adelaide Examiner, Handyman Reviewed, Upmove) through legitimate outreach.
5. Local links: suburb or community sites, real estate partners, strata managers, local business associations.
6. Add genuine job photos and short case studies to suburb and office pages.

## 10. Remaining blockers and open decisions

- Field Core Web Vitals unavailable (insufficient traffic).
- Hub-page rendering cost (`/removalists-adelaide/`, home) not yet fixed; cause narrowed to style/layout, not isolated.
- Pricing wording decision: whether to surface the $65 small-truck rate in titles or descriptions (section 4).
- ~~Decision on merging the automated reviews refresh (100 to 102).~~ Resolved: shipped in PR #116 and verified live.
- Your uncommitted local files (`package.json`, `package-lock.json`, `odd/tasks/…`, `site-src/data/zq-services.mjs` piano copy edit) are still unreviewed and unshipped.
- Title effect is not measurable yet (1 to 8 days of post-change data).

## 11. Action plan

**Next 7 days**
- Re-run `ctr_opportunities` and the cannibalisation check once the title changes have 14 or more days of data (about 2026-12-01 to 2026-12-08).
- Decide the $65 pricing-wording question and the reviews branch.
- Start a review request routine with recent customers; update the GBP profile.
- Profile `/removalists-adelaide/` and the home page on a Vercel preview with live-like compression and the consent banner.

**Next 14 days**
- Fix hub-page style/layout cost if the preview test confirms it.
- Add contextual internal links to the near-page-one suburb pages (Unley Park, Hyde Park, Malvern, Medindie) from relevant guides and nearby suburb pages, then measure.
- Rework the repeated sitewide "Salisbury and northern suburbs moves" anchor so it is not identical on 78 pages, if the Salisbury overlap persists.
- Submit directory listings and begin legitimate outreach to roundup sites.

**Next 28 days**
- Compare 28-day Search Console data against the CSVs in `data/gsc/` (page, query and totals) and judge each title change on its own post-deploy window.
- Revisit office removals (957 impressions, position 31.9) with job photos, real case studies and commercial trust signals.
- Reassess piano movers (position 53.7): it needs authority, not more copy, so consider whether it is worth the effort.
- Re-run SERP and competitor checks and record movement for the five priority suburb pages.
