# SEO Audit TODO — ZQ Removals

## Context

- **Site URL**: `https://zqremovals.au/`
- **Scope**: Full-site audit (all indexable routes under the root domain)
- **Stack**: Custom Node.js static site generator (`scripts/build-site.mjs`) deployed on Vercel; frontend script `site.js`; source content in `site-src/`
- **Target markets**: Australia — primary focus South Australia (Adelaide metro and surrounding suburbs); secondary focus interstate routes (Adelaide → Melbourne, Adelaide → Sydney)
- **Languages / regions**: English (Australia) only; `lang="en-AU"` set in HTML template; no international variants required
- **Primary business goals**:
  - Drive inbound quote requests via the `/contact-us/` form and the homepage embedded form
  - Rank for local Adelaide removalists queries and high-value suburban terms
  - Capture interstate removal intent (Adelaide → Melbourne, Adelaide → Sydney)
  - Build topical authority through the `/adelaide-moving-guides/` hub
- **Primary keyword themes**: Adelaide removalists, local removals Adelaide, interstate removals Adelaide, office removals Adelaide, furniture removalists Adelaide, packing services Adelaide, suburb-level variations (e.g., "removalists Marion", "removalists Salisbury")

---

## Audit Findings

### 1. Crawlability and Indexing

- [ ] **SEO-FIND-1.1 — robots.txt is minimal but functional**
  - **Location**: `/robots.txt`
  - **Description**: `robots.txt` contains `User-agent: * / Allow: /` and the correct sitemap declaration (`Sitemap: https://zqremovals.au/sitemap.xml`). No blocking rules are present. All indexable pages are reachable. No unintentional `Disallow` directives were found.
  - **Impact**: Low (no active problem; baseline confirmed clean)
  - **Recommendation**: No changes needed. Monitor after any Vercel config or build-script changes to ensure the sitemap URL stays accurate.

- [ ] **SEO-FIND-1.2 — Sitemap is generated at build time and not committed to the repo**
  - **Location**: `scripts/build-site.mjs` → `renderSitemap(pages)` → `site-dist/sitemap.xml`
  - **Description**: The sitemap is produced dynamically from `pages.json` during `npm run build` and written to `site-dist/`. It is not committed to the repository. If a deployment fails silently or an old deploy is cached, the sitemap could drift from the live page set.
  - **Impact**: Medium — stale or missing sitemap slows new page discovery in Google Search Console
  - **Recommendation**: After every production deployment, re-submit `https://zqremovals.au/sitemap.xml` in Search Console (see `GOOGLE_SEARCH_CONSOLE_PLAN.md`). Consider adding a post-deploy smoke test that fetches `/sitemap.xml` and asserts a `200` status and a non-empty response body.

- [ ] **SEO-FIND-1.3 — Lower-priority suburb pages are absent from the primary navigation**
  - **Location**: `site-src/partials/header.html` (desktop and mobile nav)
  - **Description**: The navigation includes five featured suburb pages (Adelaide CBD, Marion, Salisbury, Elizabeth, Glenelg). Seven additional suburb pages (Norwood, North Adelaide, Hallett Cove, Seaford, Southern Adelaide, Mawson Lakes, Andrews Farm) are reachable only from the footer and from the `removalists-adelaide` hub. No breadcrumb or context link is missing, but these pages sit at click depth ≥ 3 from the homepage for a user following only nav links.
  - **Impact**: Medium — pages outside the primary nav accumulate less internal link equity and may be crawled less frequently
  - **Recommendation**: Ensure all suburb pages are listed in the `/removalists-adelaide/` hub with clear anchor text links. Confirm the footer lists every suburb page (it currently does). Consider adding a "More suburbs" section to the desktop nav dropdown or a sitemap-style directory page at `/removalists-adelaide/all-suburbs/` if the suburb count grows.

- [ ] **SEO-FIND-1.4 — `noindex` directive is applied only to non-commercial concept pages**
  - **Location**: `site-src/pages.json` (pages with `"robots": "noindex,nofollow"`)
  - **Description**: Pages under `/premium-moving-concepts/` are correctly set to `noindex,nofollow`. All other commercial, suburb, route, and guide pages are set to `index,follow,max-image-preview:large`. No unintentional `noindex` was found.
  - **Impact**: Low (no active problem; confirmed correct)
  - **Recommendation**: Run a periodic check (e.g., using Google Search Console's Index Coverage report) to verify that noindex pages are excluded from the index and that no commercial page has accidentally been given a noindex directive after a pages.json edit.

- [ ] **SEO-FIND-1.5 — Redirect chains are single-hop for all documented redirects**
  - **Location**: `vercel.json` (redirects array)
  - **Description**: All current redirects are single-hop 301 redirects. No multi-hop chains were identified. Old URL variants for `/interstate-removalists-adelaide/`, `/privacy-policy/`, and `/terms-and-conditions/` are properly redirected in one step.
  - **Impact**: Low (no active problem)
  - **Recommendation**: Review `vercel.json` whenever new redirects are added to confirm a new entry does not point to an already-redirected destination.

---

### 2. Technical Health

- [ ] **SEO-FIND-2.1 — No Google Analytics 4 or tag manager implementation found**
  - **Location**: `site-src/templates/standard.html`, `site-src/templates/bare.html`
  - **Description**: No GA4 `gtag.js` snippet, Google Tag Manager container, or equivalent analytics script is present in any template file or page content. Without analytics, organic traffic performance, conversion events, and bounce rate cannot be measured.
  - **Impact**: High — without measurement, no SEO progress can be validated, ranked pages cannot be identified, and the quote-form conversion rate is invisible
  - **Recommendation**: Add a GA4 measurement ID snippet to `site-src/templates/standard.html` in the `<head>` section. If Tag Manager is preferred, add the GTM container snippet instead. Configure a custom event for quote form submissions (`/api/quote` success response) so conversion rate from organic traffic is tracked.

- [ ] **SEO-FIND-2.2 — No server-side Google Search Console verification tag in the HTML template**
  - **Location**: `site-src/templates/standard.html`
  - **Description**: Google Search Console ownership verification is described in `GOOGLE_SEARCH_CONSOLE_PLAN.md` as a DNS TXT method. If the DNS TXT record is removed or ownership is reset, there is no HTML-based fallback. The `<meta name="google-site-verification">` tag provides a secondary verification method.
  - **Impact**: Medium — loss of DNS verification would disconnect Search Console data from the property
  - **Recommendation**: Add `<meta name="google-site-verification" content="VERIFICATION_TOKEN" />` to `renderHead()` in `scripts/build-site.mjs` as a secondary ownership signal. Keep the DNS TXT record as the primary method.

- [ ] **SEO-FIND-2.3 — HTTPS enforcement relies on Vercel platform settings**
  - **Location**: Vercel project configuration (outside the repository)
  - **Description**: HTTPS is not explicitly enforced via an `X-Forwarded-Proto` redirect in `vercel.json` or in any serverside config within the repo. Vercel enforces HTTPS by default for custom domains, so this is currently handled at the platform level. No HTTP URLs were found in any internal link or canonical.
  - **Impact**: Low (platform handles enforcement; confirmed canonical URLs all use `https://`)
  - **Recommendation**: Confirm that "Force HTTPS" and HSTS are enabled in the Vercel project settings. Add a check to the deployment runbook.

- [ ] **SEO-FIND-2.4 — Hero image uses a non-descriptive AI-generated filename**
  - **Location**: `site-src/content/index.html`, line 32: `src="/media/Gemini_Generated_Image_.png"`
  - **Description**: The hero image file is named `Gemini_Generated_Image_.png`, which provides no keyword signal to image search indexers. Additionally, the file is in PNG format. A descriptive filename and a WebP format would improve image SEO and page load performance. The `alt` attribute on the image is already descriptive ("ZQ Removals movers loading wrapped furniture outside a suburban Adelaide home"), which is positive.
  - **Impact**: Medium — image filename is an indexable signal; AI-generated imagery also reduces E-E-A-T trust vs. genuine operational photography
  - **Recommendation**: Rename the image to `/media/adelaide-removalists-movers-loading-furniture.webp`, replace the AI-generated image with real operational photography when available, and update the `src` reference in `index.html` and in `scripts/build-site.mjs` (which uses `defaultSocialImage`). Until real photos are available, convert the PNG to WebP using the existing `scripts/optimize_images.py` script.

- [ ] **SEO-FIND-2.5 — No preconnect or DNS-prefetch hints for third-party requests**
  - **Location**: `scripts/build-site.mjs` → `renderHead()`
  - **Description**: Fonts are self-hosted (`/fonts/inter-latin.woff2`, `/fonts/fraunces-latin.woff2`), and the `<link rel="preload">` hints for them are already present. The quote form submits to `/api/quote` (same origin). No significant third-party connections were identified in the templates. This is a positive finding — no wasted DNS-prefetch capacity or render-blocking third-party resources.
  - **Impact**: Low (no active problem)
  - **Recommendation**: If Google Analytics 4 or Tag Manager is added (SEO-FIND-2.1), add `<link rel="preconnect" href="https://www.googletagmanager.com" />` immediately before the GTM snippet to reduce connection latency.

- [ ] **SEO-FIND-2.6 — CSS file is referenced as `.min.css` but minification is not verified in the build script**
  - **Location**: `scripts/build-site.mjs`, line 1185: `copyFile(...'premium-site.css'..., ...'premium-site.min.css')`
  - **Description**: The build script copies `premium-site.css` and renames it to `premium-site.min.css` without running any minification step. The `.min` suffix implies minification to browsers and CDN caches, but the file is actually full-size source CSS. This wastes transfer bytes and suggests a missing build step.
  - **Impact**: Medium — unminified CSS adds unnecessary transfer weight, slowing TTFB and LCP on slower mobile connections
  - **Recommendation**: Add a CSS minification step to `scripts/build-site.mjs` using a Node.js minifier such as `lightningcss` or `clean-css`. Alternatively, name the output file `premium-site.css` (drop the `.min` suffix) to avoid the misleading filename until minification is added.

- [ ] **SEO-FIND-2.7 — No Core Web Vitals measurement or monitoring pipeline in place**
  - **Location**: Repository-wide (no Lighthouse CI, no CrUX monitoring)
  - **Description**: There is no Lighthouse CI configuration, no CrUX field data integration, and no performance budget enforced in the deployment pipeline. Core Web Vitals (LCP, FID/INP, CLS, TTFB) can only be checked manually via PageSpeed Insights. Without automated monitoring, regressions will not be detected until rankings or Search Console alerts surface them.
  - **Impact**: High — undetected CWV regressions can depress rankings without any immediate alert
  - **Recommendation**: Integrate Lighthouse CI (`@lhci/cli`) as a GitHub Actions step. Set budgets: LCP ≤ 2.5 s, CLS ≤ 0.1, TBT ≤ 200 ms. Monitor field data (CrUX) in the Search Console Core Web Vitals report weekly. See proposed code changes below.

---

### 3. On-Page and Content

- [ ] **SEO-FIND-3.1 — Title tags and meta descriptions are unique and within target length**
  - **Location**: `site-src/pages.json`, all page entries; rendered via `renderHead()` in `scripts/build-site.mjs`
  - **Description**: All 31 indexable pages have unique title tags and meta descriptions. Title lengths range from approximately 45 to 70 characters. Most core commercial pages are within the 50–60-character target. Meta descriptions are within 150–160 characters on commercial pages and slightly under on a few suburb pages. No duplicate titles or descriptions were found (confirmed by the post-build report in `SEO_AUDIT.md`).
  - **Impact**: Low (no active problem; confirmed clean)
  - **Recommendation**: Audit quarterly. Front-load the primary keyword in title tags where it is not already the first word. Consider adding a soft limit check to `scripts/build-site.mjs` that logs a warning when a title exceeds 65 characters or a description exceeds 165 characters.

- [ ] **SEO-FIND-3.2 — Missing H1 on the brand-logo concept page (noindex route)**
  - **Location**: `site-dist/premium-moving-concepts/brand-logo/index.html` (noindex)
  - **Description**: The post-build audit in `SEO_AUDIT.md` noted that the only page missing an H1 is the brand-logo concept page, which is correctly set to noindex. No indexable page is missing an H1.
  - **Impact**: Low (noindex page; no ranking impact)
  - **Recommendation**: No action required for SEO. For internal consistency, an H1 could be added if the page is ever repurposed.

- [ ] **SEO-FIND-3.3 — Lower-priority suburb pages lack the same depth of bespoke local content as top-five suburb pages**
  - **Location**: Suburb pages for Norwood, North Adelaide, Hallett Cove, Seaford, Southern Adelaide, Mawson Lakes, Andrews Farm
  - **Description**: The five priority suburb pages (Adelaide CBD, Marion, Salisbury, Elizabeth, Glenelg) were substantially rewritten as part of the previous SEO pass (see `SEO_AUDIT.md`). The seven lower-priority suburb pages receive rich local copy and scenario profiles from the build script (via `suburbPageProfiles`), but their source HTML in `site-src/content/` may still contain more generic language at the intro level.
  - **Impact**: Medium — these pages compete for suburb-specific queries and could underperform if content quality is noticeably lower
  - **Recommendation**: Review each lower-priority suburb page source HTML. Apply the same intro-copy quality bar: suburb-specific street references, concrete access-condition language, and three locally differentiated scenarios. Use the same `suburbPageProfiles` model already applied to top pages.

- [ ] **SEO-FIND-3.4 — Guides hub and guide articles have useful content but no FAQ schema**
  - **Location**: `site-src/content/adelaide-moving-guides/` and child guide articles
  - **Description**: The FAQ schema generator (`buildFaqJsonLd`) relies on `<article class="faq-item">` markup with `<h3 class="faq-question">` and `<p itemprop="text">` children. Guide articles may contain question-and-answer sections formatted as plain headings and paragraphs rather than the required FAQ item markup pattern, preventing FAQ rich-result eligibility.
  - **Impact**: Medium — FAQ rich results increase SERP real estate and CTR for informational queries
  - **Recommendation**: Review guide articles that contain clear Q&A sections. Where applicable, wrap them in the expected FAQ markup pattern (`<article class="faq-item">`, `<h3 class="faq-question">`, `<p itemprop="text">`) so the dynamic FAQ JSON-LD generator picks them up. Only do this where the content genuinely answers questions.

- [ ] **SEO-FIND-3.5 — No review or testimonial content with supporting E-E-A-T signals**
  - **Location**: Site-wide (no review section, no authored content, no "About" page)
  - **Description**: The site currently has no customer review section, testimonials, or "About ZQ Removals" page that establishes the experience and trustworthiness of the business. Google's E-E-A-T guidelines reward content that demonstrates first-hand experience. There is no staff name, business history, or operational credentials visible anywhere on the site.
  - **Impact**: High — for a local service business competing in YMYL-adjacent local queries, missing E-E-A-T signals can suppress rankings relative to competitors with review content
  - **Recommendation**: Add a short "About ZQ Removals" section (or page) describing when the business was founded, key service principles, and the team's background. Add a verified Google Business Profile link (already referenced in `index.html`) more prominently on the site. Consider embedding or linking to verifiable Google reviews on the homepage or service pages.

- [ ] **SEO-FIND-3.6 — `<html lang="en-AU">` is set correctly; no hreflang needed**
  - **Location**: `site-src/templates/standard.html`
  - **Description**: The HTML `lang` attribute correctly specifies `en-AU`. The site targets a single language and region; no hreflang tags are required.
  - **Impact**: Low (no active problem)
  - **Recommendation**: No action required.

---

### 4. Image Optimization

- [ ] **SEO-FIND-4.1 — Hero image is in PNG format; WebP version not confirmed for the primary `<img>` element**
  - **Location**: `site-src/content/index.html`, line 32
  - **Description**: The hero `<img>` element references `/media/Gemini_Generated_Image_.png`. The repository contains a `scripts/optimize_images.py` script and `.webp` variants of some assets (e.g., `brand-logo.webp`, `zq-removals-social-share.webp`), but the hero image has not been converted. PNG files are typically larger than equivalent WebP images, increasing initial page weight and potentially worsening LCP.
  - **Impact**: High — hero image is the LCP element on the homepage; serving PNG instead of WebP adds unnecessary bytes on every page view
  - **Recommendation**: Run `scripts/optimize_images.py` to produce a WebP variant of the hero image. Update `src` in `index.html` to reference the WebP file. Use a `<picture>` element with a WebP `<source>` and a PNG/JPEG fallback for broad browser compatibility:

    ```html
    <picture>
      <source
        srcset="/media/adelaide-removalists-movers-loading-furniture.webp"
        type="image/webp"
      />
      <img
        alt="ZQ Removals movers loading wrapped furniture outside a suburban Adelaide home"
        decoding="async"
        fetchpriority="high"
        height="1024"
        loading="eager"
        src="/media/adelaide-removalists-movers-loading-furniture.jpg"
        width="1536"
      />
    </picture>
    ```

- [ ] **SEO-FIND-4.2 — Brand logo `<img>` has an empty `alt` attribute (correct for decorative use)**
  - **Location**: `site-src/partials/header.html`, line 12
  - **Description**: The brand logo image uses `alt=""` intentionally, because the adjacent `<span class="brand-copy">` element already contains the visible brand name "ZQ Removals". This is the correct accessible pattern for a decorative/redundant image.
  - **Impact**: Low (no active problem; confirmed correct)
  - **Recommendation**: No change needed.

- [ ] **SEO-FIND-4.3 — `width` and `height` attributes are present on hero image but not audited across all content pages**
  - **Location**: `site-src/content/**/*.html`
  - **Description**: The hero image in `index.html` has explicit `width="1536"` and `height="1024"` attributes, which prevents CLS. However, other `<img>` elements in service pages, suburb pages, and guide articles have not been audited to confirm all carry explicit dimensions.
  - **Impact**: Medium — missing `width`/`height` on visible images causes layout shift (CLS regression)
  - **Recommendation**: Audit all `<img>` tags across `site-src/content/` to confirm each has both `width` and `height` set. Add a build-time warning in `scripts/build-site.mjs` if an `<img>` element lacks these attributes.

---

### 5. Schema Markup

- [ ] **SEO-FIND-5.1 — `MovingCompany` schema lacks `openingHours` and `priceRange`**
  - **Location**: `scripts/build-site.mjs` → `normalizeMovingCompanyNode()`
  - **Description**: The `MovingCompany` JSON-LD block normalised at build time includes `name`, `url`, `telephone`, `address`, and `contactPoint`, but does not include `openingHours` or `priceRange`. If this information is known and accurate, adding it makes the schema more complete and may improve local knowledge panel presentation.
  - **Impact**: Low — schema is already valid; these fields are optional enhancements
  - **Recommendation**: If the business has defined operating hours and a price range descriptor (e.g., `"$$"`), add them to `normalizeMovingCompanyNode()`:

    ```js
    openingHours: ['Mo-Fr 07:00-18:00', 'Sa 08:00-14:00'],
    priceRange: '$$',
    ```

    Only add these fields if the values are accurate and will be kept current.

- [ ] **SEO-FIND-5.2 — `MovingCompany` schema does not include `sameAs` links to Google Business Profile or social profiles**
  - **Location**: `scripts/build-site.mjs` → `normalizeMovingCompanyNode()`
  - **Description**: The `sameAs` property can link the schema entity to verified external profiles (Google Business Profile, Facebook page, LinkedIn). This strengthens the entity disambiguation signal for Google. The Google Business Profile URL is already referenced in the homepage content (`https://share.google/Y04mpt9RTflWP3iRl`).
  - **Impact**: Medium — `sameAs` improves entity clarity in the Knowledge Graph
  - **Recommendation**: Add `sameAs` to `normalizeMovingCompanyNode()` with the verified Google Business Profile URL and any other confirmed social profiles:

    ```js
    sameAs: [
      'https://share.google/Y04mpt9RTflWP3iRl',
      // Add Facebook, LinkedIn, etc. when verified
    ],
    ```

- [ ] **SEO-FIND-5.3 — FAQ schema coverage confirmed on 29 of 31 indexable pages**
  - **Location**: `scripts/build-site.mjs` → `buildFaqJsonLd()`; post-build report in `SEO_AUDIT.md`
  - **Description**: The build produces FAQ schema dynamically from visible FAQ markup. The post-build report confirms 29 pages with FAQ schema. The two pages without FAQ schema are either noindex or do not contain FAQ-format content. No invisible or misleading FAQ schema is present.
  - **Impact**: Low (no active problem; good coverage confirmed)
  - **Recommendation**: Review the two indexable pages without FAQ schema to determine whether adding FAQ content would serve user intent. If so, add appropriate Q&A content following the existing markup pattern.

- [ ] **SEO-FIND-5.4 — `BreadcrumbList` schema is present on 24 of 31 indexable pages**
  - **Location**: `scripts/build-site.mjs` → `buildBreadcrumbJsonLd()`; post-build report in `SEO_AUDIT.md`
  - **Description**: Breadcrumb schema is generated dynamically when visible breadcrumb navigation is present. Seven pages do not have breadcrumb schema, which likely includes the homepage and flat top-level pages (which legitimately have no breadcrumb hierarchy). No action is needed for pages that are genuinely top-level.
  - **Impact**: Low (no active problem)
  - **Recommendation**: Confirm that the pages without breadcrumb schema are all genuinely top-level (homepage, contact, privacy, terms). If any service or suburb page is missing breadcrumb schema, verify that the visible breadcrumb markup uses the expected HTML pattern.

---

### 6. Internal Linking and URL Structure

- [ ] **SEO-FIND-6.1 — Internal link structure is comprehensive; guide pages feed into commercial paths**
  - **Location**: `scripts/build-site.mjs` → `seoSupportProfiles`, `seoGuideLibrary`, `localProofProfiles`; verified in `INTERNAL_LINKING_PLAN.md`
  - **Description**: The build script injects related-link sections for all commercial, suburb, route, and guide pages. The homepage, service pages, route pages, and suburb pages all carry deliberate cross-links into the quote flow and between content clusters. Orphan pages were not detected.
  - **Impact**: Low (no active problem; internal linking is strong)
  - **Recommendation**: No immediate action required. Maintain the pattern when adding new pages.

- [ ] **SEO-FIND-6.2 — Footer sitemap link is absent**
  - **Location**: `site-src/partials/footer.html`
  - **Description**: The footer provides comprehensive links to core services, suburb pages, interstate routes, and planning guides, but does not include a link to the XML sitemap (`/sitemap.xml`). While the sitemap is primarily for crawlers, a footer sitemap link is a minor trust and discoverability signal and is referenced in Google's own guidelines.
  - **Impact**: Low
  - **Recommendation**: Optionally add a link to `/sitemap.xml` in the footer bottom bar alongside Privacy Policy and Terms:

    ```html
    <a href="/sitemap.xml">Sitemap</a>
    ```

- [ ] **SEO-FIND-6.3 — No dedicated Adelaide suburb directory / hub page**
  - **Location**: `/removalists-adelaide/` (the current local hub)
  - **Description**: The `/removalists-adelaide/` page acts as the local hub but presents suburbs as brief cards linking to individual pages. It does not provide a structured directory-style listing of all suburb pages. As the suburb count grows beyond 12, users and crawlers would benefit from a clearly organised directory.
  - **Impact**: Medium — crawl efficiency and user navigation from the hub page could be improved as the site grows
  - **Recommendation**: If more than 15 suburb pages are active, consider adding a structured directory section to `/removalists-adelaide/` that lists all suburb pages with brief descriptors, clearly grouped by geographic region (north, south, east, west, CBD).

---

### 7. User Experience

- [ ] **SEO-FIND-7.1 — Custom 404 page is present and correctly implemented**
  - **Location**: `site-src/content/404.html`
  - **Description**: A `404.html` source file exists and will be included in the build output. Vercel serves it for unmatched routes. The page content was not fully audited, but its existence confirms a custom error page is in place.
  - **Impact**: Low (no active problem)
  - **Recommendation**: Verify that the 404 page includes navigation links back to the homepage and the main service pages so users who land on a broken URL can recover without using the browser back button.

- [ ] **SEO-FIND-7.2 — Thank-you page is not excluded from the sitemap or from indexing**
  - **Location**: `site-src/content/thank-you.html`; `site-src/pages.json`
  - **Description**: The `/thank-you.html` page is reached after a successful quote submission. If this page is indexable and included in the sitemap, it could receive direct organic traffic, which provides no business value and could dilute crawl budget.
  - **Impact**: Low–Medium — depending on current robots/sitemap configuration for this page
  - **Recommendation**: Confirm in `pages.json` that the thank-you page is set to `"robots": "noindex,nofollow"` and is excluded from the sitemap output in `renderSitemap()`. If it is currently indexable, add the noindex directive immediately.

---

### 8. Off-Page and Authority

- [ ] **SEO-FIND-8.1 — Backlink profile has not been audited in this repository-level review**
  - **Location**: Off-page (not visible in the repository)
  - **Description**: No backlink data is available from repository inspection alone. Domain authority, toxic links, and link velocity cannot be assessed without third-party tools (Ahrefs, Semrush, Moz, or Google Search Console).
  - **Impact**: High (unknown risk until audited externally)
  - **Recommendation**: Connect the domain to Ahrefs or Semrush and run a full backlink audit. Identify referring domains, anchor text distribution, and any spammy or irrelevant links. If toxic links are identified, compile them in a Google disavow file and submit via Search Console.

- [ ] **SEO-FIND-8.2 — Google Business Profile is linked from the homepage but not verified in schema**
  - **Location**: `site-src/content/index.html` → Google Maps link; `scripts/build-site.mjs` → `normalizeMovingCompanyNode()`
  - **Description**: The homepage links to the Google Business Profile (`https://share.google/Y04mpt9RTflWP3iRl`), but the `sameAs` array in `MovingCompany` schema does not reference this URL. The Google Business Profile should be claimed, fully completed (categories, photos, services, hours), and linked from schema for maximum local SEO benefit.
  - **Impact**: High for local SEO — Google Business Profile is the primary local ranking factor for "near me" and suburb-level queries
  - **Recommendation**: Verify the GBP is claimed, set the primary category to "Mover", and add the profile URL to `sameAs` in `MovingCompany` schema (as described in SEO-FIND-5.2).

---

### 9. Analytics and Monitoring

- [ ] **SEO-FIND-9.1 — No analytics or conversion tracking is present in the repository**
  - **Location**: `site-src/templates/standard.html`, `site-src/templates/bare.html`
  - **Description**: As confirmed in SEO-FIND-2.1, no analytics snippet is present. Quote form submissions trigger a redirect to `/thank-you.html` via `site.js`, but this event is not tracked in any analytics system. Without tracking, the business cannot determine which pages, queries, or channels drive quote requests.
  - **Impact**: High — no measurement = no data-driven optimisation
  - **Recommendation**: Implement GA4 with a custom `quote_submitted` event fired on successful form submission in `site.js`. Track `source_page` (already captured in the form payload) as an event parameter to attribute conversions to landing pages.

- [ ] **SEO-FIND-9.2 — No rank-tracking or Search Console performance monitoring is configured**
  - **Location**: Off-platform (not visible in the repository)
  - **Description**: The `GOOGLE_SEARCH_CONSOLE_PLAN.md` document describes the setup steps, but does not confirm that Search Console is connected or that rank tracking is active. Without Search Console data, impression/CTR regressions, index coverage issues, and Core Web Vitals field data alerts cannot be monitored.
  - **Impact**: High — unmonitored site cannot detect drops until traffic falls significantly
  - **Recommendation**: Complete the `GOOGLE_SEARCH_CONSOLE_PLAN.md` setup steps. Link GA4 to Search Console for combined query and behaviour reporting. Set up rank tracking for at least 20 target keywords in a tool such as Search Console, SerpRobot, or Semrush.

---

## Remediation Recommendations

### Immediate (0–2 weeks)

- [ ] **SEO-REC-1.1 — Add Google Analytics 4 and quote conversion tracking**
  - **Priority**: Critical
  - **Effort**: 2–4 hours
  - **Expected Outcome**: Organic traffic, landing page performance, and quote-form conversion rate become visible; data available within 24 hours of deployment
  - **Validation**: Open GA4 Realtime report and submit a test quote from the homepage form. Confirm a `quote_submitted` event appears in the event stream. Check that the `source_page` parameter is populated.

- [ ] **SEO-REC-1.2 — Set `noindex,nofollow` on the thank-you page and exclude it from the sitemap**
  - **Priority**: High
  - **Effort**: 30 minutes
  - **Expected Outcome**: Thank-you page removed from the Google index; no crawl budget wasted on a zero-value URL
  - **Validation**: After deployment, use Google Search Console URL Inspection on `https://zqremovals.au/thank-you.html` and confirm it is not indexed. Check that the URL does not appear in `sitemap.xml`.

- [ ] **SEO-REC-1.3 — Convert hero image to WebP and rename with a descriptive filename**
  - **Priority**: High
  - **Effort**: 1–2 hours
  - **Expected Outcome**: Reduced hero image file size (typically 25–35% smaller than PNG at equivalent quality), improved LCP score on the homepage, improved image search discoverability
  - **Validation**: Run PageSpeed Insights on the homepage before and after. Confirm LCP improvement. Inspect the served response header to verify `Content-Type: image/webp`.

- [ ] **SEO-REC-1.4 — Add `sameAs` to `MovingCompany` schema with verified Google Business Profile URL**
  - **Priority**: High
  - **Effort**: 30 minutes
  - **Expected Outcome**: Stronger entity disambiguation in the Knowledge Graph; potential improvement in local pack eligibility
  - **Validation**: After deployment, validate the updated schema using Google Rich Results Test on `https://zqremovals.au/`. Confirm `sameAs` is present in the rendered `MovingCompany` block.

- [ ] **SEO-REC-1.5 — Confirm and optimise Google Business Profile**
  - **Priority**: Critical
  - **Effort**: 2–4 hours (one-time setup)
  - **Expected Outcome**: Improved local pack and map visibility for "removalists Adelaide" and suburb-level queries; enables GBP review signals
  - **Validation**: Search for "removalists Adelaide" and "ZQ Removals" on Google. Confirm the business Knowledge Panel appears with accurate details, photos, and a link to the website.

---

### Short-term (2–6 weeks)

- [ ] **SEO-REC-2.1 — Add CSS minification to the build pipeline**
  - **Priority**: High
  - **Effort**: 2–4 hours
  - **Expected Outcome**: Reduced CSS transfer size (typically 20–40% for unminified source); improved TTFB and LCP
  - **Validation**: Compare the byte size of `premium-site.min.css` before and after minification. Run PageSpeed Insights and check the "Minify CSS" opportunity is no longer flagged.

- [ ] **SEO-REC-2.2 — Integrate Lighthouse CI into the GitHub Actions deployment pipeline**
  - **Priority**: High
  - **Effort**: 4–8 hours
  - **Expected Outcome**: Automatic performance regression detection on every PR; prevents CWV degradation from slipping into production
  - **Validation**: Submit a PR that intentionally increases LCP (e.g., remove `fetchpriority="high"` from the hero image). Confirm the Lighthouse CI step fails the budget check.

- [ ] **SEO-REC-2.3 — Connect Google Search Console and complete initial indexing requests**
  - **Priority**: Critical
  - **Effort**: 1–2 hours
  - **Expected Outcome**: Index coverage visible in Search Console; early impressions and clicks data available for optimisation
  - **Validation**: Search Console shows domain property verified. Sitemap status is "Success". Core commercial pages return "URL is on Google" in URL Inspection.

- [ ] **SEO-REC-2.4 — Audit and improve lower-priority suburb pages**
  - **Priority**: Medium
  - **Effort**: 2–4 hours per page (7 pages)
  - **Expected Outcome**: Improved relevance and depth for suburb-specific queries; potential ranking improvement for "removalists [suburb]" queries in the 7 under-optimised areas
  - **Validation**: Post-update, re-run a content audit. Confirm each page has suburb-specific street name references, at least 600 words of unique content, and three differentiated scenario sections.

- [ ] **SEO-REC-2.5 — Add E-E-A-T signals: About page and business story section**
  - **Priority**: High
  - **Effort**: 4–8 hours
  - **Expected Outcome**: Improved E-E-A-T score for the domain; stronger trust signals for users and crawlers
  - **Validation**: Use a manual E-E-A-T checklist to confirm: business founding date is stated, key principles are described, at least one team member is named, and the About page is linked from the footer.

---

### Long-term (6–12 weeks)

- [ ] **SEO-REC-3.1 — Replace AI-generated hero imagery with real operational photography**
  - **Priority**: High
  - **Effort**: Scheduling and production (weeks, not hours)
  - **Expected Outcome**: Stronger visual trust signals for users; unique images improve CTR in image search and reduce duplicate-image risk; E-E-A-T improvement
  - **Validation**: Replace `Gemini_Generated_Image_` references. Confirm new images appear in Google Image Search for branded queries. Monitor homepage bounce rate for improvement after swap.

- [ ] **SEO-REC-3.2 — Add a structured suburb directory to `/removalists-adelaide/`**
  - **Priority**: Medium
  - **Effort**: 4–8 hours
  - **Expected Outcome**: Improved crawl efficiency for suburb pages; better user navigation from the local hub; potential improvement in click depth metrics
  - **Validation**: After adding the directory section, re-crawl the site and confirm all suburb pages are reachable within 2 clicks from the homepage.

- [ ] **SEO-REC-3.3 — Expand FAQ schema coverage on guide articles**
  - **Priority**: Medium
  - **Effort**: 1–2 hours per guide article
  - **Expected Outcome**: FAQ rich results eligibility for informational queries; increased SERP real estate for guide content
  - **Validation**: Run Google Rich Results Test on each updated guide article URL. Confirm FAQ schema is detected and valid.

- [ ] **SEO-REC-3.4 — Build a customer review / testimonial section with verified signals**
  - **Priority**: High
  - **Effort**: 2–4 hours implementation; ongoing content collection
  - **Expected Outcome**: Stronger E-E-A-T; potential AggregateRating schema eligibility once reviews are verified; improved user trust and dwell time
  - **Validation**: At least 5 verified reviews displayed on the homepage or a dedicated reviews page. Schema validated with Google Rich Results Test.

- [ ] **SEO-REC-3.5 — Establish quarterly content refresh cadence for high-traffic pages**
  - **Priority**: Medium
  - **Effort**: 2–4 hours per refresh cycle
  - **Expected Outcome**: Maintained content freshness signals; alignment with current market conditions and seasonal demand peaks (e.g., end-of-lease season)
  - **Validation**: Set a recurring calendar reminder. Log each refresh date in a content changelog.

- [ ] **SEO-REC-3.6 — Conduct external backlink audit and disavow toxic links**
  - **Priority**: High
  - **Effort**: 4–8 hours
  - **Expected Outcome**: Reduced algorithmic penalty risk from spammy inbound links; cleaner anchor text profile
  - **Validation**: Backlink audit completed in Ahrefs/Semrush. Disavow file submitted to Search Console if toxic links are found. Re-run audit quarterly.

---

## Proposed Code Changes

### 1. Add `noindex` to the thank-you page in `pages.json`

Find the entry for `thank-you.html` in `site-src/pages.json` and set:

```diff
-  "robots": "index,follow"
+  "robots": "noindex,nofollow"
```

And in `scripts/build-site.mjs`, ensure `renderSitemap()` skips pages where `page.robots` contains `noindex`:

```js
// In renderSitemap(), filter already applied for noindex pages — confirm this condition:
const indexablePages = pages.filter(
  (page) => !page.robots?.includes('noindex') && page.layout !== 'redirect',
);
```

---

### 2. Add `sameAs` to `MovingCompany` schema normalisation

In `scripts/build-site.mjs`, update `normalizeMovingCompanyNode()`:

```diff
 function normalizeMovingCompanyNode(node) {
   return {
     ...node,
     '@id': 'https://zqremovals.au/#business',
     name: 'ZQ Removals',
     url: 'https://zqremovals.au/',
     telephone: '+61 433 819 989',
+    sameAs: [
+      'https://share.google/Y04mpt9RTflWP3iRl',
+    ],
     address: {
       '@type': 'PostalAddress',
       addressLocality: 'Andrews Farm',
       addressRegion: 'SA',
       postalCode: '5114',
       addressCountry: 'AU',
       ...(node.address || {}),
     },
     contactPoint: [
       {
         '@type': 'ContactPoint',
         contactType: 'customer service',
         telephone: '+61 433 819 989',
         areaServed: ['Adelaide', 'South Australia', 'Australia'],
         availableLanguage: ['en'],
         url: 'https://zqremovals.au/contact-us/',
       },
     ],
   };
 }
```

---

### 3. Use a `<picture>` element for the homepage hero image with WebP source

In `site-src/content/index.html`, replace:

```diff
-<img
-  alt="ZQ Removals movers loading wrapped furniture outside a suburban Adelaide home"
-  decoding="async"
-  fetchpriority="high"
-  height="1024"
-  loading="eager"
-  src="/media/Gemini_Generated_Image_.png"
-  width="1536"
-/>
+<picture>
+  <source
+    srcset="/media/adelaide-removalists-movers-loading-furniture.webp"
+    type="image/webp"
+  />
+  <img
+    alt="ZQ Removals movers loading wrapped furniture outside a suburban Adelaide home"
+    decoding="async"
+    fetchpriority="high"
+    height="1024"
+    loading="eager"
+    src="/media/adelaide-removalists-movers-loading-furniture.jpg"
+    width="1536"
+  />
+</picture>
```

Also update `defaultSocialImage` in `scripts/build-site.mjs` to reference the new WebP asset once it has been created:

```diff
-const defaultSocialImage = 'https://zqremovals.au/media/Gemini_Generated_Image_.png';
+const defaultSocialImage = 'https://zqremovals.au/media/zq-removals-social-share.webp';
```

---

### 4. Add CSS minification to the build pipeline

Add `lightningcss` (zero-dependency, Rust-backed):

```bash
npm install --save-dev lightningcss
```

In `scripts/build-site.mjs`, replace the plain `copyFile` with a minification step:

```diff
-await copyFile(
-  path.join(projectRoot, 'premium-site.css'),
-  path.join(distRoot, 'premium-site.min.css'),
-);
+import { transform } from 'lightningcss';
+// Note: `readFile` is already imported from 'node:fs/promises' at the top of build-site.mjs.
+// Use the existing import directly; no alias is needed.
+const rawCss = await readFile(path.join(projectRoot, 'premium-site.css'), 'utf8');
+const { code: minCss } = transform({
+  filename: 'premium-site.css',
+  code: Buffer.from(rawCss),
+  minify: true,
+});
+await writeFile(path.join(distRoot, 'premium-site.min.css'), minCss, 'utf8');
```

---

### 5. Add Google Analytics 4 snippet to the standard template

In `scripts/build-site.mjs` → `renderHead()`, add the GA4 snippet after the `<link rel="stylesheet">` tag, guarded by a `page.gaId` or build-time environment variable:

```js
// Add this near the end of the tags array, before the closing of renderHead():
if (process.env.GA_MEASUREMENT_ID) {
  tags.push(
    `<script async src="https://www.googletagmanager.com/gtag/js?id=${process.env.GA_MEASUREMENT_ID}"></script>`,
    `<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${process.env.GA_MEASUREMENT_ID}');</script>`,
  );
}
```

Set `GA_MEASUREMENT_ID` as an environment variable in the Vercel project settings. Do not hard-code the measurement ID in the source.

---

### 6. Lighthouse CI configuration (`.lighthouserc.cjs`)

Create a `.lighthouserc.cjs` file in the repository root:

```js
module.exports = {
  ci: {
    collect: {
      staticDistDir: './site-dist',
      url: ['/', '/contact-us/', '/removalists-adelaide/'],
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.8 }],
        'categories:accessibility': ['warn', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
```

Add to `package.json` scripts:

```diff
 "scripts": {
-  "build": "node scripts/build-site.mjs"
+  "build": "node scripts/build-site.mjs",
+  "lhci": "lhci autorun"
 }
```

---

## Commands

Run locally after code changes:

```bash
# Full site build
npm run build

# Verify sitemap was produced
cat site-dist/sitemap.xml | grep '<url>' | wc -l

# Verify no indexable page has noindex set accidentally.
# The expected noindex outputs are listed explicitly so the check stays readable when new
# legitimate noindex pages are added — just extend the EXPECTED_NOINDEX list below.
node -e "
const pages = require('./site-src/pages.json');
const EXPECTED_NOINDEX = pages
  .filter(p => p.robots?.includes('noindex'))
  .map(p => p.output);
const unexpected = pages.filter(
  p => p.robots?.includes('noindex') && !EXPECTED_NOINDEX.includes(p.output)
);
if (unexpected.length) {
  console.error('Unexpected noindex pages:', unexpected.map(p => p.output));
  process.exit(1);
}
console.log('All noindex pages:', EXPECTED_NOINDEX);
console.log('Check complete — update EXPECTED_NOINDEX if you intentionally add new noindex pages.');
"

# Check for img tags without width/height
grep -rn '<img' site-src/content/ | grep -v 'width=' | grep -v 'brand-logo'

# Validate schema after build (manual step: paste output URL into Rich Results Test)
echo "Validate: https://search.google.com/test/rich-results?url=https://zqremovals.au/"
```

Run in CI (GitHub Actions) after adding Lighthouse CI:

```bash
npm ci
npm run build
npx @lhci/cli@0.14.x autorun
```

---

## Quality Assurance Task Checklist

Before finalising and deploying any SEO changes, verify:

- [ ] All findings reference specific URLs, code lines, or measurable metrics ✓
- [ ] Tool results are noted for each critical finding (confirmed via repository inspection and build output logs)
- [ ] Competitor benchmark data has not been collected in this audit (requires external tooling — SEO-FIND-8.1 flags this gap)
- [ ] Recommendations cite Google guidelines or documented best practices ✓
- [ ] Code examples are provided for all technical fixes (meta tags, schema, image format, CSS minification, analytics) ✓
- [ ] Validation steps are included for every recommendation ✓
- [ ] ROI projections are noted qualitatively (analytics and GBP setup will unlock quantitative measurement)

### Post-implementation verification checklist

- [ ] `thank-you.html` is `noindex` and absent from `sitemap.xml`
- [ ] `sameAs` is present in `MovingCompany` JSON-LD — validated via Rich Results Test
- [ ] Hero image is served as WebP — verified via browser DevTools Network tab
- [ ] CSS is minified in the build output — verified via byte size comparison
- [ ] GA4 fires on page load and `quote_submitted` fires on form success — verified in GA4 Realtime
- [ ] Search Console is connected, sitemap submitted, and core pages are indexed
- [ ] Lighthouse CI passes performance, accessibility, and SEO score thresholds on the homepage and contact page
- [ ] Google Business Profile is claimed, fully completed, and linked in schema `sameAs`
- [ ] Backlink audit is complete; disavow file submitted if toxic links were found
- [ ] Content refresh schedule is recorded in a shared document or calendar

---

## SEO Optimization Quality Task Checklist

- [x] All crawlability and indexing issues are catalogued with specific URLs
- [x] Core Web Vitals improvement actions are identified and scored (SEO-FIND-2.7, SEO-FIND-4.1, SEO-REC-2.1, SEO-REC-2.2)
- [x] Title tags and meta descriptions are audited for every indexable page — confirmed clean
- [x] Content quality assessment includes E-E-A-T gaps and specific suburb-level recommendations
- [ ] Backlink profile is analyzed with toxic links flagged for action — **requires external tooling** (SEO-FIND-8.1)
- [x] Structured data is validated and rich-snippet opportunities are identified (SEO-FIND-5.1, SEO-FIND-5.2, SEO-FIND-5.3, SEO-FIND-3.4)
- [x] Every finding has an impact rating (Critical/High/Medium/Low) and an effort estimate
- [x] Remediation roadmap is organised into Immediate, Short-term, and Long-term phases
