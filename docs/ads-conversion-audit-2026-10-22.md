# ZQ Ads conversion implementation audit — 22 October 2026

## Release-readiness continuation

Current classification: **BLOCKED** for staging/release verification. Production environment variable names are now verified by authenticated read-only Vercel metadata; Preview lacks both Redis variables. No values were decrypted or printed. A real CMP preference/restoration path and an authorised staging lead-provider test remain unverified. This continuation preserves the earlier implementation and evidence below; the added current findings and results at the end supersede earlier limitations where explicitly stated.

## Scope and provenance

Historical account facts below are the owner's confirmed audit for 1 September–21 October 2026. No authenticated Ads/GTM/GA4 settings were changed or reverified here. Repository inspection started with a clean tree on `style/zq-premium-template`, HEAD `d181b6f`. Created local branch `fix/ads-conversion-recovery-2026-10-22`; no unrelated files were restored, reset, removed or staged. No commit/push/merge/deployment was made. This is the generator-driven Astro site: `site-src/`, `scripts/build-site.mjs`, shared root client modules and Vercel API functions remain the implementation surfaces. No generated output was hand-edited.

## Historical evidence

| Metric | Audit value |
|---|---|
| Account spend / clicks | A$752.65 / 547 |
| Primary / all conversions | 17 / 173 |
| Search spend / clicks | A$597.44 / 231 |
| Search primary / all conversions | 0 / 22 |
| Website quote action | 0 recorded conversions |
| Mobile Search spend / clicks / primary | A$560.12 / 207 / 0 |
| Mobile Search spend share | about 93.8% |
| Local House Removals | A$275.08 / 112 clicks / 0 primary |
| Apartment Removals | A$264.39 / 67 / 0 |
| Ad group 1 | A$53.75 / 48 / 0 |
| Office Removals | A$4.23 / 4 / 0 |

Both campaigns paused. Seventeen primary conversions were directions/call-related, not verified quote submissions. Search used Maximise Conversions, inspected average daily budget A$15 with historical budget changes. No negatives returned by audit. Outside-SA traffic: 43 clicks / A$44.67, potentially including legitimate interstate demand. Expensive searches and all manual recommendations are in the companion manual-changes document. These figures do not establish that the mobile form was broken, every expensive click was unqualified, or past daily costs breached the budget applicable then.

## Initial findings matrix and final disposition

| Component / file | Existing behavior | Defect or concern | Proposed fix | Risk / required test | Status |
|---|---|---|---|---|---|
| Git / f32efea | Earlier repair is an ancestor of HEAD | Earlier repair could have been overwritten | Inspect ancestry and current implementation | Avoid overwriting working repairs; contract tests | Confirmed present and retained |
| site.js quote forms | Direct Web3Forms POST; strict HTTP/JSON acceptance; UUID fallback generated after acceptance | UUID was browser dedup token, not server-confirmed receipt; no durable provider retry protection | Existing /api/quote relay with durable acceptance receipt | Runtime store/CAPTCHA prerequisites; provider mocks and replay tests | Implemented |
| api/quote.js | Server validation, honeypot, rate limit, configured CAPTCHA, ten-second provider timeout | Existing success response lacked associated UUID | Opt-in receipt claim and accepted response; legacy callers retained | No eligibility on failure/store outage; smoke/security tests | Implemented |
| lib/server/quote-receipts.js | Absent | Concurrent/retried requests could resend provider delivery | Atomic Redis NX claim, accepted XX write, replay and fingerprint conflict | Fail closed; pending outcomes require reconciliation | Implemented |
| analytics.mjs | Accepted UUID guard, memory/session dedup, legacy bridge suppression | Case variants bypassed UUID dedup; generate_lead repopulated cleared GTM data-model fields | Lowercase UUID; clear fields after both events process | Preserve GA4 analytics and thank-you handoff | Implemented |
| site.js diagnostics | Existing form_start/submit engagement | No consistent view/error diagnostic names | Add four PII-free zq_quote_* diagnostic events | Must never trigger primary Ads action | Implemented |
| Attribution | gclid/UTM session persistence despite denied defaults; braid IDs missing | Optional storage ignored consent | Conservative consent gate and braid capture | CMP integration must expose real state; granted/denied unit test | Implemented; live CMP pending |
| src/layouts/Layout.astro | One GTM-WJGKPXFL loader; denied defaults; optional GA4 ID | Remote tag/CMP/GA4 ownership unverified | Preserve code; inspect accounts manually | Preview and consent tests | Preserved |
| vercel.json CSP | Ads connect destinations from f32efea present, no unsafe-eval | Live container could request additional endpoints | Inspect production headers; no speculative broadening | Production Tag Assistant | Preserved |
| Homepage/contact/services | Existing above-fold quote/call CTAs, rate conditions, canonical service pages | Mobile defects were unverified | Eight-width browser/axe audit; repair only reproduced issues | Screenshots, inputs, overflow, menu and form E2E | See evidence below |
| SEO generator/registry | Apex canonicals, existing consolidated aliases, sitemap exclusions | Regression risk from redesign/route assumptions | Preserve and run suite/validator | Canonical/schema/link/sitemap tests | Preserved |
| Historical tracking docs | Older generate_lead trigger/lead_id recipes | Contradict current accepted event contract | Mark older guide superseded; new exact manual spec | Human account review | Updated |

## Implemented acceptance contract

The browser creates a UUIDv4 **before** its logical request; the server associates it with the sanitised lead payload. Atomic durable claim occurs before provider delivery. Only successful provider HTTP + strict `success === true` followed by successful accepted-state persistence produces `submission_status=accepted` and that UUID in the server response. Browser requires strict success, accepted status, valid UUIDv4 and exact request/response ID match. No client-generated fallback can make an unconfirmed response eligible.

Same-ID retry replays accepted receipt without a second provider delivery. A conflicting payload is rejected. Pending/timeout/ambiguous state is retained, never blindly resent. Receipt TTL is seven days; browser pending ID persists up to seven days across reloads where session storage works. No PII is stored in that client marker or dataLayer. Only a business-fields fingerprint, status, timestamps and UUID enter the receipt store. IP/edge geolocation, page URL and campaign attribution are excluded from the fingerprint so network, navigation and consent changes do not create false conflicts. The original server spam/validation/rate-limit/CAPTCHA paths remain in force before delivery.

The earlier one-time thank-you handoff remains: it avoids cancelling the delayed Ads request during navigation. Direct thank-you visits do not convert. Memory/session dedup plus transaction-ID mapping in GTM prevent duplicate attribution. Storage/analytics blocking can reduce measurement; an accepted enquiry must never be reclassified as a failed lead solely because analytics failed. No promise of exactly-once email delivery or infinite deduplication is made.

`generate_lead` remains analytics only. There are no new direct Ads conversion calls or standalone Ads scripts. Both accepted and generate_lead callbacks clear GTM's inherited submission fields; the legacy bridge guard is set before either event. Remote duplicate tags/imports still require manual inspection.

## Changed files

- `site.js`: protected endpoint, stable pending request ID, strict receipt response validation, 50-second request timeout (45-second server-function budget), safe ambiguous-result guidance, four diagnostic event hooks, consent-gated attribution, braid fields.
- `api/quote.js`: durable receipt integration, accepted replay/conflict/pending handling, braid metadata, no-store API responses.
- `lib/server/quote-receipts.js`: server-only atomic Redis receipt adapter; no new dependency.
- `analytics.mjs`: UUID canonicalisation, inherited-key cleanup, diagnostic dispatcher, consent-gated braid persistence.
- `tests/accepted-quote-contract.test.mjs`: callback and case-insensitive dedup regressions.
- `tests/quote-form-response.test.mjs`: matching confirmed receipt required; malformed/missing/invalid responses rejected.
- `tests/quote-api-security.test.mjs`: durable replay, storage outage, provider ambiguity and acceptance-write failure tests.
- `tests/conversion-tracking.spec.ts`: local endpoint mocks, accepted receipt/reload/navigation checks, timeout/spam/missing/invalid-ID scenarios.
- `tests/ads-recovery-attribution.test.mjs`: denied/granted consent, braid persistence and diagnostic privacy.
- `tests/stitch-functional.spec.ts`: update calculator/form mocks to the protected local endpoint.
- `tests/seo-conversion-pass.test.mjs`: update endpoint regression to reflect intentional relay migration; preserve native fallback assertions.
- `scripts/ads-recovery-qa.mjs`: eight-width/six-route Chromium and supported-WebKit screenshots, overflow/input-size/page-error and axe checks; all APIs blocked.
- `docs/google-ads-conversion-tracking.md`: supersession warning on historical instructions.
- Three dated documents: this audit, exact manual account changes and production/rollback runbook.

## Production observations and unreproduced concerns

Read-only Chromium GET inspection of homepage, contact, house, canonical apartment, office and interstate pages returned HTTP 200 on apex HTTPS, matching canonicals, a CSP header and one GTM loader. At 390px none overflowed. Production screenshots and JSON are under `artifacts/ads-recovery-2026-10-22/`. Third-party/API requests were blocked during this inspection; it proves layout/source integration, not live Ads requests or provider delivery. The homepage already states Adelaide local/interstate services, quote/call options and published A$75/A$89 per half-hour with applicable one-hour travel/call-out conditions. No pricing, reviews, claims, service copy, branding or SEO routes were invented.

Canonical destinations are `/house-removals-adelaide/`, `/apartment-removalists-adelaide/`, `/office-removals-adelaide/`, `/interstate-removals-adelaide/`. Earlier QA used obsolete aliases on the static server, which does not apply Vercel redirects. Those synthetic 404s are not production defects. Auditing during the full suite also produced transient missing-output results because tests rebuild the directory. Only the final stable-build audit is acceptance evidence.

## Evidence and remaining gates

Final executed results are appended below after verification. A build does not establish field Core Web Vitals. No real customer enquiry or synthetic production lead was submitted. No authenticated account destination/label, transaction-ID mapping, CMP restoration, GA4 property or Ads recording status was verified. Values in older checked-in reports are not fresh account evidence and are not reproduced here.

Release gates: verify server provider credential + Redis configuration and ACL, configured CAPTCHA browser integration, staging function delivery/replay, CMP consent state/restoration, manual GTM exact accepted trigger + transaction ID, and one separately authorised genuine production lead. No-JS forms retain their previous provider delivery path without JavaScript conversion coverage. WebKit/physical keyboard checks remain environment/device requirements if unavailable locally. Existing test TODO stays out of scope.

### Executed verification

| Command/check | Actual result |
|---|---|
| PowerShell `npm.cmd test` | API smoke passed; 423 Node tests passed, 0 failed, 1 existing TODO (office-page links from suburb pages). This full run preceded the final additional focused cases; all subsequent receipt/privacy changes were rerun in the focused suite below. |
| `node --test tests/accepted-quote-contract.test.mjs tests/quote-form-response.test.mjs tests/quote-api-security.test.mjs tests/ads-recovery-attribution.test.mjs` | Final 36 passed, 0 failed, including stale attribution after consent revocation. |
| PowerShell `npm.cmd run build` | Passed under Windows Node 22.23.1; Linux Node 22 attempt failed due pre-existing missing native Lightning CSS binding. No dependency churn. |
| PowerShell `node --test --test-concurrency=1 tests/search-console-fixes.test.mjs tests/seo-conversion-pass.test.mjs tests/eeat-audit.test.mjs` (after final build) | 72 passed, 0 failed. |
| PowerShell `npm.cmd run seo:validate` | Passed, 108 pages, 0 bad pages; 79 sitemap page URLs, 1 noindex exclusion and 28 redirect exclusions. |
| Playwright conversion + mobile visual + Stitch functional suites, all five existing projects, 2 workers | Stable final broad run: 177 passed, 28 intentional skips. Earlier interrupted/racing runs are discarded; two calculator mocks still targeting the old provider URL were corrected before this passing run. |
| Playwright conversion suite, Mobile Chrome 390px (after final privacy fix) | 21 passed, 0 failed. |
| Playwright `--grep='ambiguous response retry across reload'`, all five projects | 5 passed; the same logical UUID survives reload and produces one accepted event after the retry. |
| `node scripts/ads-recovery-qa.mjs before` / `after` | Each stable audit: 48 Chromium route/viewport checks (6 routes × 8 widths), 0 overflow, 0 visible inputs below 16px, 0 page exceptions, 0 axe WCAG A/AA violations at sampled 390px. WebKit unavailable due missing Linux libraries. This is sampled automated accessibility evidence, not a full WCAG certification. No visual repair was necessary; before/after labels capture the preserved design. |
| `node scripts/quote-api-smoke.mjs` (final) | Passed with mocked provider. |
| `node --check` changed JavaScript modules / QA script; `git diff --check` | Passed; Git emits an informational CRLF normalisation warning for the existing Windows test file. |
| PowerShell `npm.cmd ls --depth=0` / lockfile comparison | Exit 0; package/lock root declarations match. Pre-existing extraneous optional WASM packages retained. No install, prune or lockfile change. |
| Lint / TypeScript | No repository lint/typecheck scripts exist. JavaScript syntax/build and Playwright TypeScript execution passed; no standalone lint or typecheck pass is claimed. |

### Performance measurement

One Lighthouse 13.5.0 mobile lab run against the uncompressed local static server, with Google tracking endpoints blocked: performance **79**, simulated LCP **4668ms**, TBT **0ms**, CLS **0**. The LCP element is the hero H1. Report identifies render-blocking home CSS (~167KB uncompressed, ~1509ms modeled blocking) and ~59KiB estimated unused CSS at initial viewport. This does not prove that below-fold styles are unused by the page. Actual observed render timing and simulated network timing differ; local server has no production compression/cache behavior. The initial implementation made no broad CSS removal or asynchronous stylesheet change on this evidence. The continuation below removes only unrelated static route contexts from the purge input, preserving complete route markup and dynamic state selectors. Validate compressed production delivery and field p75 before deciding on a separately scoped critical-CSS change. INP was not measured; TBT is not INP. Targets are not claimed achieved. Lighthouse CLI initially could not handle the inherited Windows temporary directory; the successful run attached directly to a Playwright-managed Chromium debugging port.

### Evidence paths and review status

- `artifacts/ads-recovery-2026-10-22/before.json`, `after.json`: stable six-route/eight-width results.
- `before-chromium-{route}-{width}.png`, `after-chromium-{route}-{width}.png`: full-page screenshots at 320/390/1440px (home filename uses `home`).
- `production-home-390.png`, `production-contact-390.png`, `production-readonly.json`: read-only production observations.
- `lighthouse-home.json`: complete measured lab report.
- `verification.json`: compact command/result evidence; screenshots/reports remain local untracked artifacts, not a commit or release.

Ready for human code review with explicit release prerequisites, **not yet approved for production or campaign restart**. Provider delivery/Redis ACL/CAPTCHA/CMP integration and live GTM/Ads attribution need the authorised staging/production verification in the runbook. Existing security headers, route registries, sitemap rules, content, branding, phone and rates were preserved. No production deployment or advertising/analytics account mutation occurred.

## Release-readiness review findings and fixes (continuation)

The existing feature branch and all earlier uncommitted work were retained. This review made these additional scoped changes:

| Finding | Current fix / evidence | Limit |
|---|---|---|
| Provider explicitly rejected a request but its receipt stayed pending | Durable **rejected** terminal state for strict `success:false` on HTTP 200 or 4xx; browser clears only that confirmed failed ID for a corrected user request | Ambiguous/5xx/timeout/write-failure receipts still block resend; no false conversions |
| Replay could conflict after URL/consent changes | Fingerprint uses normalised business fields, excluding edge IP, source URL and campaign attribution | Changed business details remain a conflict requiring reconciliation |
| A previously consumed CAPTCHA could prevent accepted receipt retrieval | Read-only receipt lookup before challenge re-verification; no new delivery during replay | All new deliveries still pass normalisation, honeypot, rate limit and configured CAPTCHA |
| Client timeout shorter than worst-case bounded dependency path | 50-second browser timeout and local Vercel function maxDuration 45 seconds; approximately 35-second dependency bound | Deployed runtime/plan setting still requires release verification |
| Client pending ID expired before seven-day server receipt window | Pending ID now retained up to seven days, aligned with server window | Cleared/blocked browser storage and expiry remain bounded deduplication limitations |
| Optional attribution could miss a late consent grant | `zq:consent-updated` hook captures grants/clears revocation; submission recaptures only when permitted | Actual CMP state/restoration must be integrated; the hook grants nothing |
| Raw provider/exception diagnostics could disclose request context | Generic provider errors and exception logs; no raw error objects/customer snippets in these diagnostics | Existing approved server telemetry still needs its destination/privacy review |
| Missing server provider key could use a hardcoded fallback | Removed server fallback; missing configured key fails closed | Existing native no-JS Web3Forms action retained; no JavaScript conversion coverage for that path |
| API URL incurred redirect before submission | Client now posts directly to observed canonical `/api/quote/` | GET 405 proves routing/method protection only, not POST delivery |
| CSS purge retained unrelated route classes referenced by shared JavaScript | Remove static `page-*` context tokens only from JS purge input; complete route HTML still supplies active classes and all dynamic state selectors remain | No async stylesheet trick, critical CSS redesign, font removal or animation changes |
| Browser still preconnected to the provider after migration to server relay | Removed unused Web3Forms preconnect | Native fallback continues to use its existing provider action |

The server receipt adapter now records timestamps, supports safe lookups and explicit rejection, and retains atomic NX claims / XX state updates with seven-day EX expiry. Controlled Redis REST fixtures verify concurrency, exact TTL/options, no TTL renewal on lookup, expired XX refusal, malformed JSON/envelopes, Redis/HTTP errors, invalid configuration and identifier checks. API fixtures prove a single delivery owner under concurrent requests, no resend after ambiguous delivery, no eligible receipt after failed acceptance persistence, rejected-request recovery, consumed-CAPTCHA replay, and URL/attribution-insensitive receipt lookup. No production Redis commands were executed.

### Current configuration evidence

Authenticated read-only Vercel project/environment metadata confirms Production KV_REST_API_URL, KV_REST_API_TOKEN and WEB3FORMS_ACCESS_KEY definitions. Preview lacks both KV variables; provider key is defined but its test-inbox isolation is unknown. No inspected Turnstile/reCAPTCHA secret definition exists in Production/Preview and no source widget exists. VITE_GA_MEASUREMENT_ID is defined; destination correctness/property ownership remains unverified. No secret values were decrypted or printed. Read-only GETs show `/api/quote` redirects to `/api/quote/`, where both reach method protection (405).

Current public GTM compiled resource is **version 6**, with Conversion Linker + Ads conversion tags, the accepted event/three DLV predicates/hostname condition and transaction ID `submission_id`. No published legacy bridge/Custom JS claim was found. Do not replace that current configuration with a historical version 5. The manual report provides the exact earlier v5 recipe as a compare/verify specification. This source inspection does not establish successful tag firing, consent, Ads action identity or recorded production conversion.

No source CMP preference UI or recognised public GTM CMP tag was found. The integration owner must verify intended behavior: either approved permanent denied defaults (no optional attribution storage), or a real choice/restoration implementation feeding the existing consent contract and new update hook. A banner is not invented by this repair and submission never grants consent. Refused consent intentionally prevents optional attribution persistence; do not label that expected behavior a tracking defect.

### Comparable performance evidence

Three cold Chromium/Lighthouse mobile runs per phase used the same uncompressed localhost server, same simulated throttling, same route and Google endpoint blocking, with no concurrent build/browser audit. Reports and summaries are in `artifacts/ads-recovery-2026-10-22/readiness/`.

| Measure | Baseline | After route-context purge |
|---|---:|---:|
| Median Lighthouse performance | 79 | 81 |
| Median simulated LCP | 4662.87ms | 4518.18ms (final-build recheck) |
| Median TBT | 0ms | 0ms |
| Median CLS | 0 | 0 |
| Homepage CSS file | 166,660 bytes | 155,205 bytes (6.9% smaller) |
| Contact CSS file | 170,576 bytes | 139,832 bytes (18.0% smaller) |

The LCP element remains `h1#home-hero-title`. Render-blocking CSS and competition with the preloaded local fonts are the critical path; the report did not identify excessive JavaScript blocking (TBT=0) or an image-delivery opportunity. Both local font files remain intact. GET-only production CSS inspection confirms **Brotli encoding** and versioned immutable caching; the local server is uncompressed, so these lab numbers do not establish production field p75. LCP remains above 2.5s. No field INP was measured. The modest lab gain is demonstrated; target compliance is not claimed.

### Current verification and preserved design

- Full PowerShell `npm.cmd test`: **441 passed, 0 ordinary failures, 1 existing office-linking TODO**, plus mocked API smoke success. The final additional exception-privacy and ambiguous HTTP 202 cases were covered in the focused rerun.
- Final focused receipt/privacy/CSS suite: **56 passed, 0 failed**.
- Production build with Windows Node 22: **passed**.
- SEO validator: **108 pages, 0 bad pages, 79 sitemap URLs**, same noindex/redirect exclusions.
- Chromium conversion, mobile visual and Stitch functional suites: **192 passed, 28 intentional skips** across the five configured projects. This includes rejection recovery, late consent changes, reload retry, mobile navigation/sticky controls, reduced motion, calculator payloads and reduced-height chat composer checks.
- Readiness screenshots: **48/48 before/after pairs byte-identical**, six canonical landing pages × eight requested widths; no viewport overflow. `visual-comparison.json` records the comparison.
- WebKit launch attempted using the existing installed browser: **unavailable due missing host libraries**. No operating-system packages installed. Physical iOS/Android Safari/Chrome keyboard/rotation/safe-area/zoom behavior still requires device checks.
- `git diff --check` and changed JavaScript syntax checks: **passed**. Source design CSS, business content, canonical registry, redirects and existing untracked assets were preserved.

Additional files for this continuation: `scripts/build-site.mjs`, `vercel.json`, `tests/performance-build.test.mjs`, `tests/quote-receipts.test.mjs`, `scripts/ads-readiness-performance.mjs`, `scripts/ads-readiness-visual.mjs`, plus scoped receipt/client/test/report edits listed above. No dependencies, lockfile, business content, pricing, logo or canonical routes changed.

### Classification and next action

**BLOCKED** for release/staging sign-off: Preview Redis is missing, provider test-destination isolation is unverified, and intended consent behavior plus authorised staged end-to-end delivery remain unverified. Next required action: securely configure isolated Preview KV REST credentials and verify its provider destination, then execute the controlled staging procedure in the production runbook. Confirm intended denied-consent policy or integrate/test the approved CMP. No deployment, push, merge, GTM publication, Ads/GA4 mutation or campaign restart occurred. A separately authorised genuine production test must confirm provider delivery and eventual Google Ads recording before calling live conversion tracking verified.
