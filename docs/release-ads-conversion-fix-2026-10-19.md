# Release runbook — Google Ads quote conversion fix (2026-10-19)

One coordinated release: **site change** (Vercel) + **GTM version 5** (container GTM-WJGKPXFL).
Background and evidence: `docs/lead-tracking-recovery-2026-10-19.md`.
Nothing here changes Ads budgets, bids, keywords, conversion goals, consent defaults, enhanced conversions or privacy text.

## What ships

### Site (branch `release/ads-conversion-recovery-20261019`)
| File | Change |
|---|---|
| `site.js` | On a strictly accepted Web3Forms response, write a one-time sessionStorage receipt `{formName, leadId, at}` and redirect; `/thank-you/` consumes it once (deleted before use, ≤10 min old, not future-dated, form-name pattern, UUIDv4 + per-id dedupe) and fires the accepted event there. Fallback to the previous in-page path if sessionStorage is unavailable. |
| `analytics.mjs` | After GTM processes `zq_quote_submitted`, clear `form_name`, `submission_status`, `submission_id`, `lead_id`, `source_form`, `lead_type` from the GTM data model (eventCallback, no timeout) so a bare repeat push cannot inherit them and convert twice. AI chat flow unchanged. |
| `vercel.json` | `connect-src` + `https://www.googleadservices.com https://ad.doubleclick.net` (all 3 CSP blocks). Both are in Google's documented Ads-conversion CSP list and both were blocked in testing with consent granted. No `'unsafe-eval'`; no other directive changed. Documented-but-unobserved origins (`googleads.g.doubleclick.net`, `www.google.com.au`) deliberately not added. |
| tests, `scripts/verify-ads-conversion.mjs`, docs, `.gitignore` | Regression tests, side-effect-free harness, evidence. |

### GTM — create version 5 from the current live version 4
1. **Triggers → the trigger used by the Google Ads Conversion Tracking tag** (ID 18413688842, label `aMLuCIvzzZUdEIqwqsxE`):
   - Type: Custom Event. Event name: `zq_quote_submitted` (no regex). Fires on: Some Custom Events.
   - Conditions (all must match):
     - DLV `form_name` **equals** `quote_form`
     - DLV `submission_status` **equals** `accepted`
     - DLV `submission_id` **matches RegEx (ignore case)** `^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`
     - Built-in **Page Hostname** **equals** `zqremovalsadelaide.com.au`
   - **Remove** the condition that uses the Custom JavaScript variable (the one calling `__zqClaimAcceptedQuoteForAds`).
     GTM runs Custom JS variables with `eval`; the site CSP blocks it, so it is always undefined (Google's CSP guide says the same).
2. **Variables**: delete that Custom JavaScript variable once nothing references it. The three Data Layer Variables
   (`form_name`, `submission_status`, `submission_id`, Version 2) stay as they are.
3. **Tags**: delete the paused Custom HTML bridge tag (tag 8, `generate_lead` → `zq_quote_submitted`).
   Leave the Conversion Linker tag and the Ads conversion tag settings unchanged — in particular keep
   **Transaction ID = DLV `submission_id`**, enhanced conversions **off**, no consent-setting changes.
4. **Preview before publish** (Tag Assistant), with Chrome DevTools → Network request blocking enabled for
   `*googleadservices.com*`, `*google.com/pagead*`, `*google.com/ccm*`, `*googlesyndication.com*`, `*doubleclick.net*`
   so no fictional conversion reaches Google. In the console of the previewed page run:
   `dataLayer.push({event:'zq_quote_submitted', form_name:'quote_form', submission_status:'accepted', submission_id: crypto.randomUUID()})`
   → the Ads conversion tag shows **Fired**. Then `dataLayer.push({event:'zq_quote_submitted', form_name:'quote_form'})`
   on a fresh page → **Not fired**.
5. Version name: `v5 — built-in accepted-quote trigger (no custom JS)`.

## Order of operations (each step needs explicit approval)

1. **Deploy site**: merge the release branch into `main` and push (Vercel production deploys from `main`).
   - Verify: Vercel shows the new commit SHA as the READY production deployment; live `/site.js`, its analytics
     chunk and `/analytics.mjs` contain `zq_pending_accepted_quote` / the data-model reset; live CSP header shows the two origins.
   - `node scripts/verify-ads-conversion.mjs --simulate-gtm-fix` (live site, GTM patched in the test browser only)
     → accepted = 1 conversion pair, everything else as in the table below.
   - `node scripts/verify-ads-conversion.mjs` → still 0 everywhere (GTM v4 still live) — expected, harmless.
2. **Publish GTM v5** (steps above).
3. **Verify production**: `node scripts/verify-ads-conversion.mjs` (no flags). Expected:

| Scenario | Conversion requests |
|---|---|
| form opened / validation failed / Web3Forms rejected | 0 |
| accepted | 2 (one conversion = request pair), transaction id UUIDv4 |
| accepted, back + reload | 2 (no extra) |
| AI chat accepted | 2 |
| accepted + bare repeat push | 2 (no second conversion) |
| thank-you with no / expired / future / malformed / non-UUID / bad-name marker | 0 |
| hand-forged valid marker | 2 (inherent client-side limit) |
| CSP violations | none |

All Google requests in the harness are aborted locally; nothing is recorded in Ads.

## Rollback

- **GTM**: Versions → version 4 → Publish. Restores today's state (no conversions fire; nothing duplicates).
- **Site**: `vercel promote dpl_A8GuDGcbQ4xXrVzPPducLa97L9EU --scope abubakerasif202s-projects` (or Instant Rollback in the
  Vercel dashboard), then `git revert` the release merge on `main` so the next push does not redeploy it.
- Mixed states are safe: new site + GTM v4 → 0 conversions (as today); old site + GTM v5 → conversions mostly lost to the
  redirect race, never duplicated (tag 8 deleted).

## Known limitations (documented, not fixable client-side)

- Web3Forms returns no server receipt; the UUID is a local dedupe token, not proof of a real lead.
- Anyone can push dataLayer events or write sessionStorage, so a deliberate forger can create a conversion (one per UUID per tab
  session). This was already true before the change. Google transaction-ID dedupe and reconciliation against Web3Forms emails are the backstop.
- Conversions can be lost (ad blockers, storage disabled, tab closed before `/thank-you/` loads, two accepted submits before the
  redirect), never duplicated.
- While consent is all-denied, Ads receives cookieless pings only; observed conversions stay low until the consent design ships.
