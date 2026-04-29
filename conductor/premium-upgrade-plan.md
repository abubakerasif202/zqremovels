# Implementation Plan: ZQ Removals Premium Upgrade

## 1. Background & Motivation
The ZQ Removals website needs a comprehensive upgrade to a premium, high-trust, and higher-converting brand aesthetic ("Quiet Authority"). The current site is functionally strong with excellent SEO foundations, but the layout is somewhat flat and templated. The goal is to elevate the visual hierarchy, refine typography and spacing, and optimize the conversion paths (quote forms, CTAs) without breaking existing URLs, internal linking, or the static build architecture.

## 2. Scope & Impact
The following files will be modified:
*   `premium-site.css`: Complete refactor into a cohesive, premium design system (tokens, base typography, layout, components).
*   `site-src/partials/header.html`: Navigation refinement, enhanced CTA clarity, and improved mobile experience.
*   `site-src/partials/footer.html`: Better hierarchy, stronger trust signals, and clear internal linking structure.
*   `site-src/content/index.html`: Restructuring the homepage to prioritize the Quote flow, trust ribbons, and service scenarios.
*   `scripts/build-site.mjs`: Upgrading the generated internal page patterns (e.g., suburb, service, and guide pages) to match the new premium components (cards, timeline, logistics grids).
*   `site-src/templates/standard.html`: Minor tweaks if necessary for semantic structure.

## 3. Proposed Solution
1.  **Design System Upgrade:** Refactor `premium-site.css` to use a refined palette (warm ivory backgrounds, dark charcoal heroes, restrained brass accents). Simplify utility classes and improve spacing/typography.
2.  **Shared Shell Improvements:** Overhaul the header and footer to be more editorial, maintaining accessibility and SEO-friendly navigation depth.
3.  **Homepage Redesign:** Reorganize `index.html` to follow the target order: Hero -> Early Trust Strip -> Premium Quote -> Why Choose Us -> Move Scenarios -> Service Grid -> Local Coverage -> Process -> Trust Section -> Final CTA.
4.  **Internal Page System:** Modify `scripts/build-site.mjs` to inject the new premium design patterns into the generated service, suburb, interstate, and guide pages while preserving all crawlable content and headings.
5.  **Authority + Conversion:** Weave practical trust modules (planning, quoting logic) throughout the templates.
6.  **SEO Protection:** Ensure `h1`-`h3` hierarchy, schema logic, and link profiles are untouched or strictly improved.

## 4. Alternatives Considered
*   **React/SPA Migration:** Rejected due to hard constraints and potential SEO risks. The static generator approach is preserved.
*   **Preserving Existing CSS Utilities:** Rejected because creating a truly premium brand requires a cohesive, purposeful styling layer rather than scattered utilities. We will refactor into logical layers within the single `premium-site.css` file.

## 5. Phased Implementation
*   **Phase 1:** CSS Design System Refactor (`premium-site.css`).
*   **Phase 2:** Shared Shell Polish (`header.html`, `footer.html`).
*   **Phase 3:** Homepage Content Restructuring (`index.html`).
*   **Phase 4:** Generator Upgrades (`scripts/build-site.mjs`).
*   **Phase 5:** Build and Validate (`npm run build`, `npm run seo:validate`, `npm run test:quote-api`).

## 6. Verification & Rollback
*   Run the project's internal test suites (`tests/*.test.mjs` and `seo-validate.mjs`) to ensure no regressions in SEO linking or form submissions.
*   If major layout or functional issues occur, we will use Git to roll back changes to the specific files.