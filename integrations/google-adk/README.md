# Google ADK receptionist integration

Prepared locally; the existing Cloud Shell `~/zq-ai/zq_receptionist/agent.py`
was not accessible from this checkout and has not been changed. No cloud
settings, production deployment, or real enquiry was submitted.

After deployment approval, copy `submit_lead.py` beside that existing `agent.py`.
Add the import and append the function to the existing Agent tools, preserving
all existing tools, instructions and configuration:

```python
from .submit_lead import submit_lead

# In the existing Agent(...) definition:
# tools=[...existing tools..., submit_lead]
```

The function uses native ADK manual tool confirmation. Do not register a second
unguarded HTTP submission tool. The host must display the confirmation payload
and collect the customer's explicit approval through ADK's confirmation protocol.
A model-generated statement that the customer approved is insufficient. Test
your existing ADK runner/client supports resuming manual confirmation before
enabling real delivery. If it does not, this tool remains unsubmitted.

Persist session state using the runner's durable session service. Do not offer
the model arbitrary session-state editing or the ability to synthesize confirmation
events. Restrict those events to the customer-facing host. The session stores a
digest, UUID and result; customer details appear in confirmation events and must
follow the application's normal privacy and session retention controls.

Set these environment variables only in the trusted agent runtime, backed by
Secret Manager for the credential (Google Cloud project `sincere-kit-506814-u8`):

- `ZQ_AI_LEAD_URL`: approved HTTPS website origin plus `/api/ai-lead`; no query,
  credentials, fragment or alternate port. Use the canonical route without a redirect.
- `ZQ_AI_LEAD_SECRET`: same strong server-only secret configured on the website,
  at least 32 characters. Never put it in agent instructions, browser code, tool
  arguments, source control or logs.

Do not change cloud or production configuration until approved. Existing Google
ADK is the only runtime dependency; transport and tests use Python's standard library.

Add these constraints to the existing receptionist instruction:

> Collect all quote fields and explain that details will be sent to ZQ Removals
> for a quote. Read back the details. Obtain explicit consent to this disclosure.
> Call submit_lead and wait for the customer's ADK confirmation. Never infer
> consent from continuing the conversation. For fictional testing set dry_run=true.
> Only an accepted response with success=true means the quote service accepted
> the enquiry. It does not confirm email inbox delivery, price, availability,
> or a booking. For dry_run, confirmation_required, not_submitted, errors or
> delivery_unknown say it has not been verified as submitted. Never create a
> new session/submission to bypass a delivery_unknown result. Seek operator
> review if its outcome cannot be resolved with the same submission ID.

The session keeps one enquiry identity. Repeated calls reuse the UUID. Completed
results are cached only for accepted, dry_run, rejected, unknown and conflict.
Transient and pending results can be retried using the same UUID. A fresh tool
context requests native customer confirmation again before retrying; a cached
terminal result can be retrieved without sending another enquiry.
Network uncertainty can retry only the exact same payload
and UUID, allowing server idempotency to resolve it. Changed details after any
attempt require operator review. Start a new enquiry session only for an
intentional distinct request after resolving the previous enquiry.

## Offline verification

```powershell
Set-Location -LiteralPath 'C:\Users\abuba\zq\integrations\google-adk'
python -m unittest -v
```

Eleven tests cover validation/consent, trusted approval, approval bound to details,
duplicates, uncertain delivery, authentication headers, redirect rejection,
delivery failures, dry-run/live response consistency, pending polling and insecure
configuration. All HTTP calls are mocked. A dry-run response may have success=true
only with status=dry_run; this means validation passed and no enquiry was sent.

For an approved endpoint dry run, use `fictional-dry-run.json` as the `lead`
argument, `consent=true`, and **`dry_run=true`**, then approve the explicit dry-run
confirmation. Never send this fixture with dry_run=false. The fixture is a
fictional validation example; keep choice values aligned with the deployed API's
schema. Do not convert dry runs or AI enquiries into browser Google Ads events.

ADK confirmation reference fetched through Context7:
[official tool confirmation sample](https://github.com/google/adk-python/blob/main/contributing/samples/hitl/tool_confirmation/README.md).
Actual Cloud Shell ADK version, imports, runner confirmation support, durable
session storage and Secret Manager bindings still require approved environment
verification. No claim of Cloud Shell runtime validation is made here.
