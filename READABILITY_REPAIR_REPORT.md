# ZQ Removals colour, contrast and readability repair

Local implementation, 17 October 2026. No commit, push, merge or deployment was performed. Pre-existing deleted files and untracked user files were preserved.

## Scope and implementation

The route inventory comes from the generated output of the existing Astro/custom generator workflow: 122 HTML documents, comprising 95 rendered routes and 27 redirect documents. The inventory covers 80 indexable pages, service and regional pages, suburbs, guides, contact and quote forms, legal pages, thank-you and 404 pages, and the concept previews. The browser audit checks the actual generated pages and route-specific purged CSS bundles.

The repair retains the existing forest green/gold and navy/lime branding. Changes were made in the source stylesheet, generator modules and source markup. The Astro stylesheet mirror was updated by the existing build process. Generated distribution files were not edited manually.

- Repaired conflicting light/dark section rules so nested cards, quote banners and forms retain the foreground appropriate to their own surface.
- Replaced primary button gradients with stable contrast pairs; corrected lime header buttons, footer telephone buttons, review links and hover states.
- Repaired desktop dropdown card titles/descriptions and the contact mobile menu, including open, hover and keyboard states.
- Darkened lime text on light surfaces, improved muted copy, and made paragraph links distinguishable with underlines.
- Strengthened input borders, placeholder colours, focus indicators, validation feedback, disabled controls and loading buttons.
- Corrected quote package labels and notes in the homepage, contact, campaign and Southern Adelaide forms.
- Improved hero heading line height and spacing, kept standard body text at 16px, and repaired the guide enquiry box's fixed minimum width.
- Strengthened homepage/contact image overlays at the single-column breakpoint. The image-backed text positions are also checked against sampled rendered background pixels, rather than relying on axe's incomplete image/gradient results.
- Made overflowing comparison tables keyboard scrollable, corrected preview image roles, and let review badge visible text supply its accessible name.
- Corrected concept preview trust-band and utility-bar colour collisions with shared styles.

## Design tokens

The existing surface/text/button/input tokens remain the component contract. Updated or added tokens include:

| Purpose | Tokens / colours |
| --- | --- |
| Brand | `--brand-primary: #10231f`, `--brand-secondary: #071421`, `--brand-accent: #c9a86a` |
| Dark surfaces | `--surface-dark: #071713`, `--surface-dark-elevated: #10231f` |
| Light surfaces | `--surface-light: #fffdf8`, `--surface-light-muted: #f3efe6` |
| Dark foregrounds | `--text-on-dark: #fffdf8`, `--text-muted-on-dark: #e4ded2`, `--link-on-dark: #f0cf8a` |
| Light foregrounds | `--text-on-light: #10231f`, `--text-muted-on-light: #3f534c`, `--link-on-light: #7a4b0c` |
| Input | `--input-border: #76664f`, `--input-placeholder: #4d625a`, existing input background/text tokens |
| Focus | `--focus-on-light: #175f50`, `--focus-on-dark: #f0cf8a`; contrasting outer focus shadow |
| Boundaries | `--border-on-light: #76664f`, `--border-on-dark: #879b92` |
| Error | `--feedback-error-on-light: #a82323`, `--feedback-error-on-dark: #ffb4ab` |
| Success | `--feedback-success-on-light: #176b42`, `--feedback-success-on-dark: #8de0b1` |
| Scoped feedback | `--feedback-error` and `--feedback-success` follow each form's surface |

## Files modified

- `premium-site.css` — authoritative shared stylesheet and route component contracts.
- `src/styles/premium-site.css` — mirror synchronized by the build.
- `media/stitch/stitch-screens.css` — concept preview surface repairs.
- `scripts/build-site.mjs` — review badge accessible name.
- `site-src/data/seo-v4.mjs` — guide enquiry box and keyboard-accessible comparison tables.
- `site-src/content/index.html` — homepage review badge accessible name.
- `site-src/content/removalists-adelaide/index.html` — keyboard-accessible planning table.
- `site-src/content/premium-moving-concepts/premium-hero-and-trust-section/index.html` — image roles.
- `site-src/content/premium-moving-concepts/testimonials-and-premium-footer/index.html` — image roles.
- `scripts/serve-site.mjs` — local audit server stream cleanup and read error handling.
- `scripts/readability-audit.mjs` — repeatable browser route, responsive, screenshot and axe audit.
- `package.json` / `package-lock.json` — direct axe development dependency and audit command; existing versions were retained.
- `tests/contrast-audit.test.mjs` — contrast-pair regressions and updated card contract.
- `tests/contact-page-design-system.test.mjs` — stronger package-label contract.
- `READABILITY_REPAIR_REPORT.md` — implementation and verification record.

## Validation and evidence

All 95 rendered routes passed the full browser/axe pass. Affected routes were rechecked after the final repairs. The final compiled build also passed 570 responsive checks for opaque button contrast, document overflow and clipped controls. The route ledger below identifies the axe run used for each route.

| Check | Result |
| --- | --- |
| Routes / redirect documents / indexable routes | 95 / 27 / 80 |
| Viewports | 320, 390, 768, 1024, 1440, 1920px |
| Axe rule violations | 0 |
| Opaque button contrast failures | 0 |
| Horizontal overflow / clipped controls / browser errors | 0 / 0 / 0 |
| Additional intermediate-width axe checks | 56 passed |
| Component hover/focus/active and feedback checks | 140 passed |
| Menu, keyboard focus and validation-state checks | 33 passed |
| Rendered hero text/background samples | 100 passed; minimum 6.95:1 |
| Existing repository suite | 203 passed |
| Focused SEO/design/contrast suites | 79 passed |
| Quote/conversion browser checks | 30 passed |
| Additional responsive browser checks | 15 passed |
| Production build / SEO validator / diff whitespace | Passed |

Lighthouse accessibility: `/` **100**; `/adelaide-moving-guides/office-relocation-checklist-adelaide/` **100**; `/contact-us/` **100**; `/furniture-removalists-adelaide/` **100**.

Manual screenshot comparison covered the 15 shared body/template families and the concept previews, with 50 fresh after screenshots.

The browser checks used the Windows-generated build. For the final pass, an identical copy was served from the native Linux filesystem after WSL intermittently returned read errors for the Windows drive. The recursive comparison is empty: `native-copy-diff.log`. The local static preview server now releases file streams on cancelled requests and reports read errors; production API endpoints were not changed.

Evidence directory: `tmp/readability/` (local, ignored by Git).

- Baseline route results: `before/results.json`.
- Before screenshots: `before/`.
- Full route results and screenshots: `complete/`; subsequent affected-route checks: `last-check/` and `final-buttons/`.
- Fresh final-build after screenshots: `verified-after/` (50 captures at 390px and 1440px).
- All-route final opaque-button contrast and geometry checks: `solid-buttons/results.json`.
- Additional 320/768/1024/1920px template checks: `complete/intermediate-widths.json`.
- Menu, keyboard and validation states: `final/states.json`.
- Button/control pseudo-state and feedback checks: `complete/component-states.json`.
- Rendered hero pixel samples and ratios: `final/hero-pixels.json`, `final/hero-contrast.json`.
- Lighthouse reports: `lighthouse-final/`.
- Final production build: `build-final.log`.
- Full existing suite: `tests-final.log` (203 passed).
- Focused suites, run serially to avoid concurrent generator output writes: `focused-tests-serial.log` (79 passed).
- Quote/conversion browser tests: `conversion-browser.log` (30 passed).
- Additional responsive browser tests: `visual-browser.log`.
- SEO and component checks: `final-validation.log`, `contrast-tests-final.log`.
- Local server cancellation check: `server-cancellation.json` (50 cancelled requests, then homepage HTTP 200).
- Baseline/final SEO and tracking comparison: `preservation.json`.

The preservation comparison covers all 122 HTML documents: canonical tags, description/robots/Open Graph metadata, JSON-LD and tracking configuration match the baseline. `site.js`, `robots.txt`, the sitemap index and all four sitemap files are byte-for-byte unchanged. API, email, consent and conversion source files and Vercel/domain configuration were not modified. Browser form submissions used mocked responses; no real enquiry was sent.

## Re-run commands

Use Node 22. From `C:\Users\abuba\zq` in PowerShell:

```powershell
npm.cmd run build
npm.cmd test
npm.cmd run seo:validate
```

Start a local server in another PowerShell terminal:

```powershell
node.exe scripts/serve-site.mjs
```

Then run:

```powershell
npm.cmd run test:readability
npm.cmd run test:visual-mobile
```

The audit accepts `AUDIT_BASE_URL`, `AUDIT_DIST_DIR`, `AUDIT_OUTPUT`, `AUDIT_ROUTES` (comma-separated), `AUDIT_FAST_SOLID=1` (geometry and opaque RGB button checks without axe), and `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` and `AUDIT_WORKERS` (1–3). Its default output is `tmp/readability/final/`. Install the matching Chromium browser with `npx.cmd playwright install chromium` if necessary. Do not run generator-based test files concurrently; the repository's `npm test` runner executes those files serially.

## Release status

All work remains local. Production was not changed. Live email delivery and production-domain behaviour are outside the local browser checks.

## All rendered pages reviewed

PASS means six responsive geometry/control checks and no remaining axe findings in the recorded full/affected-route pass. Native form submissions were tested with mocked responses.

| Route | Indexable | Status | Axe evidence directory |
| --- | --- | --- | --- |
| `/` | Yes | PASS | `final-buttons/` |
| `/404.html` | No | PASS | `complete/` |
| `/about/` | Yes | PASS | `final-buttons/` |
| `/adelaide-movers-and-packers/` | Yes | PASS | `complete/` |
| `/adelaide-moving-guides/` | Yes | PASS | `complete/` |
| `/adelaide-moving-guides/apartment-moving-tips-adelaide/` | Yes | PASS | `complete/` |
| `/adelaide-moving-guides/best-time-to-book-removalists-adelaide/` | Yes | PASS | `complete/` |
| `/adelaide-moving-guides/best-time-to-move-adelaide/` | Yes | PASS | `complete/` |
| `/adelaide-moving-guides/how-to-choose-removalists-adelaide/` | Yes | PASS | `complete/` |
| `/adelaide-moving-guides/how-to-prepare-furniture-for-moving/` | Yes | PASS | `complete/` |
| `/adelaide-moving-guides/moving-house-checklist-adelaide/` | Yes | PASS | `complete/` |
| `/adelaide-moving-guides/office-relocation-checklist-adelaide/` | Yes | PASS | `complete/` |
| `/adelaide-moving-guides/prepare-house-move-adelaide/` | Yes | PASS | `complete/` |
| `/adelaide-moving-guides/removalists-cost-adelaide/` | Yes | PASS | `complete/` |
| `/adelaide-removalists-facebook-offer/` | No | PASS | `final-buttons/` |
| `/adelaide-to-brisbane-removals/` | Yes | PASS | `complete/` |
| `/adelaide-to-canberra-removals/` | Yes | PASS | `complete/` |
| `/adelaide-to-melbourne-removalists/` | Yes | PASS | `complete/` |
| `/adelaide-to-perth-removals/` | Yes | PASS | `complete/` |
| `/adelaide-to-sydney-removalists/` | Yes | PASS | `complete/` |
| `/apartment-removalists-adelaide/` | Yes | PASS | `complete/` |
| `/apartment-removals-adelaide/` | Yes | PASS | `complete/` |
| `/cheap-removalists-adelaide/` | Yes | PASS | `complete/` |
| `/contact-us/` | Yes | PASS | `last-check/` |
| `/door-2-door-movers-alternative-adelaide/` | Yes | PASS | `complete/` |
| `/furniture-removalists-adelaide/` | Yes | PASS | `complete/` |
| `/guides/cheap-vs-fixed-price-removalists-adelaide/` | No | PASS | `complete/` |
| `/guides/how-to-choose-removalists-adelaide/` | No | PASS | `complete/` |
| `/guides/interstate-moving-from-adelaide/` | No | PASS | `complete/` |
| `/guides/moving-house-checklist-adelaide/` | No | PASS | `complete/` |
| `/house-removals-adelaide/` | Yes | PASS | `final-buttons/` |
| `/insurance-and-coverage/` | Yes | PASS | `complete/` |
| `/interstate-removals-adelaide/` | Yes | PASS | `complete/` |
| `/moving-company-adelaide/` | Yes | PASS | `complete/` |
| `/office-removals-adelaide/` | Yes | PASS | `complete/` |
| `/packing-services-adelaide/` | Yes | PASS | `complete/` |
| `/premium-moving-concepts/` | No | PASS | `final-buttons/` |
| `/premium-moving-concepts/brand-logo/` | No | PASS | `complete/` |
| `/premium-moving-concepts/luxury-pricing-packages/` | No | PASS | `complete/` |
| `/premium-moving-concepts/premium-hero-and-trust-section/` | No | PASS | `last-check/` |
| `/premium-moving-concepts/testimonials-and-premium-footer/` | No | PASS | `last-check/` |
| `/privacy-policy/` | No | PASS | `complete/` |
| `/removalists-adelaide-cbd/` | Yes | PASS | `complete/` |
| `/removalists-adelaide-hills/` | Yes | PASS | `complete/` |
| `/removalists-adelaide-prices/` | Yes | PASS | `complete/` |
| `/removalists-adelaide/` | Yes | PASS | `complete/` |
| `/removalists-allenby-gardens/` | Yes | PASS | `complete/` |
| `/removalists-andrews-farm/` | Yes | PASS | `complete/` |
| `/removalists-brighton/` | Yes | PASS | `complete/` |
| `/removalists-burnside/` | Yes | PASS | `complete/` |
| `/removalists-campbelltown/` | Yes | PASS | `complete/` |
| `/removalists-elizabeth/` | Yes | PASS | `complete/` |
| `/removalists-gawler/` | Yes | PASS | `complete/` |
| `/removalists-glenelg/` | Yes | PASS | `complete/` |
| `/removalists-golden-grove/` | Yes | PASS | `complete/` |
| `/removalists-goodwood/` | Yes | PASS | `complete/` |
| `/removalists-grange/` | Yes | PASS | `complete/` |
| `/removalists-henley-beach-south/` | Yes | PASS | `complete/` |
| `/removalists-henley-beach/` | Yes | PASS | `complete/` |
| `/removalists-hyde-park/` | Yes | PASS | `complete/` |
| `/removalists-kensington-gardens/` | Yes | PASS | `complete/` |
| `/removalists-linden-park/` | Yes | PASS | `complete/` |
| `/removalists-magill/` | Yes | PASS | `complete/` |
| `/removalists-malvern/` | Yes | PASS | `complete/` |
| `/removalists-marion/` | Yes | PASS | `complete/` |
| `/removalists-mawson-lakes/` | Yes | PASS | `complete/` |
| `/removalists-medindie/` | Yes | PASS | `complete/` |
| `/removalists-mitcham/` | Yes | PASS | `complete/` |
| `/removalists-modbury/` | Yes | PASS | `complete/` |
| `/removalists-mount-barker/` | Yes | PASS | `complete/` |
| `/removalists-munno-para/` | Yes | PASS | `complete/` |
| `/removalists-northern-adelaide/` | Yes | PASS | `complete/` |
| `/removalists-norwood/` | Yes | PASS | `complete/` |
| `/removalists-pennington/` | Yes | PASS | `complete/` |
| `/removalists-port-adelaide/` | Yes | PASS | `complete/` |
| `/removalists-prospect/` | Yes | PASS | `complete/` |
| `/removalists-queens-park/` | Yes | PASS | `complete/` |
| `/removalists-salisbury/` | Yes | PASS | `complete/` |
| `/removalists-semaphore/` | Yes | PASS | `complete/` |
| `/removalists-southern-adelaide/` | Yes | PASS | `last-check/` |
| `/removalists-st-peters/` | Yes | PASS | `complete/` |
| `/removalists-stepney/` | Yes | PASS | `complete/` |
| `/removalists-tea-tree-gully/` | Yes | PASS | `complete/` |
| `/removalists-toorak-gardens/` | Yes | PASS | `complete/` |
| `/removalists-unley-park/` | Yes | PASS | `complete/` |
| `/removalists-unley/` | Yes | PASS | `complete/` |
| `/removalists-walkerville/` | Yes | PASS | `complete/` |
| `/removalists-west-beach/` | Yes | PASS | `complete/` |
| `/removalists-west-lakes/` | Yes | PASS | `complete/` |
| `/removalists-woodcroft/` | Yes | PASS | `complete/` |
| `/same-day-removalists-adelaide/` | Yes | PASS | `complete/` |
| `/seo-v4/overview/` | No | PASS | `complete/` |
| `/services/piano-movers-adelaide/` | Yes | PASS | `complete/` |
| `/terms-and-conditions/` | No | PASS | `complete/` |
| `/thank-you/` | No | PASS | `complete/` |

## Redirect documents reviewed

These documents retain their redirect intent, canonical destination and noindex policy. Vercel redirect configuration is unchanged.

| Document route | Destination | Status |
| --- | --- | --- |
| `/adelaide-cbd/` | `/removalists-adelaide-cbd/` | Preserved |
| `/adelaide-moving-guides/removalist-cost-adelaide/` | `/adelaide-moving-guides/removalists-cost-adelaide/` | Preserved |
| `/adelaide-to-brisbane-removalists/` | `/adelaide-to-brisbane-removals/` | Preserved |
| `/adelaide-to-melbourne-removals/` | `/adelaide-to-melbourne-removalists/` | Preserved |
| `/adelaide-to-sydney-removals/` | `/adelaide-to-sydney-removalists/` | Preserved |
| `/affordable-removalists-adelaide/` | `/cheap-removalists-adelaide/` | Preserved |
| `/blog/` | `/adelaide-moving-guides/` | Preserved |
| `/cbd-apartment-removals-adelaide/` | `/apartment-removalists-adelaide/` | Preserved |
| `/contact/` | `/contact-us/` | Preserved |
| `/furniture-removals-adelaide/` | `/furniture-removalists-adelaide/` | Preserved |
| `/guides/removalist-cost-adelaide/` | `/adelaide-moving-guides/removalists-cost-adelaide/` | Preserved |
| `/interstate-removalists-adelaide/` | `/interstate-removals-adelaide/` | Preserved |
| `/local-removals-adelaide/` | `/house-removals-adelaide/` | Preserved |
| `/movers-and-packers-adelaide/` | `/adelaide-movers-and-packers/` | Preserved |
| `/office-relocation-adelaide/` | `/office-removals-adelaide/` | Preserved |
| `/privacy/` | `/privacy-policy/` | Preserved |
| `/removalists-northern-suburbs-adelaide/` | `/removalists-northern-adelaide/` | Preserved |
| `/removalists-semore/` | `/removalists-semaphore/` | Preserved |
| `/services/apartment-removals-adelaide/` | `/apartment-removals-adelaide/` | Preserved |
| `/services/furniture-removals-adelaide/` | `/furniture-removalists-adelaide/` | Preserved |
| `/services/house-removals-adelaide/` | `/house-removals-adelaide/` | Preserved |
| `/services/interstate-removalists-adelaide/` | `/interstate-removals-adelaide/` | Preserved |
| `/services/interstate-removals-adelaide/` | `/interstate-removals-adelaide/` | Preserved |
| `/services/office-removalists-adelaide/` | `/office-removals-adelaide/` | Preserved |
| `/services/office-removals-adelaide/` | `/office-removals-adelaide/` | Preserved |
| `/services/packing-services-adelaide/` | `/packing-services-adelaide/` | Preserved |
| `/terms/` | `/terms-and-conditions/` | Preserved |

## Remaining issues

No known critical or serious contrast issues remain in the reviewed local build. Production has not been deployed or altered.
