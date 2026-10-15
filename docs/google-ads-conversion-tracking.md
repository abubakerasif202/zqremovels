# ZQ accepted-quote conversion tracking

Release updated 2026-10-16 (Australia/Sydney). Website code and GTM container changes have been deployed. Google Ads campaign goals, budgets, and status were not changed.

## Production release

- Vercel production deployment: `zq-f59yduuq6-abubakerasif202s-projects.vercel.app` (Ready), aliased to `zqremovalsadelaide.com.au` and `www.zqremovalsadelaide.com.au`.
- GTM container `GTM-WJGKPXFL`, account `6373715814`, container `262472537`: version 4 is live.
- GTM version 5, `ZQ SAFE ROLLBACK - quote conversion paused`, is saved and ready to publish if quote conversion measurement must be disabled. It pauses the Ads quote tag and the legacy bridge while retaining the Conversion Linker.
- The protected Preview deployment's `/site.js` matched the freshly built local file byte-for-byte before release.
- Production GET checks returned HTTP 200 for home, contact, service, and thank-you pages. Each response included the required `connect-src` hosts `https://ad.doubleclick.net` and `https://www.googleadservices.com`. The home page has two quote forms; contact and service pages each have one; thank-you has none.
- Playwright conversion suite: 105 passed at one worker across mobile, tablet, and desktop profiles. The earlier three-worker run had 94 passes and 11 timeouts; the serial rerun passed.
- Build, full Node test suite, TypeScript check, and `git diff --check` passed. No real enquiry was submitted, so live provider delivery and Ads attribution/reporting have not been asserted.

## Website event contract

A quote is accepted only after a successful HTTP response and parsed Web3Forms `success === true`. Only this path calls the locally bundled `quote-tracking.mjs` coordinator. It creates a local UUIDv4 and emits one event:

```js
{
  event: 'zq_quote_submitted',
  form_name: 'quote_form',
  submission_status: 'accepted',
  submission_id: '<locally generated UUIDv4>',
  eventCallback: finishOnce,
  eventTimeout: 1500
}
```

The opaque ID is never copied from provider data and contains no customer fields. The coordinator stores acceptance and claim state in document memory only. Its private accepted-record registry is established before the event is pushed. The window helper `__zqClaimAcceptedQuoteForAds(id, form, status)` validates that private record and atomically allows a matching ID to be claimed once. Unknown, stale, invalid, and replayed IDs fail. The bounded completion callback ensures tracking failure or blocked GTM cannot interrupt the already accepted enquiry or trigger a provider retry.

Page loads, thank-you visits, and reloads do not create quote events. Optional GA4/Meta ownership remains unchanged. Click analytics are not treated as qualified calls.

## Live GTM version 4

Version 4 contains the existing Conversion Linker, the paused legacy `cHTML - Bridge generate_lead to zq_quote_submitted` tag, and the existing Google Ads quote conversion tag. The old broad `generate_lead` conversion route is no longer active.

The `CE - Accepted quote submitted` Custom Event trigger matches exact event name `zq_quote_submitted` and requires all of:

- `form_name` equals `quote_form`
- `submission_status` equals `accepted`
- `submission_id` matches a UUIDv4
- `Page Hostname` equals `zqremovalsadelaide.com.au`
- `JS - ZQ accepted quote claim guard` equals `true`

The custom JavaScript guard independently validates the event name, hostname, form name, accepted status, UUIDv4, and helper availability. It calls `window.__zqClaimAcceptedQuoteForAds` and returns true only when the helper returns exactly true. Exceptions fail closed.

The Ads tag fires only on that trigger, once per event, and sends `{{DLV - submission_id}}` as its transaction/order ID. Its conversion ID and label, value, count, attribution, and existing consent checks were retained. No setup tag or custom template was needed. The GTM candidate compiled and was exercised in an isolated native preview: the first claim returned true, replay returned false, and all collection requests were blocked. This verifies the gate; it does not prove delivery or attribution.

## Consent and CSP

The layout places a default-denied Google Consent Mode baseline for `ad_storage`, `analytics_storage`, `ad_user_data`, and `ad_personalization` before a Google loader can start, while retaining queued updates in order. Quote submission never grants consent. The audited container has no CMP choice integration, so a real consent-choice integration remains a separate requirement for any consent grant. Meta consent remains separately owned.

The only CSP change in `vercel.json` appends `https://ad.doubleclick.net` and `https://www.googleadservices.com` to `connect-src` in all three existing route rules. Other directives and routing were preserved. Production headers were checked on home, contact, service, and thank-you routes after deployment.

## Rollback

If duplicate or false quote conversions appear, publish GTM version 5 to pause quote Ads measurement and the old bridge while leaving the Conversion Linker active. The website will continue to accept and process quotes. This creates an intentional measurement gap. Do not restore unguarded GTM version 3 against the canonical event.

If a website rollback is needed, revert only the tracking/CSP changes in the reviewed source and deploy the corresponding Vercel build. Keep unrelated SEO migration work and PR57 separate. No Ads goal rollback is applicable because goals and campaign settings were not changed.

## Scope left unchanged

No Google Ads custom goal, campaign setting, budget, status, or account-wide secondary-action change was made. In particular, no Smart campaign was reactivated. Live quote submission, Ads conversion diagnostics, consent-grant behavior from an actual CMP, and attributed reporting remain unverified because no production form was submitted.
