# Recon: Stitch integration (read-only, 2026-10-20)

## 1. premium-site.css (16192 lines; ~205 !important total, 197 before line 15191)
Pipeline: build-site.mjs:2713 copies premium-site.css to src/styles/premium-site.css, runs Astro, then PurgeCSS emits THREE bundles from real markup:
premium-home.min.css, premium-contact.min.css, premium-site.min.css (general). Tests enforce size ratios (home/contact < 45% of source, general < 80%)
and selector survival (tests/performance-build.test.mjs). Edit ONLY root premium-site.css. build-site.mjs also has embedded CSS strings (~L2850 body.page-home) - check before assuming CSS is only in the file.

Top-level markers (line: label). Layered cascade; later wins.
- 1-308 @font-face (Inter, Fraunces), :root tokens (--zq-*), base
- 309 Editorial homepage direction | 714 Heritage & Precision shared system | 1076 motion-fallback visibility
- 1449 Shared Shell | 1816 Hero Patterns | 1979 Cards & Grids | 2116 Specialized Sections | 2214 Form Polish
- 2427-3825 Suburb/Internal Overrides (LOCAL SUBURB/SERVICE pages)
- 3826 Footer | 3887 Sticky Mobile CTA | 4001 Responsive Helpers | 4421 Readability guardrails
- 4575 2026 PREMIUM SERVICE BRAND SYSTEM (to 5710) | 5711 Hero contrast fix | 5736 Review cards
- 5789 Homepage Social Proof Landing Refresh | 6131 mobile nav | 6789 Premium homepage redesign (HOME)
- 7346 Final cascade: premium authoritative over legacy homepage (HOME) | 7657 header/service-hero contrast | 7685 AEO TL;DR blockquote | 7702 mobile polish
- 7866 OpenDesign homepage refresh (HOME) | 8448 UI completion layer (shared) | 8726 readability pass (shared)
- 9148 Premium homepage finish (HOME) | 9640 hover utils | 9699 fast premium finish | 9769 FULL-SITE PREMIUM REBUILD (to 10709, shared)
- 10710 UI stabilization (shared) | 11915 final UI corrections | 11967 production contrast repair (tokens)
- 12520 2026 OPEN DESIGN HOMEPAGE V2 (HOME; --zq-v2-ink #10263f, accent #d6a45b; REQUIRED by test)
- 13850 WCAG contrast guardrails | 13901 ZQ premium logistics direction: navy + lime #b8f229 (HOME; redefines --zq-v2-ink #071421)
- 14290 mobile nav contrast | 14336-14613 CONTACT page (body.page-contact) | 14614 spotlight (HOME) | 14668 developer credit
- 14752 sticky CTA clearance | 14765 brand consistency (non-home/non-contact chrome) | 14808 reduced-motion guard
- 14821 ZQ BRAND 2026 final shared art direction (paper/forest) | 14935 inner routes | 14941 light sections reset
- 15070 Neon conversion accents | 15179 opacity-only entrance
- 15191-16052 "2026 Redesign Components" (all HOME, body.page-home): Hero Quick Estimator 15195, Inventory Banner 15369, m3 Calculator 15409,
  Suburbs Explorer 15745, Interstate Matrix 15848, Comparison Matrix 15957, responsive 16016
- 16053-16192 "Home layout repair (2026-10-20)": dark-section text/tables/cards/FAQ/final quote 16099, footer columns 16163 (shared), calculator overflow 16182
Body classes (build-site.mjs getBodyClasses ~L4124): page-home, page-contact, page-landing+page-lead-machine, page-legal, page-guide-hub/-article,
page-interstate (interstate-removals-adelaide, interstate-removalists-adelaide, adelaide-to-*-removals), page-service-{operations,packing,furniture,local}.
Local suburb pages get NO dedicated body class (generic cascade: hero-shell, section, route-card etc).

Patch commits:
- ab0ecab "repair homepage layout": 280+/136-. Adds 16053-16192 repair block; deletes ~50 scattered lines in 13370-13811 (gallery grid, focus-visible), edits 14873,
  rewrites parts of 15195-15330 (estimator). Repair block has 0 !important; whole 15191-16192 has 8.
- ece45c1 (merge a375d68, identical +828): added 828 lines at old L15221 = the "2026 Redesign Components" block (now ~15191-16052).
- c93731d contrast remediation: 50+/10-; one-line edits at 3343, 7675, 9805, 14578-14605 (contact), 14986-15087 (nav, step-card, focus-visible; colours #20374b/#526477/#a43d06).

## 2. site-src/content/index.html (694 lines; main#main-content.zq-v2-home)
27-62 .zq-v2-hero (h1 "Adelaide removalists.<br><em>Moves handled with care.</em>", img home-local-hero-branded.webp, CTAs)
65-131 .zq-v2-estimator-band > .zq-hero-estimator#hero-estimator (scope tabs, size buttons, pickup/dropoff, price)
134-165 .zq-v2-trust-strip (assurances)
168-211 .zq-v2-section.zq-brand-quote (.zq-v2-quote-panel: attached-inventory banner + main form#quote-form L188)
214-281 #services (9 [data-service-card])
284-393 #calculator.zq-calculator-section (m3/truck calculator)
396-418 #suburbs.zq-v2-surface (#suburbsGrid) | 421-442 #interstate.zq-v2-dark (route tabs, #routeDetailPanel)
445-495 #comparison (table.comparison-table with caption) | 498-520 #why-zq (img zq-service-premium) | 523-539 #how-it-works.zq-v2-dark
542-563 #locations | 566-588 .zq-v2-apartment (img zq-operations-premium) | 591-606 #reviews (Google review cards, no AggregateRating)
608-626 gallery (.zq-v2-gallery-grid, 6 figures) | 629-663 #frequently-asked-questions (8 FAQ, schema.org Question microdata)
666-693 .zq-v2-final dark (short form .zq-v2-short-form L675). SVG sprite symbols #zq-i-* at lines 3-23.

## 3. JS/analytics hooks (must not break)
site.js (module, loaded by templates/standard.html with /chat-widget.mjs):
- Global: html.js class; [data-year]; .site-header + details/summary; .mobile-nav > details; summary.mobile-menu-trigger; #sticky-cta
- Forms: form[data-quote-form="quote"] (index has 2: #quote-form L188, .zq-v2-short-form L675); input[type=date][name*=date]; button[type=submit];
  fieldset.quote-form-group + .step-pill (multi-step, contact); [data-error-for]; [data-form-feedback]; data-form-name;
  hidden input[name][data-attribution-field]; input[name=source_page]; input[name=botcheck]; input[name=attached_inventory] (JS-created)
- Field names: name, phone, email, move_date, pickup_suburb, dropoff_suburb, move_scope, move_size, message
- Links: data-lead-event / data-lead-location (build adds quote_cta_click to hrefs #quote-form, /contact-us/#quote-form, #premium-quote, /thank-you/)
- Estimator: .zq-hero-estimator, .hero-scope-tab, .hero-size-btn, #heroPickup #heroDropoff #heroEstPrice #heroEstSub #heroEstLabel #heroSizeButtons, #scope-{local,interstate,office}
- Calculator: #calculator #calcCategoryTabs #calcItemsGrid #calcAccess #calcPacking #calcItemCountBadge #calcTotalM3 #btnM3Span #calcInterstateM3Text #calcTruckName
  #calcTruckFillPct #calcTruckFillBar #calcEstHours #calcHourlyRate #calcTotalCostRange; #qty-<itemId>; .calc-preset-pill (matched via onclick attr text); .calc-attach-btn;
  #attachedInventoryBanner #attachedInventoryText
- Suburbs: #suburbsGrid, .suburb-tab[data-region]. Interstate: #routeDetailPanel, .route-tab, #route-tab-{mel,syd,per,bne,cbr}
- Inline onclick globals (asserted in tests/redesign-integration): setHeroScope setHeroSize transferHeroToQuote switchCalcCategory adjustItem applyPreset recalculateVolume
  sendCalculatorToForm clearAttachedInventory filterSuburbs prefillSuburb selectInterstateRoute bookInterstateRoute
- Motion: .zq-entrance, .reveal-on-scroll, .home-redesign-*, .service-card .value-card .route-card .testimonial-card .timeline-card .proof-card .quote-form-shell;
  entrance targets .page-home .zq-v2-service-card, .zq-v2-trust-cards > article, .testimonial-card, .google-review-card, .rate-table;
  spotlight targets body.page-home .zq-v2-service-card, .zq-v2-trust-cards article, .zq-v2-gallery-grid figure; [data-count][data-decimals][data-suffix]; [data-social-section]/[data-social-links]
- Service-area map: [data-service-area-locator][data-map-config], [data-service-area-map|status|link|search], link data-area-name/lat/lng
chat-widget.mjs: self-contained (injects its own CSS + DOM; guard #zq-chat-launcher; .zq-chat-*; data-chat-* attrs; window.toggleZqChat; POST /api/ai-chat/ and /api/ai-chat-submit/).
Quote post: site.js:152 QUOTE_API_ENDPOINT = https://api.web3forms.com/submit (JSON POST; form action= same URL). api/quote.js is a separate server handler
(lib/server/web3forms.js, Turnstile/reCAPTCHA), NOT used by site.js.
On acceptance (site.js ~L822-840): UUID leadId; handOffAcceptedQuote() stores in sessionStorage (PENDING_ACCEPTED_QUOTE_KEY); then location.assign("/thank-you/").
analytics.mjs:192 pushes zq_quote_submitted {form_name, submission_status:"accepted", submission_id: leadId} then clears keys. Chat path: trackFormSuccess("ai_chat_enquiry", submission_id).

## 4. Templates / pages
site-src/pages.json: 96 entries; fields output, layout (standard|redirect|bare), title, description, canonical, og*, twitter*, robots, jsonLd[], contentFile.
No content-type field. layout counts: standard 83, redirect 12, bare 1. ALL real pages share templates/standard.html. Differences come from (a) contentFile HTML,
(b) getBodyClasses(page.output) in scripts/build-site.mjs, (c) partials header.html / footer.html. Rendered via Astro (src/pages/[...slug].astro, src/layouts/Layout.astro) then post-processed.
Groups (by contentFile): local suburb removalists-* 27 (incl. cost guides, facebook-offer, quote landing); interstate 8 (adelaide-to-{western-sydney,smithfield-nsw,brisbane,canberra,perth,
queensland}-removals + interstate-removals-adelaide + services/interstate-removals-adelaide); other 48 (services, guides, about, contact, legal, concepts, 404, home).
interstate-removalists-adelaide content is a 164-byte redirect stub. 24 content dirs use .page-hero-grid.
Shared content structure: section.hero-shell > .container > nav.breadcrumb + .page-hero-grid(.page-hero-copy[.eyebrow h1 .lead .cta-cluster] + .page-hero-media); then
section.section[.section-soft|.section-split] with .section-heading plus grids.
- local (removalists-glenelg): .proof-grid>.proof-card x3, .timeline-grid>.timeline-card x3, .logistics-grid>.logistics-card x2, .route-grid>.route-card x3, .quote-strip, .faq-list>.faq-item(5)
- hub (removalists-adelaide): .value-grid>.value-card (13), .route-grid>.route-card (13), .inline-link-group, .table-wrap, quote-strip x2, faq x7
- interstate hub (interstate-removals-adelaide): .route-card x14, .value-card x2, .inline-link-group, faq x6
- per-route (adelaide-to-sydney-removals): .timeline-card x3, .logistics-card x2, .quote-strip, faq x3
Data: site-src/data/{zq-suburbs,seo-v4,zq-services,zq-internal-links}.mjs plus suburb copy blobs inside build-site.mjs.

## 5. Tests a redesign could break
- redesign-integration.test.mjs: index.html needs .zq-hero-estimator, ids heroPickup/Dropoff/EstPrice/EstSub, calc ids, #suburbs #suburbsGrid #interstate #routeDetailPanel #comparison,
  table.comparison-table + caption, onclick fn names, window.* hooks in site.js, CALC_* / SUBURB_DATA / ROUTES; no wrong phone, no "5.0/5|award-winning|guaranteed", no CJK.
- homepage-editorial-redesign.test.mjs: exactly one h1 "Adelaide removalists.<br><em>Moves handled with care.</em>"; 9 data-service-card; 8 FAQ Question microdata; 2 data-quote-form="quote";
  8 service hrefs; 8 FAQ question texts; form fields; #reviews; final CTA headline; Google rating/review wording + profile link; specific review texts; header nav labels/aria-labels;
  sticky CTA in template; CSS (root AND src/styles copy) must contain "2026 OPEN DESIGN HOMEPAGE V2", --zq-v2-ink:#10263f, --zq-v2-surface:#fffdfa, --zq-v2-accent:#d6a45b,
  the 1120px .desktop-nav display:none !important rule, 640px .sticky-mobile-cta, 1121px page-home sticky hide !important, reduced-motion, .zq-v2-home :focus-visible. Reads site-dist too.
- contact-page-design-system.test.mjs: contact-us has .zq-v2-contact, zq-v2-button-primary/outline; regexes for body.page-contact vars (#071421 / #b8f229), hero bg url /media/home-local-hero-branded.webp, specific !important rules.
- contrast-audit.test.mjs (+scripts/contrast-audit.mjs): CSS regexes (.route-card small, body.page-home .od-band .od-kicker, .hero-shell .button-secondary, body.page-home .footer-shell a);
  <section class="section lead-machine-cta"> in a service page; computed token contrast on dist.
- performance-build.test.mjs: bundle names/sizes; selectors .zq-v2-hero, .zq-v2-short-form, .contact-hero-grid, .quote-form-premium, .page-hero, .service-card, .site-header, .sticky-mobile-cta, .is-visible.
- entrance-animations.test.mjs: animate__ class/keyframe retained; dist index.html; root CSS.
- stitch-asset-integration.test.mjs: ONLY premium-moving-concepts/* archive pages (layout standard, noindex, no /media/stitch/ refs in source or dist, "original screenshot unavailable" notice, one h1, #main-content, canonical).
  It says nothing positive about adding Stitch assets; it forbids /media/stitch/ paths in those pages.
- Tracking/forms: quote-form-response, accepted-quote-contract, quote-api-security, tracking-v2, conversion-tracking.spec, chat-enquiry-journey.spec - preserve zq_quote_submitted / submission_id flow.
- Content/SEO on dist (restyling safe; markup/text/link changes risky): lead-machine-v7 (#quote-form on landing pages), priority-suburb-pages, professional-audit-regressions, seo-v5/v6/v7,
  search-console-fixes, top-page-targeting, zq-local-seo-content-system, service-area-locator, mobile-seo-visual.spec, contact-page-visual.spec.
Most tests read site-dist, so a build is needed first.

## 6. Images
media/ has NO real photos: all AI-generated (commit f6e6b1f "Rename legacy Gemini image assets" renamed Gemini_Generated_Image_*), later "-branded"/"premium" composites. Nothing is verified-authentic ZQ photography.
Used by index.html: home-local-hero-branded.webp (41K, 768x406; hero + gallery), zq-service-premium.webp (42K), zq-local-premium.webp (100K), zq-operations-premium.webp (55K),
zq-interstate-premium.webp (51K), custom-operations-source.webp (51K), about-team-branded.webp (85K). Responsive variants: media/responsive/*-320/480/960w.webp.
Other: *-hero.webp (122-138K; cbd-apartment, coastal-suburb, furniture-wrapping, interstate-route, local-move, north-suburb, office-relocation, packing-station, planning-checklist,
suburb-family, suburb-general) used by local/service pages, contact-quote-branded.webp, zq-removals-social-share.webp (221K OG image), SVGs (interstate-network, premium-moving-truck, route-logistics),
multi-MB PNG sources (custom-*-source.png, *-branded.png). Logos at repo root brand-logo*.webp/png. docs/stitch-integration/{before,after,stitch-ref} contain screenshots only.
No media/stitch/ directory exists.
