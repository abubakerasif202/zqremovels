# Stitch integration verification

Date: 2026-10-20. Branch: `feat/stitch-premium-integration`.

Continued the existing uncommitted Stitch integration from `ab0ecab`; preserved its source changes, reference screens and before/after evidence. No reset, stash, merge or production deployment.

## Implementation

- Retained the existing homepage, local and interstate design and CSS cleanup.
- Chat launcher and tablet panel clear the actual sticky CTA height, including wrapped text and safe-area offsets, without depending on its entrance transform.
- Shared tablet navigation uses the same 1120px breakpoint, including contact/about pages.
- Reduced mobile card padding and section gaps without clipping descriptions or hiding SEO content.
- Quote submit buttons restore their original DOM nodes, including SVG artwork, after errors and `pageshow`.
- Homepage entrance and gallery effects target the current markup. Estimator tabs expose the correct selected state and quote-confirmed scheduling wording.
- Region and route filters use native button-group semantics with synchronized pressed states. Horizontal process/gallery strips accept keyboard focus and retain visible focus outlines.
- Verified rendered crew packages: $75 / 30 min and $89 / 30 min. Generator input and rendered output use valid characters.

## Test review and safety

Reviewed the changed assertions against current behavior. Kept SEO, canonical, quote acceptance, UUID, privacy and security assertions. Contrast checks now resolve token aliases and inspect actual computed contrast. Removed only the obsolete second homepage-form case; added an explicit assertion for the current single form.

All submission journeys use mocked Web3Forms/AI responses with external traffic blocked. No real leads, Ads conversions or GTM configuration changes were made. `analytics.mjs`, `/api/quote`, route registry, redirects and deployment configuration are unchanged.

## Completed local validation

- `npm run build`: PASS.
- `npm test`: 42 files, 416 passes, zero failures, one pre-existing TODO concerning shared office-page links.
- Focused final quote, contrast, homepage and redesign regressions: 30 passes, zero failures.
- Functional/conversion/chat browser runs: 53 passes, zero failures. Project-specific cases were covered through supplemental runs.
- Mobile/contact visual browser suites: 62 passes, zero failures, 28 explicit project-filter skips (the extra 320px checks run once; phone-specific chat checks run on their designated projects). Includes no-JS visibility and reduced-motion/one-time entrance behavior.
- After the final mobile spacing and accessibility fixes, the affected phone/tablet visual and functional suites passed again: 36 passes, zero failures, eight project-filter skips. The final build, 30 focused regressions and SEO validation also passed again.
- Mocked acceptance hands off to `/thank-you/`, emits accepted UUIDv4 submission events once, and survives reload without duplicates. Rejection generates no conversion. Calculator inventory remains in the actual mocked provider payload.
- `npm run seo:validate`: PASS, 108 pages validated, zero bad pages.
- Canonical sitemap: 79 page URLs (5 pages, 15 services, 48 suburbs, 11 guides), 79 image URLs, five child sitemaps; one noindex and 28 redirect exclusions. All canonical URLs remain on `https://zqremovalsadelaide.com.au`.
- Read-only code review and `git diff --check`: PASS.

## Final responsive and accessibility QA

PASS: 80 route/width combinations across home, Glenelg, Norwood, Adelaide hub, interstate hub, Sydney, Perth and Brisbane. Widths: 320, 360, 375, 390, 430, 768, 1024, 1280, 1440 and 1920px. No horizontal document overflow, CTA/chat collisions or broken images; tablet navigation is consistent. Captures wait for decoded images and live in `final/`.

PASS: 24 axe scans at 390/768/1440px, zero WCAG 2 A/AA and 2.1 A/AA violations. Keyboard navigation on about/contact passed all four tablet checks. Normal-motion CTA transitions passed nine geometry checks. Gallery and process strips scroll with keyboard arrows.

All existing before/after captures and seven Stitch reference sets were inspected through contact sheets. The final layout retains the established navy/orange direction and actual business information. At 390px the homepage is 15,340px high versus 31,159px before (~51% shorter); Glenelg is 18,113px versus 24,810px (~27% shorter). Dense hub content remains available rather than being hidden to reduce height.

This report establishes local validation. The delivered preview URL, exact commit SHA and remote verification are provided in the release response. Production and main remain outside this release scope.
