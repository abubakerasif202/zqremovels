"""Server-only ADK tool. Copy beside the existing receptionist agent.py."""
from __future__ import annotations

import hashlib
import http.client
import json
import os
import uuid
from urllib.parse import urlsplit

try:
    from google.adk.tools.tool_context import ToolContext
except ModuleNotFoundError:  # Allows transport tests without installing ADK.
    ToolContext = object

STATE_KEY = "zq_lead_submission"
TERMINAL_STATUSES = {"accepted", "dry_run", "rejected", "unknown", "conflict"}
REQUIRED = (
    "full_name", "phone", "email", "pickup_suburb", "dropoff_suburb",
    "crew_package", "move_scope", "property_type", "move_size",
    "pickup_access", "dropoff_access", "packing_required", "move_details",
)


def result(submission_id: str | None, status: str, message: str,
           success: bool = False) -> dict:
    return {"success": success, "submission_id": submission_id,
            "status": status, "message": message}


def _post(payload: dict) -> dict:
    target = urlsplit(os.environ.get("ZQ_AI_LEAD_URL", ""))
    secret = os.environ.get("ZQ_AI_LEAD_SECRET", "")
    if (target.scheme != "https" or not target.hostname or target.username
            or target.password or target.query or target.fragment
            or target.path != "/api/ai-lead/" or target.port not in (None, 443)
            or len(secret) < 32 or any(c in secret for c in "\r\n")):
        raise ValueError("Invalid server-side lead endpoint configuration")
    connection = http.client.HTTPSConnection(target.hostname, timeout=20)
    try:
        connection.request("POST", target.path, json.dumps(payload), {
            "Authorization": "Bearer " + secret,
            "Content-Type": "application/json",
        })
        response = connection.getresponse()
        # No redirects: never forward the bearer credential to another host.
        if 300 <= response.status < 400:
            raise ValueError("Endpoint redirects are forbidden")
        raw = response.read(65537)
        if len(raw) > 65536:
            raise ValueError("Response too large")
        data = json.loads(raw)
        if (not isinstance(data, dict)
                or type(data.get("success")) is not bool
                or data.get("submission_id") != payload["submission_id"]
                or not isinstance(data.get("status"), str)
                or not isinstance(data.get("message"), str)):
            raise ValueError("Invalid lead service response")
        expected_status = "dry_run" if payload["dry_run"] else "accepted"
        if data["success"] and (response.status >= 300
                                or data["status"] != expected_status):
            raise ValueError("Inconsistent delivery response")
        return {key: data[key] for key in
                ("success", "submission_id", "status", "message")}
    finally:
        connection.close()


def submit_lead(lead: dict[str, str], consent: bool, dry_run: bool,
                tool_context: ToolContext) -> dict:
    """Submit a quote enquiry only after ADK human confirmation.

    Present every supplied field and the consent text to the customer first.
    consent means permission to send these details to ZQ Removals for a quote.
    dry_run validates fictional data without sending an enquiry. A successful
    enquiry is never a confirmed booking or proof of inbox delivery.
    """
    if (consent is not True or type(dry_run) is not bool
            or not isinstance(lead, dict)
            or set(lead) - set(REQUIRED) - {"move_date"}
            or any(not isinstance(lead.get(key), str) or not lead[key].strip()
                   or len(lead[key]) > 4000 for key in REQUIRED)
            or any(not isinstance(value, str) for value in lead.values())):
        return result(None, "validation_failed", "Complete the details and obtain explicit consent.")
    fingerprint = hashlib.sha256(json.dumps(
        {"lead": lead, "consent": consent, "dry_run": dry_run},
        sort_keys=True, separators=(",", ":")).encode()).hexdigest()
    pending = tool_context.state.get(STATE_KEY)
    if pending and pending["fingerprint"] != fingerprint and pending.get("attempted"):
        return result(pending["submission_id"], "review_required",
                      "An enquiry was already attempted in this session. Resolve it before creating another.")
    new_request = not pending or pending["fingerprint"] != fingerprint
    if new_request:
        pending = {"fingerprint": fingerprint, "submission_id": str(uuid.uuid4())}
        tool_context.state[STATE_KEY] = pending
    if pending.get("response"):
        return pending["response"]
    confirmation = tool_context.tool_confirmation
    if new_request or confirmation is None:
        tool_context.request_confirmation(
            hint="Approve sending these details to ZQ Removals for a quotation. "
                 "This does not book a move." if not dry_run else
                 "Approve a fictional dry run. No enquiry will be delivered.",
            payload={"lead": lead, "consent": True, "dry_run": dry_run,
                     "fingerprint": fingerprint})
        return result(pending["submission_id"], "confirmation_required", "Awaiting customer approval.")
    if not confirmation.confirmed:
        return result(pending["submission_id"], "not_submitted", "Customer approval is required.")
    if (not isinstance(confirmation.payload, dict)
            or confirmation.payload.get("fingerprint") != fingerprint):
        return result(pending["submission_id"], "not_submitted", "Approval does not match these details.")
    pending = {**pending, "attempted": True}
    tool_context.state[STATE_KEY] = pending
    try:
        response = _post({"submission_id": pending["submission_id"],
                          "lead": lead, "consent": True, "dry_run": dry_run})
    except (OSError, ValueError, http.client.HTTPException):
        return result(pending["submission_id"], "delivery_unknown",
                      "Delivery could not be verified. Retry only with this same submission ID; no booking is confirmed.")
    if response["status"] in TERMINAL_STATUSES:
        tool_context.state[STATE_KEY] = {**pending, "response": response}
    return response
