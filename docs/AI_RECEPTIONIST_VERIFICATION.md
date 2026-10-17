# AI receptionist verification report

Verification date: 2026-10-17. Repository:
`https://github.com/abubakerasif202/zqremovels`.
Local checkout: `C:\Users\abuba\zq`.
Base revision: `9f39da4514d496e1eeaf18d61b7080d86e272d64`.
Branch: `fix/domain-migration-recovery-2026-10-15`.

This report records source inspection and local validation. External production
systems were not changed or exercised. No email delivery, inbox receipt, booking,
deployment readiness, or live Google Ads result is claimed.

## Source audit

- Public `api/quote.js` supports modern quotes, legacy quotes and simple contact
  requests, JSON and native form submissions, honeypot checks, rate limiting,
  configured Turnstile/reCAPTCHA, attribution, strict Web3Forms acceptance and
  accepted-only telemetry. The only implementation change is sharing its delivery
  transport, with bounded timeout and redirect rejection.
- Existing CAPTCHA checks are conditional on configured secrets. The existing
  public KV limiter falls open on network exceptions, with a memory limiter when
  KV is not configured. Those pre-existing behaviors were preserved; this report
  does not assert production configuration or public spam protection coverage.
- The current browser form in `site.js` sends directly to Web3Forms and accepts
  only HTTP success plus literal JSON `success === true`. `analytics.mjs` queues
  GTM `generate_lead` with an accepted lead ID and deduplicates it. Browser form,
  generator templates, analytics, conversion configuration and routing were not
  modified. Older memory describing another conversion event was checked against
  current source and was not used as the implementation contract.
- `api/ai-lead.js` is an independent authenticated POST handler. It validates
  consent and customer fields, rejects browser Origin requests, defaults to live
  disabled, requires explicit server credentials for live delivery, and fails
  closed when durable idempotency cannot be established.
- Atomic Redis reservation precedes delivery. Permanent digest/status records
  prevent same-ID retries from resending after acceptance, rejection, timeouts,
  concurrent calls, process interruptions or final-state write failures.
- AI requests never invoke public conversion telemetry, browser GTM or Ads.
  Dry-run success represents validation only. Accepted success represents provider
  acceptance only; neither confirms inbox delivery or a booking.
- The ADK module requires native human confirmation, binds it to the exact payload,
  preserves the UUID across retries, returns cached terminal results without a
  second delivery, and requests confirmation again for fresh retry invocations.

## Local checks performed

| Check | Result |
| --- | --- |
| `node --test tests/ai-lead.test.mjs` | 129 passed, fully mocked networking |
| `node --test tests/quote-api-security.test.mjs` | 7 passed, including CAPTCHA, honeypot, rate limit and failure telemetry |
| `node --test tests/quote-form-response.test.mjs` | 11 passed, including malformed/unconfirmed provider responses |
| `node --test tests/quote-form-response.test.mjs tests/tracking-v2.test.mjs` | 18 passed total, including the 11 form tests above and 7 tracking regressions |
| `node scripts/quote-api-smoke.mjs` | Passed existing public API smoke checks |
| `python -m unittest discover -s integrations/google-adk -p 'test_*.py' -v` | 11 passed, all HTTP mocked |
| `node scripts/ai-lead-dry-run.mjs` | Passed using fictional fixture and ephemeral local secret; no network |
| `npm run build` | Passed standalone production build |
| Node syntax checks and `git diff --check` | Passed for changed JavaScript and patch whitespace |
| JavaScript and Python specialist review | Retry/cache findings corrected; no unresolved high-severity findings in reviewed code |

Unique focused tests: **154 Node tests and 11 Python tests passed**. Public API
smoke checks and the local dry run are additional checks, not included in that count.

`npm test` was also attempted. The new 129 AI tests passed, then
`tests/business-email-pricing.test.mjs` failed while recursively scanning an
unrelated existing Lighthouse temporary artifact:

```text
EACCES: permission denied, stat
tmp/readability/browser-temp/.../SingletonCookie
```

That file's other four tests passed. The repository runner stopped on this
failure, so the full repository suite is **not green** and later suites were not
run by that invocation. Temporary browser artifacts and unrelated tests were not
deleted or modified. Local diagnostic logs are ignored under
`tmp/ai-receptionist-npm-test.log` and `tmp/ai-receptionist-build.log`.

## Verification boundaries and approval gates

- The existing Cloud Shell file `~/zq-ai/zq_receptionist/agent.py` was not available
  in this checkout and was not read or edited. The deliverable is a prepared local
  integration module and registration instructions, not a patched running agent.
- Actual installed ADK version, function schema generation, customer confirmation
  interface/resumption, durable session service and Secret Manager bindings remain
  unverified. Python tests use a simulated ToolContext.
- Redis commands match the documented REST API, but tests use a mocked datastore.
  Actual Redis permissions, atomic behavior, persistence and non-eviction settings
  need verification in an approved environment.
- Live Web3Forms delivery, endpoint hosting/bundling, canonical redirects, secrets,
  CAPTCHA, GTM and Google Ads reporting were not queried or changed. These are
  deployment/integration gates, not locally verified results.
- No production setting changes, cloud edits, deploy, commit, push, Ads/GTM
  publication or real enquiry occurred.
- Existing `.stitch` and media deletions, the untracked UI skill and
  `gsc-queries.json` were present before this work and were preserved.

See [deployment and recovery instructions](AI_RECEPTIONIST_INTEGRATION.md) and
[ADK registration instructions](../integrations/google-adk/README.md).
