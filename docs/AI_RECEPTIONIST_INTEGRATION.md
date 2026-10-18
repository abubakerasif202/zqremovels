# AI receptionist quotation integration

Local implementation for `abubakerasif202/zqremovels`. Production deployment,
settings, Cloud Shell changes and real enquiries require approval.

## Architecture and preserved behavior

`POST /api/ai-lead` is a separate server-to-server entry point. It does not call
the public handler or bypass its CAPTCHA. `api/quote.js` retains public form
parsing, honeypot, configured CAPTCHA, rate limiting, normalization, response
handling and accepted-only telemetry. Both server handlers use
`lib/server/web3forms.js` for the same fixed Web3Forms transport. The shared
transport rejects redirects and has a 10-second timeout.

The current browser implementation posts directly to Web3Forms and queues
`generate_lead` only after HTTP success and literal JSON `success === true`.
That browser behavior, forms, analytics, GTM and Ads configuration are unchanged.
The AI endpoint emits no browser conversion, telemetry event or offline Ads upload.

## Server-side environment variables

| Variable | Runtime | Purpose |
| --- | --- | --- |
| `ZQ_AI_LEAD_SECRET` | Website and trusted ADK runtime | Same randomly generated bearer secret, at least 32 characters; use at least 32 random bytes encoded as hex |
| `ZQ_AI_LEAD_ENABLED` | Website | Must equal `true` for live AI delivery; absent or any other value disables it |
| `WEB3FORMS_ACCESS_KEY` | Website | Explicit existing verified delivery key; AI does not accept a `VITE_` key or embedded fallback |
| `KV_REST_API_URL` | Website | HTTPS Redis REST endpoint for durable idempotency and AI rate limiting |
| `KV_REST_API_TOKEN` | Website | Redis REST credential supporting GET, SET NX/XX, EVAL, INCR and EXPIRE |
| `ZQ_AI_LEAD_URL` | ADK runtime | Approved canonical HTTPS origin plus `/api/ai-lead/`, without query, fragment, credentials or redirects |

Keep secrets in hosting environment storage and Google Secret Manager in project
`sincere-kit-506814-u8`, injected into the trusted agent process by its runtime.
Do not add credentials to source, HTML, browser environment variables, model
instructions, tool arguments, logs or shell history. Existing public CAPTCHA,
Web3Forms, rate-limit and tracking settings do not need changing.

Dry runs need only the bearer secret on the website. They do not read Redis,
contact Web3Forms, persist a lead or emit conversions.

## Request contract

Send `Content-Type: application/json` and `Authorization: Bearer <server-secret>`.
Origin-bearing browser requests are rejected; no CORS access is granted.

```json
{
  "submission_id": "c1e31e75-692b-4ccd-9244-c14ad8645146",
  "consent": true,
  "dry_run": true,
  "lead": {
    "full_name": "Test Customer",
    "phone": "0400000000",
    "email": "fictional@example.com",
    "pickup_suburb": "Test Pickup",
    "dropoff_suburb": "Test Dropoff",
    "crew_package": "Not sure",
    "move_scope": "Local move",
    "property_type": "House",
    "move_size": "One bedroom",
    "pickup_access": "Ground floor",
    "dropoff_access": "Ground floor",
    "packing_required": "No",
    "move_details": "FICTIONAL TEST DATA. Do not contact or book."
  }
}
```

All listed customer fields are required nonempty strings. `move_date` is optional
and must be a real ISO calendar date (`YYYY-MM-DD`). Extra fields, non-string
values, control characters, invalid email/phone/date, oversize fields, and bodies
over 16 KiB are rejected. Field limits are defined in `api/ai-lead.js`. No prices
or service availability are inferred. Choice descriptions are free text because
the receptionist may need to record uncertainty. `consent` must be literal true;
the trusted agent host must obtain explicit customer approval of the exact details.

Use the fictional fixture only with `dry_run: true`. Dry runs require a `Test `
name, `example.com` email, `0400000000`, `Test Pickup`, `Test Dropoff` and details
beginning `FICTIONAL TEST DATA`.

Every handled response includes `success`, `submission_id` (null before validation),
`status` and `message`:

| HTTP / status | Meaning and handling |
| --- | --- |
| 200 / `dry_run` | `success: true` means validation passed; no enquiry submitted |
| 200 / `accepted` | `success: true` means Web3Forms explicitly accepted; inbox arrival and booking are unconfirmed |
| 202 / `pending` | `success: false`; same ID may be polled, never create another automatically |
| 400 / `invalid_request` | Fix details and obtain approval again before any send |
| 401 / `unauthorized`, 403 / `forbidden` | No submission; check trusted server authentication |
| 405 / `method_not_allowed` | POST required |
| 409 / `conflict` | ID already bound to different normalized details; operator review |
| 429 / `rate_limited` | AI limit is 30 new attempts/minute globally; reuse same ID later |
| 502 / `rejected` | Explicit provider rejection; no automatic redelivery |
| 502 / `unknown` | Delivery may have happened; reconcile before any new submission |
| 503 / `disabled`, `configuration_error`, `datastore_unavailable` | Live unavailable; preserve same ID on retries |

## Duplicate protection and recovery

Before delivery, Redis atomically reserves `zq:ai-lead:v1:<UUID>` with SET NX.
The record stores a SHA-256 digest of normalized details and a status, without
customer fields. Changed payloads for the same UUID conflict. Concurrent repeats
cannot both send. Accepted, rejected and uncertain results remain terminal.
The same enquiry must always retain its UUID in durable ADK session state.

Lead records have **no TTL**. Use persistent, non-evicting Redis storage and retain
the namespace across releases. Expiring, deleting, flushing or evicting records
can permit later resends. Monitor capacity and Redis durability. The AI limiter
uses a separate `zq:ai-lead:rate:v1` key that expires after 60 seconds.

The implementation deliberately does not retry provider requests. A timeout,
invalid response, server error, crash, or failure to save the final result can
leave `unknown` or permanent `pending`. This prevents an automatic duplicate
despite uncertain delivery. Provider delivery and Redis cannot be one atomic
transaction; operator reconciliation is required for those cases. Check provider
records using the submission ID before deciding whether a distinct new attempt
is appropriate. Never delete a record merely to make a request succeed.

## Local verification and fictional dry run

```powershell
Set-Location -LiteralPath 'C:\Users\abuba\zq'
node scripts/ai-lead-dry-run.mjs
node --test tests/ai-lead.test.mjs tests/quote-api-security.test.mjs tests/quote-form-response.test.mjs
node scripts/quote-api-smoke.mjs
python -m unittest discover -s integrations/google-adk -p 'test_*.py' -v
npm run build
```

The dry-run script invokes the actual local handler with an ephemeral secret,
fictional fixture and a network stub that throws if called. Automated tests mock
all delivery and Redis requests. Do not use real customers for validation.

## Deployment procedure (instructions only; requires approval)

1. Review the local diff and verification report. Preserve unrelated checkout
   changes. Confirm the approved commit, hosting project and canonical domain.
2. In an approved isolated environment, provision durable Redis and server-side
   credentials. Keep `ZQ_AI_LEAD_ENABLED` unset. Validate Secret Manager access
   under the actual agent service identity without printing secrets.
3. Deploy the approved website revision. Keep existing public form, CAPTCHA,
   Web3Forms, GTM, Ads and Vercel routing settings. This repository uses automatic
   `api/*.js` functions; no extra rewrite is introduced. Verify the canonical
   endpoint does not redirect before sending credentials.
4. Only after approval for remote verification, exercise unauthenticated and
   authenticated fictional `dry_run: true` requests. Verify no provider calls or
   conversions occur. Never change the fixture to `dry_run: false`.
5. Inspect the real `~/zq-ai/zq_receptionist/agent.py`. Follow
   [the ADK integration guide](../integrations/google-adk/README.md), adding the
   module to existing tools and preserving existing agent configuration. Verify
   installed ADK version, native customer confirmation/resume support and durable
   session state. Do not enable live delivery if confirmation is unsupported.
6. After separate approval to enable live submissions, set the enable flag and
   release as required by the host. A real enquiry or inbox check requires its
   own authorization. Report provider acceptance separately from actual inbox
   receipt. No step here confirms a booking.

Rollback: disable `ZQ_AI_LEAD_ENABLED`, stop the ADK submission tool, and revert
only this feature's approved revision if needed. Preserve idempotency records
and existing public form credentials/configuration. Rotate the shared bearer
secret in both server runtimes if exposure is suspected.

Runtime references checked via Context7:
[Vercel Node.js functions](https://vercel.com/docs/functions/runtimes/node-js),
[Redis REST command format](https://upstash.com/docs/redis/features/restapi),
[ADK native confirmation sample](https://github.com/google/adk-python/blob/main/contributing/samples/hitl/tool_confirmation/README.md).

## Website chat enquiry journey (customer-confirmed, in-chat)

The Cloud Run agent still never submits a lead from the website: `api/ai-chat.js`
rejects any `submit_lead` call, and no ADK confirmation bridge is needed. The
customer completes the journey inside the chat widget:

1. The receptionist gathers details conversationally (name, phone, optional
   email, suburbs, date, property, stairs/lifts/parking, packing, crew) and ends
   its reply with `[[ENQUIRY_READY]]` when enough is known. The server strips the
   token and returns `enquiry_ready: true`, which shows the **Review & send my
   enquiry** button (the footer **Send enquiry** button does the same).
2. Opening the form calls `POST /api/ai-chat/` with `{"action":"draft"}`. The
   agent extracts a JSON draft from the stored chat; `sanitizeDraft` whitelists
   keys, enums, formats and lengths. The draft only pre-fills the editable form
   and never overwrites a field the customer has typed. It has its own
   4 per minute per-session limit, separate from the 12 per minute chat limit.
3. The customer edits, reviews the exact details, ticks the consent box and
   presses **Confirm & send enquiry**. The widget posts to
   `/api/ai-chat-submit/` (origin + server-created session cookie, per-IP daily
   limit, durable one-enquiry-per-chat receipt, bearer-secret call to
   `/api/ai-lead/`).
4. Success text and the reference (the submission UUID) appear only after an
   explicit `accepted` response. Pending, unknown, rejected and network failures
   never claim success and never retry automatically.
5. On a first-time acceptance only (`replayed` absent), the widget calls
   `trackFormSuccess("ai_chat_enquiry", submission_id)`, which emits
   `zq_quote_submitted` (`form_name=quote_form`, `submission_status=accepted`) and
   `generate_lead` once per UUIDv4. Chat leads therefore count as quote
   conversions in the existing GTM/Ads trigger; no account setting was changed.

Email is optional: an empty or absent email is omitted from delivery, while a
supplied email must still be valid. Web3Forms then has no reply-to for that lead,
so staff phone the customer.
