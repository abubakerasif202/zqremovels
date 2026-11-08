# Premium truck selection
Objective: HF-scale cards in ZQ navy/lime; branch feat/animated-truck-selection; delivery single-pr (requested focused commit and PR).
Runner: node:test and Playwright. Route: inline; existing state flow understood. Forecast: approximately 350 authored lines.

## Specs
- S1: "Create a dedicated, full-width truck selection section with two large cards side by side." "Move the large photographic truck cards into a dedicated section immediately after the hero."
- S2: "Price: $65 / 30 MIN" "Hourly equivalent: $130 / HR" "Starting price: $75 / 30 MIN" "Hourly equivalent: From $150 / HR" "Additional crew option: 3 movers — $89 / 30 MIN ($178/hr)"
- S3: "Never silently overwrite a manually selected truck." "Keep the pickup and destination details." "Preserve selected property size and crew package." "Include the truck preference in the Web3Forms enquiry."
- S4: "Do not change GTM, Google Ads conversion IDs, submission events or tracking conditions." "Preserve existing call-out/travel charge disclosures."
- S5: "At 320px–390px:" "Show cards vertically." "Respect reduced-motion preferences."
- S6: "npm run build" "npm test" "npm run seo:validate" "npm run test:visual-mobile" "Take desktop and mobile screenshots" "Create a focused commit and PR once tests pass."
- S7: User approved supplied artwork as "illustrative artwork", not verified fleet photography, with requested navy-and-lime styling: "yes".

- S8: "push deploy live" � release this verified change to the existing ZQ production domain, with remote revision and live smoke proof.

## Tasks
- T1 S1-S5,S7 inline complete — separate cards, concise hero, preserve native radio state, artwork disclosure and accessible pricing.
- T2 S3-S6 inline complete — regression tests, build/SEO/mobile checks, visual evidence, review, focused commit/PR.

- T3 S8 inline pending � push, PR, production deployment and live verification; use existing project settings, exclude unrelated dirty files.

## Log
- L1 Request: "ZQ Removals must have stunning, large photographic truck-selection cards comparable to HF Removals, with ZQ's own premium navy and lime identity — not tiny cartoon trucks inside a cramped form."
- L2 User supplied HF reference screenshot then ZQ Removals Truck Options (1).png. Asked: "Should I treat it as approved illustrative artwork, not verified photography of ZQ’s actual fleet, while retaining your requested navy-and-lime styling?" Answer: "yes".
- L3 Existing package.json/package-lock.json edits and untracked evidence preserved. Media provenance documented generated. Built-in image tool removed overlaid UI from supplied artwork to produce clean diptych; will disclose illustrative status visibly.
- L4 Engram reads/writes fail unknown_project despite current-project resolving zqremovels. Mirror pending, no session identity invented.

- L5 User expanded release authorization: "push deploy live".
- L6 RED: two new structural tests failed before implementation; GREEN: both now pass. Node suite 509/509 and SEO80pages/0bad passed twice. Targeted browser27/27 passed including six widths, mock Web3Forms/consent conversion behavior, stagger0ms/140ms and no-JavaScript fallback.
- L7 First mobile run overlapped test-triggered builds and failed transiently; discarded as unreliable proof. Stable rerun62passed/28conditional skips; final source rerun pending. Do not run browser suites during npm test because that suite rebuilds site-dist repeatedly.
- L8 Review found ineffective stagger inherited from shared -400ms rule; scoped CSS override fixed and independently rechecked. JS/TS review found no change-caused blocker. tsc is blocked by pre-existing untracked tests/site-health.spec.ts:18-19 DOM typing; ESLint not installed.
- L9 Rollback: revert the focused truck-card work unit; no API, tracking, dependency, environment or routing settings changed. Unrelated package changes excluded.

- L10 Final source validation: npm run build PASS; npm test509/509 PASS; seo:validate80pages/0bad PASS; functional/tracking27/27 PASS; test:visual-mobile62PASS/28conditional skips. Screenshots at artifacts/truck-selection/premium-{320,375,390,768,1366,1920}.png and premium-hero-final-{320,1366}.png reviewed against supplied HF reference. git diff --check and node --check site.js PASS. Risk: none (additive scoped visual selection relocation; existing state, public APIs, tracking and release configuration unchanged).
