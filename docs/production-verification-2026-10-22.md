# Production verification and rollback — 22 October 2026

Local implementation is not permission to release. No production deployment, push, merge, Ads/GA4/GTM edit or campaign activation was performed.

## Release prerequisites

Use Node 22 and the committed lockfile. On this Windows-linked dependency tree run `npm.cmd` from PowerShell; Linux build fails because the existing node_modules lacks the Linux Lightning CSS optional binary. Do not replace the lockfile to repair a platform mismatch. Clean CI can use `npm ci` with its native optional packages.

Check environment **names and presence only**, never print values:

- `WEB3FORMS_ACCESS_KEY` (or existing `VITE_WEB3FORMS_ACCESS_KEY` compatibility): valid provider delivery credential, required server-side. Verify privately; missing provider configuration fails closed.
- `KV_REST_API_URL`, `KV_REST_API_TOKEN`: HTTPS Redis REST store supporting EVAL, atomic SET NX / XX EX and GET. **Mandatory for the new JavaScript quote receipt flow**. There is deliberately no in-memory delivery fallback. Configure in the approved deployment environment before routing production leads through it. ACL must allow these commands; monitor latency/outages. Seven-day receipt TTL, prefix `zq:quote:receipt:v1:`; values contain only an opaque UUID, SHA-256 business-fields fingerprint and state, not customer fields.
- `TURNSTILE_SECRET_KEY` / `CF_TURNSTILE_SECRET`, or `RECAPTCHA_SECRET_KEY`: if configured, the corresponding form challenge must exist and supply its token. Verify public form integration before release. Never remove a configured challenge to pass a test. No secrets are exposed to the browser.
- `TELEMETRY_LOG_ENDPOINT`: optional existing server telemetry; verify approved destination/access/privacy privately. It is not a conversion authority.
- Existing `VITE_GA_MEASUREMENT_ID` / `GA_MEASUREMENT_ID`, optional Meta settings and chat configuration remain unchanged. Confirm GA4 destination and tag ownership in GTM. There is no tracked `.env.example`; this list documents requirements without credentials.

The form's JavaScript now posts to `/api/quote/`; verify this is routed to the serverless function, including host/trailing-slash behavior. The plain HTML Web3Forms action remains the existing no-JS fallback; it sends enquiries but cannot emit a verified JavaScript conversion. Do not claim no-JS conversion coverage.

Receipt flow: the browser proposes a cryptographic UUID for the current logical form request. The server claims that UUID atomically before provider delivery, includes it in the provider payload, and persists accepted state only after HTTP success AND JSON `success === true`. The browser accepts ONLY a matching UUIDv4 + `submission_status=accepted` + strict success. The server's accepted response confirms the association; the UUID alone is never proof. A pending/ambiguous receipt blocks automatic resend. Replay is safe within the seven-day storage window. The pending browser ID is retained in session storage for seven days across reloads (no form values), then expires before the seven-day server window. When storage is blocked, protection is limited to the current document; customers must follow the call-to-confirm guidance for uncertain delivery. Do not promise global lifetime idempotency or exactly-once email delivery. Operators must reconcile pending receipts with provider records before any manual resend.

## Local release checks

From `C:\Users\abuba\zqremovels` in PowerShell:

```powershell
npm.cmd test
npm.cmd run build
npm.cmd run seo:validate
npx.cmd playwright test tests/conversion-tracking.spec.ts --project='Mobile Chrome (390px)' --workers=1
node scripts/ads-recovery-qa.mjs after
git diff --check
```

QA script uses http://127.0.0.1:3000, blocks third-party and API requests, and expects `node scripts/serve-site.mjs` to be running in a separate terminal. Conversion E2E mocks only the local quote endpoint, never a real provider. The local static server does not implement Vercel headers/redirects/functions. WebKit needs its supported OS libraries. The repository has no lint/typecheck script; do not describe absent commands as passed. See audit report for actual executed results.

Before publishing, inspect the exact diff and staged files. Use a clean checkout of a selectively reviewed commit for any deployment so unrelated work cannot be included. Obtain explicit deployment approval; do not push a branch just to obtain a preview automatically.

## Approved staging checks

Configure the receipt store and a controlled provider test destination in staging, with spam protection intact. Never use a production provider key for synthetic E2E. Verify actual function request/response, receipt replay (same ID, one delivery), malformed/missing ID, validation, honeypot, CAPTCHA, rate limit, storage outage, upstream timeout and failed acceptance write. Confirm no PII in dataLayer. Test double click while pending; success confirmation and form lock; failure focus/error feedback; reload/navigation after success. Existing analytics outages must not cause accepted enquiries to be resubmitted.

## Tag Assistant and one genuine production lead

After separately approved website deployment and GTM publication:

1. Recheck homepage/contact and four canonical services on apex HTTPS. Confirm canonical/og/schema/sitemap host, intended indexability, permanent aliases, and security headers against the previous approved deployment. A platform apex→www redirect is a domain-layer blocker; do not rewrite source canonicals to conceal it.
2. GTM Preview → connect production; verify GTM-WJGKPXFL loads once. Inspect Consent tab: denied defaults, real CMP choices and return visits. Source has no CMP UI; deployment cannot be considered consent-verified without confirming the actual preference system. Attribution session storage requires BOTH ad_storage and analytics_storage granted. A CMP using internal consent APIs must expose its real state through supported integration; this code conservatively declines storage when it cannot see a consent command. Never manufacture grants. After a user grants consent, navigate with original campaign parameters or re-run attribution capture from the approved CMP integration before leaving the landing page.
3. Coordinate ONE legitimate owner-approved business enquiry, not fake customer data. Verify provider delivery and stored accepted receipt. On thank-you page inspect exactly one zq_quote_submitted, form_name quote_form, submission_status accepted, UUIDv4 matching server response. Check no customer data in analytics parameters. `generate_lead` is analytics only.
4. Verify existing Ads conversion tag fires once, correct ID/action/private label, transaction ID equals submission_id, and effective consent. Reject invalid/missing UUID events. Refresh, back, forward and direct thank-you visits must not fire again. Check blocked requests/CSP and consent warnings. Do not weaken CSP speculatively; record any exact blocked destination for review.
5. Ads → Goals → Conversions → Summary → existing quote action → Diagnostics. Allow reporting latency and inspect recording status. Reconcile actual accepted lead, tag evidence and eventual Ads entry before claiming end-to-end paid attribution. A local mock proves neither email delivery nor attribution; do not create an artificial ad click.

## Mobile and performance checks

Inspect 320, 360, 375, 390, 430, 768, 1024 and 1440 px. Test menu keyboard/touch, CTA, tel:+61433819989, form labels, 16px inputs, focus/error announcement, pending state, submit lock and genuine success. Check sticky controls, chat and consent UI do not cover fields. Test physical Safari/Chrome with the software keyboard and rotation; a reduced Playwright viewport does not prove keyboard behavior. Respect reduced motion.

Compare screenshots and report measured laboratory numbers only. Field p75 targets LCP ≤2.5s, INP ≤200ms, CLS ≤0.1 require CrUX/RUM; no local test guarantees these targets. Monitor provider errors, pending receipts, function latency, mobile abandonment and accepted-to-Ads discrepancy daily during recovery. Diagnostics (view/start/validation/submission error) are engagement, never primary goals.

## Rollback

Before release record the previous approved Vercel deployment and reviewed commit; export GTM privately before approved tag edits. If delivery regresses, keep campaigns paused and use the Vercel dashboard to promote the previous approved deployment only with release authority. Coordinate any GTM rollback to the matching previously approved container version; do not create a second tag. Preserve receipt keys for seven days to investigate ambiguous/accepted leads; do not delete them to force a retry. Review datastore configuration first for 503s; do not disable protections or reroute around storage during an incident. Verify previous delivery/SEO/header behavior after rollback and document any measurement gap. The current local branch can be revised without altering the production site.

## Release-readiness continuation: verified prerequisite matrix

Read-only authenticated Vercel metadata confirms project `zq`, repository `abubakerasif202/zqremovels`, production branch `main`, Node 22.x, build `npm run build`, output `site-dist`. The local checkout remains unlinked; no `vercel link`, environment pull, decryption or remote change was performed. Definitions were inspected by name/type/target only. Presence does not establish credential validity, datastore ACLs or provider delivery.

| Variable/integration | Production definition | Preview definition | Local process | Required action |
|---|---|---|---|---|
| KV_REST_API_URL | Present (plain endpoint) | Absent | Absent | Configure isolated Preview Redis endpoint before staging |
| KV_REST_API_TOKEN | Present (sensitive) | Absent | Absent | Configure isolated Preview sensitive REST token, never read-only token |
| WEB3FORMS_ACCESS_KEY | Present (sensitive) | Present | Absent | Verify Preview points to an approved test delivery destination; never assume isolation from its presence |
| TURNSTILE_SECRET_KEY / CF_TURNSTILE_SECRET / RECAPTCHA_SECRET_KEY | None of these definitions present | None present | Absent | No source widget exists. If enabling a challenge later, ship matching public widget/site key and CSP allowances together; never add a server secret alone or disable verification to pass tests |
| VITE_GA_MEASUREMENT_ID | Present (sensitive metadata only) | Present | Not evaluated as a credential | Verify actual destination/ownership privately; measurement requests blocked in automated tests |
| CMP consent collection/restoration | No source CMP UI found; public GTM has no recognised CMP references | Unverified | Denied defaults | Identify and validate approved real choice/restoration integration before release sign-off |

GET-only checks of `/api/quote` and `/api/quote/` both reached the method-protected function (405); the non-slash URL redirects to the slash URL. The client now posts directly to `/api/quote/`. No real POST/provider request was sent to production. Vercel source configuration gives `api/quote.js` a **45-second maxDuration**; the client waits **50 seconds**. The bounded worst-case dependency path is approximately 35 seconds (rate store, receipt lookup, configured CAPTCHA, receipt claim, provider request and receipt acceptance). Confirm the deployment plan/runtime applies this function setting; this local change has not been deployed.

### Secure manual setup (unapplied)

1. Vercel dashboard → correct project **zq** → Settings → Environment Variables. Confirm project/repository before any edit. For **Preview**, add the two KV variables using an isolated Redis database/namespace and a write-capable sensitive REST token from its provider's secure console. Do not copy a production token into logs, source, shell history or chat. Leave existing Production values unchanged unless separately authorised.
2. Ensure Redis supports atomic `SET key value EX 604800 NX`, `GET`, `SET ... EX 604800 XX`, and the existing rate-limit `EVAL` script (with INCR/EXPIRE). Its provider account/ACL must allow those commands for `zq:quote:receipt:v1:*` and the existing rate-limit prefix. Tests emulate these exact operations, concurrent claims, expiration and failed writes; no production Redis writes were performed. General Redis command compatibility is not proof that the deployed token's ACL permits them.
3. Verify the **Preview** WEB3FORMS_ACCESS_KEY belongs to a controlled test inbox/provider destination. If it is the same production integration or ownership is unknown, keep browser POST interception in place and do not send fixtures. Assign an approved provider test destination in Preview only after authorisation. Server code no longer falls back to a hardcoded provider key.
4. Environment changes take effect on new deployments; do not trigger one without approval. Use an approved existing staging environment, or request the separately approved preview deployment after its configuration is reviewed. No push/deploy is required to review this branch locally.
5. For CAPTCHA, if the business chooses to enable it: obtain matching public site key + private secret from the provider; add a visible/supported accessible challenge, token refresh/expiry handling and exact script/frame/connect CSP destinations; configure the secret only in the same environment where the widget is verified. Current code forwards `cf-turnstile-response` and `g-recaptcha-response`. Missing/failed tokens block NEW deliveries. Existing accepted/pending/rejected receipt lookups do not redeliver and can be replayed without reusing a consumed challenge.
6. Connect the approved CMP's REAL consent callback after its supported consent command/state update to `window.dispatchEvent(new Event('zq:consent-updated'))`. This hook captures allowed landing parameters or clears revoked attribution/hidden fields; it grants nothing itself. Persist/restore the actual user choice through the approved CMP before tags on every document. Test reject, grant, partial choice, revocation and return navigation. A CMP using internal GTM APIs must expose a corresponding consent state to this integration; absence of a queued consent command remains conservatively denied.

### Receipt recovery and controlled staging procedure

- Normalised business fields identify a retry. IP, source URL and attribution are excluded so consent/URL changes do not block retrieval of an accepted receipt. Changed business details with an unresolved ID remain a conflict: call to confirm; reloading does not create a way around pending state.
- A strict `success:false` on HTTP 200 or 4xx provider responses confirms rejection. Its durable status is **rejected**, not accepted. The browser may then discard that failed logical ID and use a fresh ID on the next corrected user submission. An ambiguous response, 5xx, timeout or failed receipt write remains **pending**. Never treat pending age as proof of failure or automatically resend it.
- Pending client IDs now persist for the same seven-day window as server receipts (no customer fields). After that bounded window, or if browser storage is blocked/cleared, deduplication cannot be guaranteed across new documents. Explicit call-to-confirm guidance remains necessary. Successful confirmation clears the pending request marker; the original thank-you handoff/deduplication remains.
- Server records now include created/updated timestamps for operator investigation. Pending receipts can require manual reconciliation: authorised staff compare provider records/inbox with the UUID before deciding on any new request. Do not delete keys, mark them accepted or bypass spam checks merely to recover analytics. A failed store write after provider acceptance can legitimately lose measurement until the accepted state is reconciled; do not fabricate a conversion.
- With an authorised isolated staging destination and Redis: submit a controlled fixture, assert one provider delivery + accepted response UUID + one accepted event, replay same ID, change only URL/attribution, and verify no new delivery. Confirm changed business details conflict. Exercise definite rejection then corrected request; pending timeout then same-ID retry; missing/expired CAPTCHA; concurrent submit; store unavailable; acceptance-write failure; seven-day expiry in a fixture rather than manipulating live production state.
- For routine automated browser tests, intercept `/api/quote/` and block all external measurement/provider requests. Keep third-party scripts blocked unless performing an explicitly controlled Tag Assistant test. Never use the old historical synthetic-production harness as proof of a real lead.

### Rollback clarification

Before any approved release record the exact previous approved deployment, commit and current GTM export/version. The public GTM resource now reports version **6** with the v5-style trigger/transaction mapping. Do not blindly publish historical version 4 or 5. After separately approved rollback authority: Vercel → project → Deployments → previously recorded approved deployment → Promote/Instant Rollback; verify provider delivery, API routing, canonicals, redirects and security headers. Restore GTM only to the recorded matching approved version if a tag change actually occurred. Keep campaigns paused and receipt records intact for investigation. Reverting a future release commit requires a reviewed follow-up; no reset, force-push, key deletion or automatic reactivation is part of rollback.

### Consent scope and device verification

A CMP banner is not assumed mandatory by this implementation. The owner must confirm the intended mode: approved permanent denial, or real collection/restoration of choices. For permanent denial, verify optional attribution remains absent and Google tags obey denied state. For real choices, verify the approved CMP callback/restoration and `zq:consent-updated` hook; never manufacture grants to recover reporting. Technical receipt/session markers contain only opaque IDs/timestamps and exist to prevent duplicate enquiries/conversions; they do not store form values.

Chromium checks cover the form, submit locking/recovery, sticky controls, mobile menu, reduced motion and chat composer in a reduced-height viewport. WebKit was attempted but cannot launch without host libraries; none were installed. Required external device check: physical iOS Safari and Android Chrome, 320–430px class devices, text zoom/rotation, focus each quote field, open software keyboard, verify focused input/error/submit and chat composer remain reachable, inspect sticky CTA and safe-area spacing, then restore viewport and close menu/chat with keyboard focus retained. A simulated viewport is not proof of native keyboard behavior.

Current release classification: **BLOCKED** until isolated Preview Redis/provider destination and intended consent behavior are verified, followed by controlled staging acceptance/replay tests. Human review can proceed on this uncommitted local branch. Production delivery and Ads recording remain unverified; no deployment or advertising changes were performed.

References: [Vercel environment management](https://vercel.com/docs/environment-variables/managing-environment-variables), [Vercel Node functions](https://vercel.com/docs/functions/runtimes/node-js), [Redis atomic SET options](https://redis.io/docs/latest/commands/set/).

### Current local release evidence

- Full `npm.cmd test`: 441 passed, zero ordinary failures, one existing TODO; final focused receipt/privacy/CSS cases: 56 passed.
- Windows Node 22 production build passed. `npm.cmd run seo:validate`: 108 pages, zero bad pages, existing 79 sitemap URLs/exclusions preserved.
- Playwright conversion/mobile/Stitch suites: 192 passed, 28 intentional skips. All 48 six-route/eight-width screenshot pairs are byte-identical before/after the scoped purge change.
- Comparable three-run local Lighthouse medians: **79 → 81**, simulated LCP **4662.87 → 4518.18ms**, TBT **0 → 0ms**, CLS **0 → 0**. Homepage CSS **166,660 → 155,205 bytes**; contact CSS **170,576 → 139,832 bytes**. The target LCP is not met by this uncompressed local lab test; production serves Brotli CSS. Field INP/p75 are unverified.
- Evidence: `artifacts/ads-recovery-2026-10-22/readiness/verification.json`, `baseline-summary.json`, `after-summary.json`, `visual-comparison.json`, redacted Vercel/GTM metadata and WebKit attempt log. No deployment or live Ads measurement was performed.

Reproduce lab runs only against the completed, stable local build with no concurrent builds/browser audits:
```powershell
# Terminal 1
node scripts/serve-site.mjs
# Terminal 2 (Chromium must already be available)
node scripts/ads-readiness-performance.mjs baseline
# After a separately completed local change/build:
node scripts/ads-readiness-performance.mjs after
node scripts/ads-readiness-visual.mjs after
```

The recorded baseline was captured before the CSS change. Re-running `baseline` on the finished branch measures the finished branch, not the historical pre-change state; preserve the existing evidence files when reproducing comparisons.
