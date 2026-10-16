import json
import unittest
from types import SimpleNamespace
from unittest.mock import patch

import submit_lead as tool


class Context:
    def __init__(self):
        self.state = {}
        self.tool_confirmation = None

    def request_confirmation(self, **kwargs):
        self.request = kwargs

    def approve(self):
        self.tool_confirmation = SimpleNamespace(confirmed=True, payload=self.request["payload"])


class SubmissionTests(unittest.TestCase):
    def setUp(self):
        self.lead = {key: "Fictional test value" for key in tool.REQUIRED}
        self.lead.update(full_name="Fictional Test Customer", email="fictional@example.invalid",
                         phone="0400000000")
        self.context = Context()

    def call(self, consent=True, dry_run=True):
        return tool.submit_lead(self.lead, consent, dry_run, self.context)

    @patch.object(tool, "_post")
    def test_no_consent_or_missing_fields_never_posts(self, post):
        self.assertEqual(self.call(consent=False)["status"], "validation_failed")
        del self.lead["phone"]
        self.assertEqual(self.call()["status"], "validation_failed")
        post.assert_not_called()

    @patch.object(tool, "_post")
    def test_requires_trusted_confirmation(self, post):
        self.assertEqual(self.call()["status"], "confirmation_required")
        self.assertEqual(self.call()["status"], "confirmation_required")
        self.context.tool_confirmation = SimpleNamespace(confirmed=True, payload={})
        self.assertEqual(self.call()["status"], "not_submitted")
        post.assert_not_called()

    @patch.object(tool, "_post")
    def test_confirmation_bound_to_details(self, post):
        self.call()
        self.context.approve()
        self.lead["full_name"] = "Another fictional name"
        self.assertEqual(self.call()["status"], "confirmation_required")
        self.assertEqual(self.call()["status"], "not_submitted")
        post.assert_not_called()

    @patch.object(tool, "_post")
    def test_duplicate_uses_cached_response(self, post):
        initial = self.call()
        self.context.approve()
        post.return_value = tool.result(initial["submission_id"], "dry_run", "Validated")
        self.assertEqual(self.call(), self.call())
        post.assert_called_once()
        self.assertTrue(post.call_args.args[0]["dry_run"])

    @patch.object(tool, "_post", side_effect=TimeoutError)
    def test_timeout_reuses_id_and_prevents_new_lead(self, post):
        initial = self.call()
        self.context.approve()
        self.assertEqual(self.call()["status"], "delivery_unknown")
        self.context.tool_confirmation = None
        self.assertEqual(self.call()["status"], "confirmation_required")
        self.context.approve()
        self.call()
        self.assertEqual(post.call_args.args[0]["submission_id"], initial["submission_id"])
        self.lead["full_name"] = "Changed fictional name"
        self.assertEqual(self.call()["status"], "review_required")

    @patch.object(tool, "_post")
    def test_fresh_context_returns_accepted_without_confirmation(self, post):
        initial = self.call(dry_run=False)
        self.context.approve()
        post.return_value = tool.result(initial["submission_id"], "accepted", "Accepted", True)
        accepted = self.call(dry_run=False)
        fresh = Context()
        fresh.state = self.context.state
        self.context = fresh
        self.assertEqual(self.call(dry_run=False), accepted)
        post.assert_called_once()

    @patch.object(tool, "_post")
    def test_transient_failures_reconfirm_and_retry_same_id(self, post):
        for status in ("rate_limited", "datastore_unavailable", "disabled", "unauthorized"):
            with self.subTest(status=status):
                self.context = Context()
                initial = self.call()
                self.context.approve()
                post.return_value = tool.result(initial["submission_id"], status, "Retry later")
                self.call()
                fresh = Context()
                fresh.state = self.context.state
                self.context = fresh
                count = post.call_count
                self.assertEqual(self.call()["status"], "confirmation_required")
                self.assertEqual(post.call_count, count)
                self.context.approve()
                self.call()
                self.assertEqual(post.call_args.args[0]["submission_id"], initial["submission_id"])

    @patch.object(tool.http.client, "HTTPSConnection")
    @patch.dict(tool.os.environ, {"ZQ_AI_LEAD_URL": "https://example.invalid/api/ai-lead",
                                 "ZQ_AI_LEAD_SECRET": "s" * 32})
    def test_transport_auth_redirects_and_delivery_failure(self, connection):
        payload = {"submission_id": "id", "dry_run": False}
        response = connection.return_value.getresponse.return_value
        response.status = 401
        response.read.return_value = json.dumps(tool.result("id", "unauthorized", "Denied")).encode()
        self.assertFalse(tool._post(payload)["success"])
        self.assertEqual(connection.return_value.request.call_args.args[3]["Authorization"], "Bearer " + "s" * 32)
        response.status = 302
        with self.assertRaises(ValueError):
            tool._post(payload)
        response.status = 502
        response.read.return_value = json.dumps(tool.result("id", "delivery_failed", "Failed")).encode()
        self.assertFalse(tool._post(payload)["success"])

    @patch.object(tool.http.client, "HTTPSConnection")
    @patch.dict(tool.os.environ, {"ZQ_AI_LEAD_URL": "https://example.invalid/api/ai-lead",
                                 "ZQ_AI_LEAD_SECRET": "s" * 32})
    def test_dry_run_and_live_acceptance_must_match_mode(self, connection):
        response = connection.return_value.getresponse.return_value
        response.status = 200
        response.read.return_value = json.dumps(tool.result("id", "dry_run", "Not submitted", True)).encode()
        self.assertTrue(tool._post({"submission_id": "id", "dry_run": True})["success"])
        with self.assertRaises(ValueError):
            tool._post({"submission_id": "id", "dry_run": False})
        response.read.return_value = json.dumps(tool.result("id", "accepted", "Accepted", True)).encode()
        with self.assertRaises(ValueError):
            tool._post({"submission_id": "id", "dry_run": True})

    @patch.object(tool, "_post")
    def test_pending_can_be_polled_using_same_id(self, post):
        initial = self.call()
        self.context.approve()
        post.return_value = tool.result(initial["submission_id"], "pending", "Pending")
        self.call()
        self.call()
        self.assertEqual(post.call_count, 2)
        self.assertEqual(post.call_args.args[0]["submission_id"], initial["submission_id"])

    @patch.dict(tool.os.environ, {"ZQ_AI_LEAD_URL": "http://example.invalid/api/ai-lead",
                                 "ZQ_AI_LEAD_SECRET": "s" * 32})
    def test_insecure_configuration_rejected(self):
        with self.assertRaises(ValueError):
            tool._post({})


if __name__ == "__main__":
    unittest.main()
