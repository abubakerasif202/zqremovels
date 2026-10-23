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

## Local test evidence

The repository test suite exercises receipt claims, accepted replay, conflicting payloads, concurrent retries, provider rejection, ambiguous timeout, receipt-store outage, acceptance-write failure, strict client response matching, UUID validation, PII-free event payloads, duplicate suppression and stale consent-gated attribution. `npm run test:quote-api` runs the isolated API smoke check. The browser conversion suite intercepts the local endpoint and external requests; it does not submit a real lead.

This turn's Playwright run completed 172 tests with 28 project-filtered skips across 375px and 390px mobile, 768px tablet, and 1366px and 1920px desktop Chrome. It covered accepted and rejected quote flows, duplicate/retry behavior, consent transitions, mobile layout, no-JavaScript content, reduced motion and the chat composer. Requests to analytics and quote providers were intercepted. Earlier QA evidence recorded in `docs/production-verification-2026-10-22.md` additionally compared six routes at eight widths with 48 unchanged screenshot pairs and zero overflow. Native iOS Safari and Android Chrome keyboard behavior was not tested on physical devices. WebKit could not launch because required host libraries were absent.

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
