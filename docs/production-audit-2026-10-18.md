# Production audit and remediation — 18 October 2026

Scope: repository, source generator, public production website, conversion
contracts, accessibility, mobile UI, SEO, dependency security and deployment.
Primary domain: https://zqremovalsadelaide.com.au.

## Architecture and release baseline

- Repository: abubakerasif202/zqremovels; established production branch main.
- Starting commit: 51b18bae490bae8b5a9ef3e62b9f2d60c83f95db.
- Node 22, Astro static rendering orchestrated by scripts/build-site.mjs.
- site-src is source; site-dist is ignored generated output.
- Existing Vercel project zq (prj_6vIhorJ04HTaDOn6oOSHNsezQ4Oh).
- Production environment key names were inspected without revealing values.
  Existing AI, Redis, provider and GA configuration was retained.
- No real quote/AI lead, payment, Google Ads or GTM account mutation was made.

## Prioritised findings and repairs

| Severity | Root cause | Repair |
| --- | --- | --- |
| High | Forest, gold and neon override layers conflicted with approved navy/orange identity and inherited unreadable text on mixed surfaces. | Repaired shared palette and affected component states; bright orange CTAs use navy text; removed continuous CTA animation. DESIGN.md is current source of design rules. |
| High | Accepted quote events lacked the required explicit accepted receipt contract. | Added zq_quote_submitted with form_name=quote_form, submission_status=accepted, submission_id; retained generate_lead, no PII, acceptance-only dispatch and receipt deduplication. |
| High | Provider error text entered native failure HTML without escaping. | HTML escaping and malicious-response regression test. |
| High | Raw quote requests were unbounded and non-object JSON could fail unpredictably. | 32KB bound and explicit object validation before delivery. |
| High | Distributed rate counter was non-atomic and failures bypassed limiting. | Atomic Redis increment/expiry with timeout, strict responses, redirect refusal and existing per-instance memory fallback. |
| High | CAPTCHA calls could stall or accept truthy success values. | Bounded timeout, redirect refusal and literal success validation. |
| High | Chat focus could reach controls behind an enquiry overlay. | Focus containment, inert covered controls, Escape restoration, mobile initial focus without keyboard, 44px controls and 16px inputs. |
| Medium | Global submit-button decorations leaked into AI chat. | Scoped quote decorations to quote forms. |
| Medium | Standalone GA script raced GTM destination loading, downloading same GA twice. | Keep queued config; allow GTM runtime destination loader; exact-ID script check before standalone timeout fallback. |
| Medium | Windows build lock discarded active owners after 5 seconds without Linux process metadata. | Preserve live owner using process liveness; retain abandoned-lock recovery; regression tests. |
| Medium | Deleted concept exports left broken images/styles and social previews. | User confirmed deletion; kept five noindex archive routes, removed missing refs, added honest archive notices and shared styles. |
| Medium | Two production dependency advisories. | Updated http-cache-semantics and source-map-js within existing version ranges. Also patched development selector parser. |
| Low | Unused screenshots and superseded Stitch planning. | Removed verified unreferenced files and their generator/optimizer/docs references. |

## SEO and migration

Pre-release public crawl: 80 sitemap URLs, 20 shared script/image/style assets, 
12 sampled host/path redirects, robots and real404 status all passed.
Local validator: 109 output pages; 80 canonical indexable URLs across four leaf
sitemaps. Canonicals, social URLs, schema, sitemap filtering, internal links,
images and explicit redirect destinations pass the existing validator.

Legacy apex/www and primary www sampled paths redirect permanently to a
page-relevant apex destination without chains. No domain/DNS setting changed.
Existing factual service pages, pricing, reviews, business identity and logo
were preserved. Archived concept content remains noindex.

Current public GTM resource version 4 was read without account changes: the
old bridge is paused; Ads trigger checks accepted status and submission UUID,
and its transaction ID uses the submission ID. Public settings do not prove
provider delivery, Google Ads attribution or account-side conversion accuracy.

## Performance baseline

Single-run Lighthouse 13.5 mobile simulated throttling on live production:

| Route | Performance | Accessibility | SEO | LCP | CLS | TBT |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Home |46|97|100|7009ms|0|1226ms|
| Contact |60|100|100|3774ms|0|1526ms|
| Adelaide hub |49|97|100|6060ms|0|1420ms|

A live-browser HTML interception experiment with the exact GA repair showed
one GA destination script and one GA page-view request. Existing responsive
WebP, image dimensions, eager LCP imagery and local fonts were retained.
Lab TBT is not field INP; no field CWV claim is made.

## Verification and release evidence

Final automated, browser and production results are recorded below after the
release gates complete. Initial interrupted parallel browser/build runs are
not counted as passing evidence.

## Limits

- Lead delivery tests use mocks; no genuine customer lead was created.
- Native mobile keyboard behavior needs physical-device confirmation;
  viewport-height simulation checks the available-space layout only.
- Photo/gradient contrast needs visual review in addition to automated axe.
- Redis outage fallback limits each running instance, not the whole fleet.
- External consent/account configuration and field INP remain outside local
  test proof. No security or consent control was disabled to raise scores.


Dependency review after repairs: production dependency audit reports **0**
vulnerabilities. Four high advisories remain in the development-only
PurgeCSS/fast-glob/micromatch/braces chain; npm proposes a major downgrade.
These process trusted repository build patterns, not customer requests.
No forced downgrade or security suppression was applied. The selector-parser
advisory was patched within its compatible release range.

The existing pull-request Lighthouse workflow now also runs TypeScript,
regression tests, a clean rebuild, SEO/asset validation and Playwright smoke
checks. No deployment credentials or secret changes were added.

## Final verification (19 October 2026, Node 22.23.1)

Run sequentially against one build; no competing builds or stale locks found.

| Check | Result |
| --- | --- |
| `npm run build` | passed |
| `npx tsc --noEmit` | passed |
| `npm run seo:validate` | passed: 109 pages, 80 indexable URLs in four leaf sitemaps, 0 bad pages |
| `npm test` (quote-API smoke + node suites) | 354 tests, 354 pass, 0 fail |
| `npx playwright test --workers=2` | 132 passed, 28 skipped by design (single-project viewport cases), 0 failed |
| `npm run test:readability` (axe-core, 96 pages, 390px and 1440px) | 0 rule failures, 0 overflowing pages, 0 solid-button contrast failures |

Final contrast repair: the white `.estimator-card` panels on the Southern
Adelaide hub and three guide pages inherited near-white heading and body text
from the dark-section rules (contrast 1.01-1.33:1). Card text now has its own
scoped colour (`#102b43` headings, `#20374b` body on `#ffffff`) and a regression
test in `tests/contrast-audit.test.mjs`. The audit's "manual review" list is
axe "incomplete" items (text over gradients/images), not violations.

## Remaining external items

- Live AI lead delivery stays off until `ZQ_AI_LEAD_ENABLED=true` and a 32+ char
  `ZQ_AI_LEAD_SECRET` are set on both the website and the receptionist
  runtime (see `docs/AI_RECEPTIONIST_INTEGRATION.md`). This is an account
  decision and was not changed.
- Four development-only advisories (PurgeCSS chain) remain; production
  dependencies report 0.

## Chat enquiry journey and CSP (19 October 2026)

- CSP `connect-src` now allows `pagead2.googlesyndication.com` (Ads consent ping), with a regression test.
- In-chat enquiry journey added (see `docs/AI_RECEPTIONIST_INTEGRATION.md`): conversational collection, chat-derived pre-fill, review/edit, explicit consent, acceptance-only success and conversion. No Cloud Run change was required.
- `npm test` now also runs `tests/*.test.cjs`; previously the chat API tests were never part of the suite.
- Verification: 377 node tests pass; Playwright 145 passed (80 skipped by design); tsc, SEO validation (109 pages) and the axe audit (96 pages, 0 failures) pass. The journey is exercised at 320, 375, 390 and 430px and on desktop with all backends mocked.
