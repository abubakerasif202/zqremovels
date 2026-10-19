# Lead tracking & Google Ads conversion recovery — 2026-10-19

Scope: enquiries 9–19 Oct 2026 (Australia/Adelaide), why Ads action **ZQ - Quote Form Submitted**
(AW-18413688842 / `aMLuCIvzzZUdEIqwqsxE`) has never recorded a conversion, and a safe repair.
Read-only against production. No real enquiry, notification or Ads conversion was created: every browser
test mocked Web3Forms and aborted all Google Ads/Analytics requests before they left the test browser.

## 1. Lead totals (9–19 Oct)

| Metric | Count | Evidence / limitation |
|---|---|---|
| Website quote submissions attempted | **Unavailable** | Forms POST from the browser straight to `api.web3forms.com` (`site.js` `QUOTE_API_ENDPOINT`); nothing passes through Vercel. `/api/quote` is not used by any live form. |
| Website quote submissions accepted | **Unavailable** | Only Web3Forms (dashboard) and the recipient mailbox hold this. Gmail connector failed auth; Web3Forms has no API. |
| AI chat submissions attempted | 1 in retained window (internal test, 403) | Chat enquiries only went live 17 Oct ~08:56 ACDT (`fe5f521`). Vercel keeps 1 day of logs (Pro; Observability Plus disabled): retained window 18 Oct 23:55 → 19 Oct ~15:50 ACDT. |
| AI chat submissions accepted | **0 measured in retained window**; 17–18 Oct pending | Server receipts exist only in Upstash (`zq:ai-lead:v1:*`, no TTL; `zq:website-ai:v1:lead:*`, 7-day TTL). Upstash OAuth not yet completed. |
| Unique accepted enquiries | **Unknown** | Needs Web3Forms/mailbox + Upstash. |
| Successfully delivered notifications | **Unknown** | Delivery is Web3Forms only. Resend account (domain created 16 Oct) shows **0 sends this month — measured**, but Resend is not wired into any lead path, so this says nothing about leads. |
| Failed / pending notifications | **Unknown** | Browser-side failures never reach Vercel. No chat delivery failure in retained logs. |
| Duplicate / replayed submissions | **Unknown** (code path: 1 POST per submit verified) | Mocked run: one click → exactly one Web3Forms POST. |
| Attributable to Google Ads | **Unknown** | Ads "0" is not evidence of zero leads — the tag provably cannot fire (§3). Only gclid/utm hidden fields inside each Web3Forms email can attribute leads. |
| Unknown attribution | All | — |

Retained Vercel API traffic (7 requests) all lines up with the previous session's deploy/smoke-test times
(e.g. `POST /api/quote` 400 "Invalid payload shape" one minute after deploy `dpl_FEj1…`), so it is labelled internal.

## 2. Attribution reconciliation

Server-accepted leads cannot be counted from available evidence (above). Analytics evidence: GA4
(`G-MNHNPP0087`, standalone gtag) is live with consent denied; Vercel Web Analytics is not enabled. Ads
reports 0 conversions, which is fully explained by the tracking defects below regardless of lead volume.

## 3. Root cause — three proven blockers in the current setup

Proven in a real browser against production. Reproduce with `node scripts/verify-ads-conversion.mjs`
(live: accepted → 0 conversion requests + `script-src eval` violation). Container snapshot:
`docs/gtm-public-container-v4-audit.json` (v3 for comparison: `docs/gtm-public-container-audit.json`).

1. **Live GTM v4 trigger cannot evaluate (CSP blocks `eval`).** Tag 9's trigger requires a Custom JavaScript
   variable. GTM runs it via `google_tag_manager.e = function(s){return eval(s);}`. The site CSP
   (`script-src`, correctly) has no `'unsafe-eval'`, so every real visit logs `securitypolicyviolation
   script-src eval` and the trigger is never true. Accepted submit on production → **0 conversion requests**.
   (Earlier "it works" results from DevTools-evaluated pushes were a CSP-exemption artefact and were discarded.)
2. **The variable also calls `window.__zqClaimAcceptedQuoteForAds`, which the site no longer defines.**
   It shipped only in CLI deploy `dpl_5ecv…` (16 Oct 03:51 → 17 Oct 03:28 ACDT) from unmerged commit
   `645d78c` (branch `fix/accepted-quote-contract-20261015`); every later deploy dropped it.
3. **Redirect race.** The Ads tag sends its request 450 ms (desktop) to 975 ms (6× CPU throttle) after the
   push, but GTM's `eventCallback` fires after 5–75 ms, so `location.assign('/thank-you/')` cancels it.
   With blockers 1–2 removed locally, the form flow still sent 0 conversions until the redirect was held.

Timeline of what could have fired (GTM publish dates unknown — v3 seen 15 Oct 19:43, v4 seen 18 Oct 22:42 ACDT):

| Window (ACDT) | Site emitted | Outcome |
|---|---|---|
| 9 Oct → 16 Oct 02:53 (`40b16c0`) | `generate_lead` form_name=quote_form, immediate redirect | With v3 the bridge→conversion path existed, but the redirect race (blocker 3) very likely cancelled it — *inference from today's runtime, not a test of v3* |
| 16 Oct 03:51 → 17 Oct 03:28 | claim helper + `zq_quote_submitted` | v3: race; v4: blocked by CSP eval |
| 17 Oct 03:37 → 18 Oct 23:54 (`01d43a7`) | only `generate_lead` with page-derived form_name | **No path to a conversion** under v3 or v4 |
| 18 Oct 23:54 → now | `zq_quote_submitted` | v4: blocked by eval + missing claim + race |

Conclusion: **a combination of event/tag failures**, plus consent limitations (all visitors denied, no CMP)
and insufficient lead evidence. "No leads" cannot be confirmed or ruled out from available data.

Other findings
- `/removalists-adelaide-quote/` (source page with the `google_ads_quote` form) 308-redirects to
  `/removalists-adelaide-prices/`, which has **no quote form** (redirect dates from Aug). Check no ad final URL uses it.
- With consent granted, `connect-src` blocked `www.googleadservices.com` and `ad.doubleclick.net` conversion fetches (fixed locally).
- With consent granted, conversion requests carried **automatic enhanced-conversion user data** (`ec_mode=a`, hashed `em`).
  Under denied consent no user data was sent. This is a Google-side setting and a privacy/disclosure decision.
- gclid lives only in per-tab sessionStorage; gbraid/wbraid not captured; Conversion Linker URL passthrough off.
- Privacy policy has no cookies/GTM/GA4/Google Ads disclosure and still mentions Netlify.

## 4. Recommended repair

A. **GTM (needs your approval to publish).** Edit the trigger on tag 9 (Google Ads conversion):
   Custom Event `zq_quote_submitted`; conditions — DLV `form_name` equals `quote_form`; DLV `submission_status`
   equals `accepted`; DLV `submission_id` matches RegEx `^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`
   (ignore case); Page Hostname equals `zqremovalsadelaide.com.au`. **Remove the Custom JavaScript variable condition.**
   Keep Transaction ID = DLV `submission_id` (Google dedup). Delete paused tag 8 (legacy bridge).
   Verify in Tag Assistant Preview with DevTools request blocking on `googleadservices.com`, `google.com/pagead`,
   `pagead2.googlesyndication.com`, `doubleclick.net` so no fictional conversion is recorded.
   Rejected alternative: adding `'unsafe-eval'` to CSP (weakens XSS protection; a repo test forbids it).
B. **Site code (prepared locally, not committed or deployed):**
   - `site.js`: after Web3Forms acceptance, hand the receipt `{formName, leadId, at}` to `/thank-you/` via
     sessionStorage and redirect; `/thank-you/` consumes it once (deleted before tracking, 10-min max age,
     form-name pattern check, UUIDv4 + id dedupe in `trackFormSuccess`). Falls back to the previous
     in-page path if sessionStorage is unavailable. Chat path unchanged (no navigation).
   - `analytics.mjs`: after GTM processes the accepted event, clear the submission keys from the GTM data model, so a
     bare repeat `zq_quote_submitted` push (e.g. the legacy bridge) cannot inherit them and convert twice (proven in the harness).
   - `vercel.json`: add `https://www.googleadservices.com https://ad.doubleclick.net` to `connect-src` (3 blocks). No `unsafe-eval`.
   - Independent security review: no finding above LOW; forged markers add no capability beyond `dataLayer.push`.
   Release steps, exact GTM edits and rollback: `docs/release-ads-conversion-fix-2026-10-19.md`.
   - Tests: hand-off on thank-you page for 5 forms, marker never written on 8 failure modes, stale/malformed marker
     ignored, CSP regression. Simulation (production pages + local build + GTM trigger patched in the test browser
     only, no redirect hold): accepted → exactly one conversion on `/thank-you/`; open/invalid/rejected → 0;
     back+reload → no duplicate; no CSP violations.
   Attribution check: landing on `/contact-us/?gclid=TESTSYNTHGCLID` then converting on `/thank-you/` still
   carries the click id in the conversion request (`ref` referrer + `gclaw`), so the hand-off does not strip it.
   Deploy B only together with (or after) A; B alone is harmless but cannot restore conversions.
   Re-check after both: `node scripts/verify-ads-conversion.mjs` (no flags) must show one conversion pair on
   "accepted" and none elsewhere. Pre-deploy: `--local --simulate-gtm-fix` (passes today).
   **Expectation:** while consent stays all-denied, Ads only receives cookieless pings, so observed conversions
   will stay low/modelled even after A+B. That is the consent decision (C), not a failed fix.
C. **Consent (needs approval; legal review recommended).** Australia has no GDPR-style opt-in cookie rule, but the
   APPs require transparent notice and the Privacy Act reforms are moving toward tighter tracking rules. Proposal:
   a lightweight banner (Accept / Reject / Settings) that sends `gtag('consent','update', …)` for `ad_storage`,
   `ad_user_data`, `analytics_storage` (keep `ad_personalization` denied unless remarketing is wanted), stores the
   choice first-party for 12 months, footer "Cookie settings" link to withdraw, and a rewritten privacy policy
   covering GTM/GA4/Google Ads, Web3Forms, the AI chat (Cloud Run) and Upstash. Decide separately on URL passthrough
   and automatic enhanced conversions. Do **not** default to granted. Any CMP must apply a stored choice in the
   head bootstrap before GTM processes events; otherwise the thank-you conversion goes out cookieless first.

## 5. Google Ads cleanup (Phase 6)

**Not verified** — no Ads access this session (no API developer token; browser sign-in previously blocked by
CAPTCHA). `scripts/google-ads-report.mjs` (read-only GAQL) is kept for this once a developer token exists.

## 6. Decisions / access needed

1. Approve and publish the GTM trigger change (§4A); confirm v3/v4 publish dates from GTM → Versions.
2. Approve deploying the site change (§4B).
3. Consent banner + privacy policy + enhanced-conversions + URL-passthrough decisions (§4C).
4. Lead evidence: Web3Forms dashboard export or admin mailbox count for 9–19 Oct; complete Upstash OAuth.
5. Ads read access to verify §5 and the final URL of every ad (vs `/removalists-adelaide-quote/`).
6. Rotate the credential in `password.env`, then delete the file. It is untracked and now ignored by `.gitignore` (`*.env`).

## 7. Verification

- `npm test`: 407 pass, 0 fail (1 pre-existing TODO). `npm audit --omit=dev`: 0 vulnerabilities.
- `npx playwright test` (all 4 configured specs): 150 passed, 80 intentional viewport skips, 0 failed (RED first: 6 failing before the `site.js` change).
- `node scripts/verify-ads-conversion.mjs --local --simulate-gtm-fix`: all 15 scenarios as expected (see release runbook table).
- `npx playwright test tests/mobile-seo-visual.spec.ts tests/contact-page-visual.spec.ts`: 52 passed, 28 intentional skips.
- `node scripts/verify-ads-conversion.mjs --local --simulate-gtm-fix`: open/invalid/rejected 0; accepted 1 pair; replay no extra; ad landing 1 pair; 0 CSP violations.
- `npm run build`: passes.
- Repo cleanup: removed stale logs, empty `New Text Document.txt`, `tmp-dependency-audit.json`, `tmp/`, `playwright-report/`,
  `test-results/`, `.ruff_cache/`; `.gitignore` now covers `*.env` and `*.log`. Kept untracked `scripts/google-ads-report.mjs` deliberately.
- Sources: Vercel MCP/CLI (deployments, deployment files, env names, 1-day logs), Resend MCP, live `gtm.js` (v4),
  live HTML/JS/CSP, git history. Unavailable: Gmail (auth), Web3Forms (no API), Upstash (OAuth pending), Google Ads, GTM UI.
