# ZQ Removals quote conversion validation

Audit date: 23 October 2026. This records source and mock-based evidence; no live customer enquiry was submitted.

## Contract

The JavaScript quote flow posts to `/api/quote/`. A conversion is eligible only after the provider returns HTTP success and literal `success === true`, and the server persists an accepted receipt with the same UUIDv4 submitted by the browser. The browser then emits exactly one `zq_quote_submitted` event with:

| Parameter | Required value |
| --- | --- |
| `form_name` | `quote_form` |
| `submission_status` | `accepted` |
| `submission_id` | Server-confirmed UUIDv4 |

Button clicks and `generate_lead` remain engagement/analytics signals; neither is the primary accepted-quote event. The GTM data model is cleared after callback processing to avoid inherited acceptance fields creating a later duplicate. Analytics events contain no customer form fields.

The optional server telemetry hook now sends only timestamp, business name and the static `quote_accepted` event. It excludes names, email, phone, attribution, page URL and submission payload.

## Local test evidence

The repository test suite exercises receipt claims, accepted replay, conflicting payloads, concurrent retries, provider rejection, ambiguous timeout, receipt-store outage, acceptance-write failure, strict client response matching, UUID validation, PII-free event payloads, duplicate suppression and stale consent-gated attribution. `npm run test:quote-api` runs the isolated API smoke check. The browser conversion suite intercepts the local endpoint and external requests; it does not submit a real lead.

The continuation Playwright run completed 177 tests with 28 project-filtered skips across 375px and 390px mobile, 768px tablet, and 1366px and 1920px desktop Chromium. It included contact contrast/focus checks, accepted and rejected quote flows, duplicate/retry behavior, consent hook transitions, mobile layout, no-JavaScript content, reduced motion and the chat composer. A separate WebKit 26.4 run passed five selected checks at a 390px viewport: contact readability/contrast and accepted quote-event behavior for four form variants. Requests to analytics and quote providers were intercepted. These are browser simulations, not physical devices; native iOS Safari/Android Chrome software-keyboard behavior remains untested. Earlier QA evidence in `docs/production-verification-2026-10-22.md` also records six routes at eight widths with 48 unchanged screenshot pairs and zero overflow.

## Backend prerequisites and status

Durable receipt idempotency requires `KV_REST_API_URL` and a write-capable `KV_REST_API_TOKEN` supporting atomic `SET NX`, `SET XX`, `GET` and the existing rate-limit `EVAL` operation. The authenticated environment-name audit recorded both variables in Production and neither in Preview; values were not read or printed. The Preview Web3Forms key exists, but its test destination has not been verified. No local fallback is allowed for durable receipts, so missing storage fails closed before provider delivery.

The deployment also needs an approved consent manager's real preference and restoration callback if attribution storage is expected. The source remains conservatively denied when it cannot observe both ad and analytics storage as granted. Do not simulate a grant to recover attribution.

## Outstanding controlled checks

1. Configure isolated Preview Redis credentials and confirm the provider ACL without exposing credentials.
2. Verify Preview sends only to an approved test destination.
3. Run one authorized staging fixture through accepted response, exact event and same-ID replay; verify one provider delivery and one conversion event.
4. Test real CMP reject, grant, partial choice, revocation and return-navigation behavior.
5. After release, verify one accepted quote in GTM Preview and reconcile its transaction ID with the existing Ads action. No Ads or GTM settings have been changed or published by this work.
6. Perform physical-device Safari/Chrome keyboard and focus checks.

Production quote acceptance and Ads attribution remain unverified. Keep this release blocked until the isolated staging checks pass.

## Release-blocker verification — 23 October 2026

Read-only Vercel project metadata for `zq` confirms `KV_REST_API_URL` and `KV_REST_API_TOKEN` target **Production only**. `WEB3FORMS_ACCESS_KEY` is defined for Preview as well as Production/Development, but its destination and isolation are not verifiable from variable metadata. No Preview deployment exists for `fix/ads-conversion-recovery-2026-10-22`; the checkout is not linked to a live Preview URL. No secret values were decrypted or read.

**Staging enquiry result: NOT RUN / BLOCKED.** No enquiry was submitted. Preview has no receipt Redis endpoint/token, no verified test inbox, and no deployment of this branch. Local API and Playwright tests use mocks and intercept external requests. They verify accepted/rejected/replay, conflicting payload, timeout, storage outage, acceptance-write failure, concurrency, matching UUIDv4 and one event in tests; they do not prove provider delivery or real Redis ACL behavior.

Consent source review confirms Consent Mode defaults to denied before GTM loads. No customer-facing CMP or persisted consent choice/restoration UI exists in repository source. Attribution is captured only after actual `ad_storage` and `analytics_storage` updates are already visible in `dataLayer`; the `zq:consent-updated` listener is a notification hook, not a consent manager. Reject/accept/partial choice/revoke/return-visitor journeys cannot be validated until the approved real CMP and its restoration callback are identified. No consent grant was fabricated. Authenticated read-only GTM container access was unavailable, so the live GTM trigger/consent configuration is NOT VERIFIED.

The website event contract remains tested locally: `zq_quote_submitted`, `form_name=quote_form`, `submission_status=accepted`, and a server-matched UUIDv4 `submission_id`, exactly once per accepted receipt. Production Ads action configuration and event delivery remain unverified. Existing Ads instructions name **ZQ - Quote Form Submitted** and require **Count = One** with the accepted UUID as transaction ID; confirm the existing label/tag in Ads and GTM Preview without creating or publishing another action.

The commit review found and removed customer fields from the optional server telemetry payload. Regression coverage now asserts that accepted quote telemetry contains only `timestamp`, `business` and the static `event`; it confirms names, email, phone, UTM campaign and click IDs are excluded.

Required next staging steps: create an isolated Preview Redis database/token with the required atomic commands and `EVAL`; verify the Preview provider key sends only to an approved test inbox; deploy this commit to an approved Preview; then run the controlled accepted, same-ID replay, conflicting payload, rejection, timeout, outage and concurrency scenarios while checking one provider delivery and one event. Keep Production credentials, customer leads, Ads and GTM untouched.
