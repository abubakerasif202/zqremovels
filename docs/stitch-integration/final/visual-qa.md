# Responsive visual QA

Final local build: 2026-10-20. All external requests blocked during browser inspection, including Google Tag Manager, Ads and lead providers. Images eagerly decoded before screenshot capture; no production submissions.

- 80 route/width checks passed: homepage, Glenelg, Norwood, Adelaide hub, interstate hub, Sydney, Perth and Brisbane at 320, 360, 375, 390, 430, 768, 1024, 1280, 1440 and 1920px.
- No document horizontal overflow, sticky CTA/chat launcher collisions, broken images or unexpected tablet navigation.
- 24 axe scans passed with zero WCAG 2 A/AA and WCAG 2.1 A/AA violations at 390, 768 and 1440px.
- About/contact keyboard navigation passed at 768 and 1024px: Enter opens, Escape closes and restores focus.
- Nine normal-motion scroll transition checks passed at 320, 768 and 1024px.
- Mobile gallery and move-step strips scroll using keyboard arrows after focus.

Inspected all pre-existing before/after screenshot segments and all seven Stitch reference designs through contact sheets. Inspected final mobile section strips and all ten viewport hero layouts for all eight routes. Services, calculator summary, inventory entry point, service-area cards, route choices, reviews, gallery, FAQ and quote layout remain readable. Dense local and interstate text remains visible; only existing interactive details and horizontal collections collapse naturally.

Mobile height at 390px (measured document height; screenshot rounding can differ a few pixels):

| Page | Before | Final | Reduction |
| --- | ---: | ---: | ---: |
| Homepage | 31,159px | 15,336px | 51% |
| Glenelg | 24,810px | 18,109px | 27% |
| Interstate hub | 31,601px | 23,045px | 27% |

Evidence: `responsive-results.json`, `accessibility-results.json`, `navigation-results.json`, `sticky-transition-results.json`, `scroll-keyboard-results.json`; full screenshots `<route>-<width>.jpg`, homepage `home-390.png` and `home-1440.png`, and per-route review sheets. `tablet-live-viewport.png` confirms actual tablet image rendering. A Chromium full-page repaint timing artifact in the original home-768 capture was replaced after a 600ms settle; the reproducible capture script now includes that settle.

No outstanding visual or accessibility blocker identified within this matrix. Automated accessibility does not replace a complete manual assistive-technology audit.
