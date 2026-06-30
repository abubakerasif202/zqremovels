# SEO Audit TODO — ZQ Removals

## Context

- [x] **SEO-CTX-1.1 Site Scope**:
  - **Site URL**: `https://zqremovals.au/`
  - **Scope**: Full root-domain audit of the generator-driven static site and live production headers.
  - **Source of truth**: `site-src/`, `site-src/pages.json`, `site-src/data/*.mjs`, `site-src/content/**`, `scripts/build-site.mjs`, `vercel.json`, `tests/**`.
  - **Generated evidence**: `npm run build` produced `320` HTML files; `node scripts/seo-validate.mjs` passed for `299` pages; output crawl found `288` indexable pages and `32` noindex pages.

- [x] **SEO-CTX-1.2 Market, Language, Geography**:
  - **Target markets**: Adelaide metro, South Australia, and Adelaide-origin interstate routes.
  - **Languages / regions**: English Australia; `en-AU`; no international language variants found or required.
  - **International SEO status**: Hreflang, regional subfolders, currency localization, and geotargeting are not applicable unless the business launches non-Australian pages.

- [x] **SEO-CTX-1.3 Business Goals and Keyword Themes**:
  - **Primary goals**: Increase qualified quote requests, improve local pack and organic visibility, defend premium/local Adelaide terms, and grow guide-assisted conversion paths.
  - **Primary keyword themes**: `removalists Adelaide`, `Adelaide removalists`, `house removals Adelaide`, `furniture removalists Adelaide`, `office removals Adelaide`, `packing services Adelaide`, suburb removalists terms, fixed-price/budget mover terms, and `Adelaide to Sydney/Melbourne/Perth/Brisbane removals`.

- [x] **SEO-CTX-1.4 Evidence and Limitations**:
  - **Local verification passed**: `npm run build`; `node scripts/seo-validate.mjs`; `node --test tests/search-console-fixes.test.mjs`; `node --test tests/seo-conversion-pass.test.mjs`; `node --test tests/eeat-audit.test.mjs`.
  - **Live checks passed**: `robots.txt` returned `200`; `sitemap.xml` returned a sitemap index; apex, `www`, HTTP-to-HTTPS, `adelaide-cbd.html`, and `removalists-semore/` checks resolved without multi-hop defects in sampled requests.
  - **Performance limitation**: PageSpeed Insights API returned `429 RESOURCE_EXHAUSTED`; local Lighthouse collection was attempted but the CLI appended a local port to the remote HTTPS URL and was stopped. Core Web Vitals field data must be captured in Search Console/CrUX or a correctly configured Lighthouse CI run.
  - **Off-page limitation**: No Ahrefs/Semrush/Moz/GSC backlink export was available in this environment, so backlink toxicity and authority estimates require an external export before closure.
  - **Guideline references**: Google Search Central SEO starter guide, robots/sitemaps/canonical guidance, structured data general guidelines, local business structured data guidelines, Rich Results Test, and web.dev Core Web Vitals/TTFB guidance.

---

## Audit Findings

### 1. Crawlability and Indexing

- [x] **SEO-FIND-1.1 Crawl and sitemap baseline is healthy**:
  - **Location**: `https://zqremovals.au/robots.txt`, `https://zqremovals.au/sitemap.xml`, `scripts/build-site.mjs`
  - **Description**: Production `robots.txt` allows crawling and points to `https://zqremovals.au/sitemap-index.xml`. Production `sitemap.xml` is a sitemap index with pages, services, suburbs, guides, and image sitemaps. Generated sitemap locations use the apex host.
  - **Impact**: Low
  - **Effort**: Low
  - **Recommendation**: Keep the sitemap index submitted in Google Search Console and validate after every deploy.

- [x] **SEO-FIND-1.2 Indexability controls are passing locally**:
  - **Location**: Generated `site-dist/**/*.html`, `site-src/pages.json`, `site-src/data/seo-v4.mjs`
  - **Description**: Output crawl found `288` indexable pages and `32` noindex pages. Sequential regression tests passed sitemap, noindex, canonical, host-consistency, redirect, and broken-link checks.
  - **Impact**: Low
  - **Effort**: Low
  - **Recommendation**: Keep the focused Search Console regression test as the release gate.

- [x] **SEO-FIND-1.3 Sitemap loc count needs clearer reporting split**:
  - **Location**: `site-dist/sitemap*.xml`
  - **Description**: Combined sitemap extraction found `586` `<loc>` values because the count includes the sitemap index, page URLs, and image sitemap URLs. This is valid, but reporting should separate page URLs from image URLs to avoid Search Console triage confusion.
  - **Impact**: Medium
  - **Effort**: 1-2 hours
  - **Recommendation**: Add a sitemap summary script that reports `indexable_page_locs`, `image_locs`, `noindex_exclusions`, and `redirect_exclusions` separately.

- [x] **SEO-FIND-1.4 Legacy redirects are healthy in sampled live checks**:
  - **Location**: `vercel.json`, live URLs
  - **Description**: Sampled redirects: `http://zqremovals.au/` to HTTPS in `1` hop; `https://www.zqremovals.au/` to apex in `1` hop; `adelaide-cbd.html` to `/removalists-adelaide-cbd/` in `1` hop; `/removalists-semore/` returns `308` to `/removalists-semaphore/`.
  - **Impact**: Low
  - **Effort**: Low
  - **Recommendation**: Keep future legacy aliases as direct canonical-route redirects with trailing slash.

### 2. Technical Health Assessment

- [x] **SEO-FIND-2.1 Build health depends on platform-specific optional packages**:
  - **Location**: `package-lock.json`, `node_modules/lightningcss`, `scripts/build-site.mjs`
  - **Description**: Initial build failed with `Cannot find module '../lightningcss.linux-x64-gnu.node'`. Running `npm install` installed the missing optional native package and the build then passed.
  - **Impact**: High
  - **Effort**: 1-2 hours
  - **Recommendation**: In CI and local runbooks, require `npm ci` after OS/runtime changes. Add a troubleshooting note for WSL/Linux optional dependencies.

- [x] **SEO-FIND-2.2 NPM audit reports moderate and low dependency issues**:
  - **Location**: `package.json`, `package-lock.json`
  - **Description**: `npm audit --json` reported `8` vulnerabilities: `3` low and `5` moderate, mostly through `@lhci/cli`, `qs`, `uuid`, `tmp`, `ws`, and related transitive dependencies.
  - **Impact**: Medium
  - **Effort**: 0.5-1 day
  - **Recommendation**: Run `npm audit fix` in a branch, verify `npm run build`, `npm test`, and Lighthouse tooling. Avoid `--force` unless the LHCI downgrade/major change is reviewed.

- [ ] **SEO-FIND-2.3 HTTPS and security headers are strong in production**:
  - **Location**: `vercel.json`, live response headers
  - **Description**: Production responses include HSTS with preload, CSP, `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, and `Permissions-Policy`. No mixed HTTP internal URLs were found in SEO validations.
  - **Impact**: Low
  - **Effort**: Low
  - **Recommendation**: Keep the CSP updated when analytics or form providers change.

- [ ] **SEO-FIND-2.4 Analytics exists but depends on environment variables**:
  - **Location**: `scripts/build-site.mjs`, `analytics.mjs`, `TRACKING_V2.md`
  - **Description**: The generator can inject delayed GA4/GTM/Meta tracking and quote events. Tests confirm env-driven analytics hooks. Production tracking is only active when env vars such as `VITE_GA_MEASUREMENT_ID=G-MNHNPP0087` are set at build/deploy time.
  - **Impact**: High
  - **Effort**: 1-2 hours
  - **Recommendation**: Verify Vercel production env vars and GA4 DebugView after deploy. Organic lead ROI cannot be trusted until GA4, GSC, and quote events are confirmed live.

### 3. Site Performance and Core Web Vitals

- [ ] **SEO-FIND-3.1 Field Core Web Vitals were not measurable from this environment**:
  - **Location**: PageSpeed Insights API, Lighthouse CI attempt
  - **Description**: PageSpeed Insights returned quota error `429 RESOURCE_EXHAUSTED`. Local LHCI was attempted but mis-targeted the remote URL as `https://zqremovals.au:<localPort>/`.
  - **Impact**: High
  - **Effort**: 2-4 hours
  - **Recommendation**: Run PSI manually or with an authenticated quota, and fix LHCI config so it audits the local static dist URLs or the live URL directly. Track LCP <= 2.5s, INP <= 200ms, CLS <= 0.1, and TTFB <= 800ms per web.dev guidance.

- [ ] **SEO-FIND-3.2 Static asset weight is mostly controlled**:
  - **Location**: `site-dist/premium-site.min.css`, `site-dist/site.js`, `site-dist/media/**`
  - **Description**: Built CSS is `72K`, JS is `20K`, homepage hero WebP is `44K`, contact hero WebP is `32K`. Largest discovered image asset is `zq-removals-social-share.webp` at `226,080` bytes.
  - **Impact**: Medium
  - **Effort**: 2-4 hours
  - **Recommendation**: Add performance budgets for CSS <= 80KB, JS <= 30KB, and LCP image <= 100KB unless intentionally exempted.

- [ ] **SEO-FIND-3.3 Live TTFB samples are acceptable but should be monitored**:
  - **Location**: Live sampled URLs
  - **Description**: Curl `time_starttransfer` samples: homepage `0.136s`, `/removalists-adelaide/` `0.428s`, `/contact-us/` `0.411s`, `/adelaide-moving-guides/moving-cost-adelaide-2026/` `0.384s`, `/removalists-semore/` redirect `0.100s`.
  - **Impact**: Low
  - **Effort**: Low
  - **Recommendation**: Keep Vercel caching headers for immutable assets and monitor TTFB in CrUX/Search Console.

### 4. Mobile-Friendliness

- [ ] **SEO-FIND-4.1 Mobile readiness has regression coverage but needs live visual sampling**:
  - **Location**: `premium-site.css`, `tests/search-console-fixes.test.mjs`, `tests/seo-conversion-pass.test.mjs`
  - **Description**: Tests confirm responsive media queries, mobile call/quote access, image dimensions, and accessible markup. No live mobile screenshot audit was captured in this run.
  - **Impact**: Medium
  - **Effort**: 2-3 hours
  - **Recommendation**: Add Playwright mobile screenshots for homepage, quote form, suburb page, service page, and guide article at 390px and 768px widths.

- [ ] **SEO-FIND-4.2 AMP is not applicable**:
  - **Location**: Site-wide
  - **Description**: No AMP implementation exists. For this static local-service site, responsive HTML is the correct primary mobile strategy.
  - **Impact**: Low
  - **Effort**: None
  - **Recommendation**: Do not add AMP unless a future analytics case proves a need.

### 5. HTTPS and Security

- [ ] **SEO-FIND-5.1 CSP allows inline scripts/styles for current implementation**:
  - **Location**: `vercel.json`
  - **Description**: CSP includes `'unsafe-inline'` for scripts and styles because the generator injects inline analytics/config and the site uses inline behavior. This is common for static sites but weaker than nonce/hash-based CSP.
  - **Impact**: Medium
  - **Effort**: 1-2 days
  - **Recommendation**: Long-term, move inline scripts to bundled files or use CSP hashes/nonces. Short-term, keep provider allowlists narrow.

### 6. Structured Data and Schema Markup

- [x] **SEO-FIND-6.1 JSON-LD is valid and host-consistent locally**:
  - **Location**: Generated HTML, `scripts/build-site.mjs`, `site-src/data/seo-v4.mjs`
  - **Description**: Output crawl found `0` JSON-LD parse errors. Sequential tests passed host consistency, supported business facts, required schema types, FAQ, breadcrumb, article, and service schema checks.
  - **Impact**: Low
  - **Effort**: Low
  - **Recommendation**: Validate changed templates with Google Rich Results Test before deployment.

- [x] **SEO-FIND-6.2 Schema coverage is broad**:
  - **Location**: Generated HTML
  - **Description**: Output crawl detected `297` FAQ schema blocks, `296` breadcrumb blocks, and `320` MovingCompany occurrences. Schema matches visible FAQ and breadcrumb content according to local tests.
  - **Impact**: Low
  - **Effort**: Low
  - **Recommendation**: Avoid adding duplicate FAQ/Breadcrumb blocks. Keep service and local business schema tied to visible content only.

- [ ] **SEO-FIND-6.3 Rich Results evidence still needs live validation artifacts**:
  - **Location**: Priority URLs
  - **Description**: Local JSON-LD parsing passed, but no Google Rich Results Test screenshots or exported validation URLs were captured in this run.
  - **Impact**: Medium
  - **Effort**: 1-2 hours
  - **Recommendation**: Validate homepage, `/removalists-adelaide/`, `/house-removals-adelaide/`, `/removalists-adelaide-cbd/`, and one guide URL in Rich Results Test after deploy.

### 7. On-Page SEO Elements

- [x] **SEO-FIND-7.1 Metadata uniqueness is strong**:
  - **Location**: Generated `site-dist/**/*.html`
  - **Description**: Output crawl found `0` duplicate titles, `0` duplicate meta descriptions, and `0` indexable pages with invalid H1 count.
  - **Impact**: Low
  - **Effort**: Low
  - **Recommendation**: Keep uniqueness assertions in CI.

- [x] **SEO-FIND-7.2 Some title tags exceed conservative 65-character guardrail**:
  - **Location**: `site-src/pages.json`, generated pages
  - **Description**: Sample long titles include `/office-removals-adelaide/` at `72`, `/house-removals-adelaide/` at `71`, `/furniture-removalists-adelaide/` at `71`, and several interstate/service pages at `68-70`.
  - **Impact**: Medium
  - **Effort**: 2-4 hours
  - **Recommendation**: Shorten priority commercial titles to preserve primary keyword and CTA within likely SERP display width.

- [ ] **SEO-FIND-7.3 Some meta descriptions are below 120 characters**:
  - **Location**: Generated guide and apartment/service-suburb pages
  - **Description**: Sample short descriptions include guide pages at `110-119` chars and several apartment-suburb pages at `112-117` chars.
  - **Impact**: Low
  - **Effort**: 3-5 hours
  - **Recommendation**: Expand only priority pages where GSC shows impressions and low CTR. Do not bulk-pad descriptions without query evidence.

- [ ] **SEO-FIND-7.4 E-E-A-T signals are materially improved but need proof assets**:
  - **Location**: `/about/`, homepage, service pages, generated schema
  - **Description**: Tests confirm the about page is built and surfaced, unsupported aggregate ratings are avoided, and generated pages use current WebP assets. The remaining gap is external proof: review screenshots, team/vehicle photography, insurance documentation notes, and real customer proof.
  - **Impact**: High
  - **Effort**: 1-2 weeks
  - **Recommendation**: Add verified review widgets/quotes, real crew/vehicle images, service-area proof, and a documented review response workflow.

### 8. Image Optimization

- [x] **SEO-FIND-8.1 Image accessibility and layout stability passed locally**:
  - **Location**: Generated HTML and `tests/seo-conversion-pass.test.mjs`
  - **Description**: Output crawl found `513` image tags, `0` missing alt attributes, and `0` missing width/height attributes.
  - **Impact**: Low
  - **Effort**: Low
  - **Recommendation**: Keep the existing image-dimension tests and use WebP/AVIF for new imagery.

- [x] **SEO-FIND-8.2 Social share image is the largest raster asset**:
  - **Location**: `site-dist/media/zq-removals-social-share.webp`
  - **Description**: The largest discovered raster is `226KB`. This is acceptable for social sharing but should not become an LCP asset.
  - **Impact**: Low
  - **Effort**: 1 hour
  - **Recommendation**: Keep social share assets separate from hero/LCP image paths and add a max-size check for route hero assets.

### 9. Internal Linking and Anchor Text

- [x] **SEO-FIND-9.1 Internal linking regression tests pass**:
  - **Location**: `tests/search-console-fixes.test.mjs`, `tests/seo-conversion-pass.test.mjs`
  - **Description**: Tests passed for root-absolute internal hrefs, cluster discovery links, guide-to-money-page links, suburb-to-service links, route hub links, and no broken internal links.
  - **Impact**: Low
  - **Effort**: Low
  - **Recommendation**: Keep cluster link generation centralized in `site-src/data/**` rather than patching generated HTML.

- [ ] **SEO-FIND-9.2 Large generated footprint increases cannibalization risk**:
  - **Location**: Generated suburb, service-suburb, comparison, guide, and route pages
  - **Description**: The site now has `288` indexable pages. This supports long-tail coverage, but overlapping fixed-price, cheap, budget, quote, cost, and service-suburb terms can compete if GSC shows the wrong canonical ranking.
  - **Impact**: High
  - **Effort**: 1-2 weeks
  - **Recommendation**: Use GSC query/page exports to map primary keyword ownership and consolidate or retarget pages with cannibalization.

### 10. User Experience Signals

- [ ] **SEO-FIND-10.1 Quote path is covered but engagement metrics are not verified live**:
  - **Location**: Homepage, `/contact-us/`, `analytics.mjs`
  - **Description**: Tests confirm quote forms and event hooks, but GA4 live data was not available to inspect bounce rate, dwell time, pages/session, organic landing-page conversion, or site search behavior.
  - **Impact**: High
  - **Effort**: 2-4 hours
  - **Recommendation**: Confirm GA4 collection, quote submit events, click-to-call events, scroll depth, and organic landing-page conversion reports.

- [x] **SEO-FIND-10.2 Custom 404 exists and is noindex**:
  - **Location**: `404.html`
  - **Description**: The generated 404 page is noindex and built through the standard template.
  - **Impact**: Low
  - **Effort**: Low
  - **Recommendation**: Ensure Vercel routes unknown paths to the custom 404 in production.

### 11. Backlink Profile and Domain Trust

- [ ] **SEO-FIND-11.1 Backlink toxicity cannot be closed without export data**:
  - **Location**: External backlink tools / GSC Links report
  - **Description**: No backlink export was available. Toxic links, anchor distribution, link velocity, broken backlinks, DA/PA equivalents, and competitor link gaps cannot be responsibly scored from repo data alone.
  - **Impact**: High
  - **Effort**: 0.5-1 day for export review
  - **Recommendation**: Export GSC Links plus Ahrefs/Semrush/Moz data. Flag irrelevant/spam domains, exact-match anchor spikes, lost links, and redirectable broken backlinks.

- [ ] **SEO-FIND-11.2 Off-page trust opportunity is local-first**:
  - **Location**: Google Business Profile, local directories, supplier/partner links, community pages
  - **Description**: Competitors in Adelaide removals commonly have stronger directory, review, and brand/entity footprints. ZQ should prioritize relevant local citations and editorial local proof over generic guest posting.
  - **Impact**: High
  - **Effort**: 1-3 months
  - **Recommendation**: Build citations and earned links from Adelaide/local business directories, moving/storage partners, real estate/property managers, chambers, local sponsorships, and useful moving guides.

### 12. Local SEO

- [ ] **SEO-FIND-12.1 Google Business Profile is business-critical**:
  - **Location**: GBP, `sameAs` schema, homepage/about links
  - **Description**: The site references a Google profile URL and Facebook profile in schema. GBP optimization, categories, services, photos, reviews, Q&A, and NAP consistency need live verification.
  - **Impact**: Critical
  - **Effort**: 1-2 days initial, weekly maintenance
  - **Recommendation**: Verify GBP primary category, service areas, hours, phone, booking URL, services, photos, review responses, and UTM-tagged website link.

- [ ] **SEO-FIND-12.2 NAP consistency needs citation audit**:
  - **Location**: Site schema, footer/contact, external citations
  - **Description**: Local business schema and visible contact details must match every major citation. External citation data was not available in this run.
  - **Impact**: High
  - **Effort**: 1 week
  - **Recommendation**: Audit Google, Apple Maps, Bing Places, Facebook, Yellow Pages, True Local, Oneflare/Hipages-style profiles if used, and local directories.

### 13. Content Marketing and Promotion

- [ ] **SEO-FIND-13.1 Guide library is substantial but needs distribution**:
  - **Location**: `/adelaide-moving-guides/**`
  - **Description**: Tests confirm a 30+ post guide cluster with service links and FAQ support. Organic value depends on refreshing, internal linking from money pages, and external distribution.
  - **Impact**: High
  - **Effort**: Ongoing
  - **Recommendation**: Create quarterly refresh cycles for pricing, checklist, apartment, office, packing, and interstate guides; distribute through GBP posts, Facebook, citations, and partner outreach.

### 14. International SEO

- [x] **SEO-FIND-14.1 International SEO is not applicable yet**:
  - **Location**: Site-wide
  - **Description**: The business targets Australia and uses one English-Australian site. No hreflang or currency/regulatory regional variants are needed.
  - **Impact**: Low
  - **Effort**: None
  - **Recommendation**: Reassess only if non-Australian pages or multilingual content launch.

### 15. Analytics and Monitoring

- [ ] **SEO-FIND-15.1 Search Console workflow exists but needs data-backed prioritization**:
  - **Location**: `scripts/gsc-*.mjs`, `docs/gsc-codex-workflow.md`, `GOOGLE_SEARCH_CONSOLE_PLAN.md`
  - **Description**: Repo includes GSC scripts and planning docs. This audit did not have authenticated GSC performance/index data, so rankings, CTR, query gaps, and page-level ROI are not data-closed.
  - **Impact**: High
  - **Effort**: 0.5-1 day
  - **Recommendation**: Pull last 16 months of GSC data, segment by page type, and prioritize pages with high impressions, low CTR, and quote-intent queries.

- [ ] **SEO-FIND-15.2 Rank tracking and competitor dashboards are not verified**:
  - **Location**: External rank tracker / dashboards
  - **Description**: No configured rank tracker, keyword dashboard, or competitor content/backlink gap dashboard was available.
  - **Impact**: Medium
  - **Effort**: 1-2 days
  - **Recommendation**: Track mobile and desktop rankings for Adelaide, suburb, service, route, and guide terms against competitors such as Door 2 Door Movers, Kent Removals & Storage, Grace Removals, Allied Moving Services, and local Adelaide removalists directories.

---

## Remediation Recommendations

### Immediate

- [x] **SEO-REC-1.1 Fix reproducible dependency install path**:
  - **Priority**: High
  - **Effort**: 1-2 hours
  - **Expected Outcome**: Prevents build failures from missing native optional dependencies.
  - **Validation**: Fresh clone or clean CI runs `npm ci && npm run build`.

- [ ] **SEO-REC-1.2 Verify production analytics and conversion events**:
  - **Priority**: Critical
  - **Effort**: 2-4 hours
  - **Expected Outcome**: Organic leads, click-to-call actions, and quote submissions become measurable.
  - **Validation**: GA4 DebugView shows page_view, quote submit, click-to-call, and organic landing-page events.

- [x] **SEO-REC-1.3 Capture Core Web Vitals field/lab evidence**:
  - **Priority**: High
  - **Effort**: 2-4 hours
  - **Expected Outcome**: Performance work is prioritized by measured LCP, INP, CLS, and TTFB rather than assumptions.
  - **Validation**: PSI/GSC screenshots or exports for mobile and desktop priority pages.

- [x] **SEO-REC-1.4 Validate structured data in Google tools**:
  - **Priority**: High
  - **Effort**: 1-2 hours
  - **Expected Outcome**: Rich-result eligibility is confirmed outside local JSON parsing.
  - **Validation**: Rich Results Test URLs/screenshots for homepage, service, suburb, guide, and route templates.

### Short-Term

- [x] **SEO-REC-2.1 Shorten long priority titles**:
  - **Priority**: Medium
  - **Effort**: 2-4 hours
  - **Expected Outcome**: Better SERP readability and less title rewriting.
  - **Validation**: Output crawl reports no priority title over `65` characters; monitor GSC CTR.

- [x] **SEO-REC-2.2 Separate sitemap reporting by URL type**:
  - **Priority**: Medium
  - **Effort**: 1-2 hours
  - **Expected Outcome**: Faster indexation triage in Search Console.
  - **Validation**: CI output reports page sitemap count, image sitemap count, noindex exclusions, redirect exclusions.

- [x] **SEO-REC-2.3 Add Playwright mobile visual checks**:
  - **Priority**: Medium
  - **Effort**: 0.5-1 day
  - **Expected Outcome**: Mobile layout regressions and CTA/heading overlap are caught before deploy.
  - **Validation**: CI artifacts include 390px/768px screenshots for priority templates.

- [x] **SEO-REC-2.4 Review npm audit fixes safely**:
  - **Priority**: Medium
  - **Effort**: 0.5-1 day
  - **Expected Outcome**: Lower supply-chain/security risk without breaking LHCI/build tooling.
  - **Validation**: `npm audit --json` has no high/critical issues and reduced moderate count; tests pass.

### Long-Term

- [ ] **SEO-REC-3.1 Build GSC-led keyword ownership map**:
  - **Priority**: High
  - **Effort**: 1-2 weeks
  - **Expected Outcome**: Cannibalization is reduced and priority pages are matched to the right query sets.
  - **Validation**: Each high-value query has one preferred page, with GSC impressions/clicks monitored monthly.

- [ ] **SEO-REC-3.2 Execute local authority campaign**:
  - **Priority**: High
  - **Effort**: 1-3 months
  - **Expected Outcome**: Stronger local trust, citation consistency, and backlink relevance.
  - **Validation**: New relevant referring domains, consistent NAP citations, GBP growth, and referral traffic.

- [ ] **SEO-REC-3.3 Expand real-world E-E-A-T assets**:
  - **Priority**: High
  - **Effort**: 1-2 months
  - **Expected Outcome**: Better trust and conversion from local service pages.
  - **Validation**: Real photos, review proof, team/service credentials, and GBP review growth appear on priority pages.

- [ ] **SEO-REC-3.4 Establish recurring content refresh calendar**:
  - **Priority**: Medium
  - **Effort**: Ongoing
  - **Expected Outcome**: Pricing, guide, and suburb pages stay current and defensible.
  - **Validation**: Quarterly updates to top guide/service pages; GSC freshness and CTR review.

---

## Proposed Code Changes

- [x] **SEO-CODE-1.1 Add sitemap count reporting helper**:
  - **Priority**: Medium
  - **Effort**: 1-2 hours
  - **Patch-style diff**:

```diff
diff --git a/scripts/seo-validate.mjs b/scripts/seo-validate.mjs
@@
+// Report sitemap composition separately so page URLs are not confused with image URLs.
+function summarizeSitemaps(distRoot) {
+  const groups = ['sitemap-pages.xml', 'sitemap-services.xml', 'sitemap-suburbs.xml', 'sitemap-guides.xml', 'sitemap-images.xml'];
+  return Object.fromEntries(groups.map((file) => {
+    const xml = readFileSync(path.join(distRoot, file), 'utf8');
+    return [file, (xml.match(/<loc>/g) || []).length];
+  }));
+}
```

- [x] **SEO-CODE-1.2 Tighten Lighthouse CI target and thresholds**:
  - **Priority**: High
  - **Effort**: 2-4 hours
  - **Patch-style diff**:

```diff
diff --git a/.lighthouserc.cjs b/.lighthouserc.cjs
@@
     assert: {
       assertions: {
-        'categories:performance': ['warn', { minScore: 0.8 }],
+        'categories:performance': ['warn', { minScore: 0.9 }],
         'categories:accessibility': ['warn', { minScore: 0.9 }],
         'categories:seo': ['error', { minScore: 0.9 }],
         'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
         'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
-        'total-blocking-time': ['warn', { maxNumericValue: 300 }],
+        'total-blocking-time': ['warn', { maxNumericValue: 200 }],
+        'server-response-time': ['warn', { maxNumericValue: 800 }],
       },
     },
```

- [x] **SEO-CODE-1.3 Add title/meta length report for priority pages**:
  - **Priority**: Medium
  - **Effort**: 2-4 hours
  - **Patch-style diff**:

```diff
diff --git a/scripts/seo-validate.mjs b/scripts/seo-validate.mjs
@@
+const metadataWarnings = pages
+  .filter((page) => page.indexable)
+  .filter((page) => page.title.length > 65 || page.description.length < 120 || page.description.length > 165)
+  .map((page) => ({
+    url: page.url,
+    titleLength: page.title.length,
+    descriptionLength: page.description.length,
+  }));
+if (metadataWarnings.length) {
+  console.warn('metadata warnings', metadataWarnings);
+}
```

- [x] **SEO-CODE-1.4 Add mobile screenshot verification**:
  - **Priority**: Medium
  - **Effort**: 0.5-1 day
  - **Patch-style diff**:

```diff
diff --git a/package.json b/package.json
@@
   "scripts": {
     "build": "node scripts/build-site.mjs",
+    "test:visual-mobile": "playwright test tests/mobile-seo-visual.spec.ts",
     "test": "node scripts/quote-api-smoke.mjs && node scripts/run-node-tests.mjs",
```

---

## Commands

- [ ] **SEO-CMD-1.1 Local build**:

```bash
npm ci
npm run build
```

- [ ] **SEO-CMD-1.2 Full regression suite**:

```bash
npm test
```

- [ ] **SEO-CMD-1.3 Focused SEO verification**:

```bash
node scripts/seo-validate.mjs
node --test tests/search-console-fixes.test.mjs
node --test tests/seo-conversion-pass.test.mjs
node --test tests/eeat-audit.test.mjs
```

- [ ] **SEO-CMD-1.4 Live crawl smoke checks**:

```bash
curl -I https://zqremovals.au/robots.txt
curl -I https://zqremovals.au/sitemap.xml
curl -I -L https://www.zqremovals.au/
curl -I -L https://zqremovals.au/adelaide-cbd.html
```

- [ ] **SEO-CMD-1.5 Performance and tracking checks**:

```bash
npx lhci collect --config=.lighthouserc.cjs
npm audit --json
node scripts/gsc-fetch.mjs
node scripts/gsc-analyze-opportunities.mjs
```

---

## Competitive Benchmarking and Keyword Opportunities

- [ ] **SEO-COMP-1.1 Competitor set for tracking**:
  - **Competitors**: Door 2 Door Movers, Kent Removals & Storage, Grace Removals, Allied Moving Services, Find a Mover directory results, and high-ranking local Adelaide removalist pages.
  - **Benchmark metrics**: Ranking page type, title angle, reviews, GBP category/services, backlink count/quality, suburb coverage, interstate coverage, pricing content, and guide depth.
  - **Validation**: Monthly mobile/desktop rank export for priority terms.

- [ ] **SEO-COMP-1.2 High-intent keyword opportunities**:
  - **Targets**: `fixed price removalists Adelaide`, `removalist cost Adelaide 2026`, `office relocation Adelaide CBD`, `apartment removalists Adelaide CBD`, `packing services Adelaide`, `furniture removalists Adelaide`, `Adelaide to Sydney removalists`, `Adelaide to Melbourne removalists`, and suburb combinations with access constraints.
  - **Recommendation**: Prioritize pages already receiving impressions but low CTR before creating new pages.
  - **Validation**: GSC query/page report confirms impressions, CTR, and average position before and after title/content changes.

- [ ] **SEO-COMP-1.3 Content gap themes**:
  - **Gaps**: Real pricing examples, lift/loading dock move planning, heavy item handling, moving with settlement dates, office downtime planning, packing timeline by move size, and suburb-specific access notes.
  - **Recommendation**: Refresh existing guide pages first; create new guides only when query data shows a distinct intent.
  - **Validation**: New or refreshed pages gain impressions without cannibalizing money pages.

---

## Quality Assurance Task Checklist

- [ ] **SEO-QA-1.1 Findings reference evidence**: Local command outputs, generated counts, live header checks, and code locations are included above.
- [ ] **SEO-QA-1.2 Critical tool evidence gap**: PageSpeed/Rich Results screenshots still need manual capture because PSI was quota-blocked and Rich Results Test was not accessible from CLI.
- [ ] **SEO-QA-1.3 Competitor benchmark gap**: Competitor priorities are identified, but authority/backlink/ranking data requires external exports.
- [ ] **SEO-QA-1.4 Google guideline coverage**: Recommendations align with Google Search Central guidance for crawlability, canonicalization, links, structured data, local business schema, and web.dev Core Web Vitals thresholds.
- [ ] **SEO-QA-1.5 Code examples included**: Patch-style examples are provided for sitemap reporting, LHCI thresholds, metadata warnings, and visual testing.
- [ ] **SEO-QA-1.6 Validation included**: Every recommendation includes a validation method.
- [ ] **SEO-QA-1.7 ROI grounding**: ROI projections remain qualitative until GA4/GSC/rank/backlink exports are connected.

---

## Source References

- [ ] **SEO-SRC-1.1 Google SEO Starter Guide**: https://developers.google.com/search/docs/fundamentals/seo-starter-guide
- [ ] **SEO-SRC-1.2 Google robots.txt documentation**: https://developers.google.com/search/docs/crawling-indexing/robots/intro
- [ ] **SEO-SRC-1.3 Google sitemap documentation**: https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview
- [ ] **SEO-SRC-1.4 Google canonical documentation**: https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls
- [ ] **SEO-SRC-1.5 Google structured data guidelines**: https://developers.google.com/search/docs/appearance/structured-data/sd-policies
- [ ] **SEO-SRC-1.6 Google LocalBusiness structured data**: https://developers.google.com/search/docs/appearance/structured-data/local-business
- [ ] **SEO-SRC-1.7 Google Rich Results Test**: https://search.google.com/test/rich-results
- [ ] **SEO-SRC-1.8 web.dev Core Web Vitals**: https://web.dev/articles/vitals
- [ ] **SEO-SRC-1.9 web.dev TTFB guidance**: https://web.dev/articles/ttfb
