import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location(
    "gsc_monitor", Path(__file__).resolve().parents[1] / "scripts" / "gsc-monitor.py"
)
monitor = importlib.util.module_from_spec(spec)
spec.loader.exec_module(monitor)


class MonitorTest(unittest.TestCase):
    def test_weighted_totals_and_zero_impressions(self):
        rows = [
            {"clicks": "1", "impressions": "10", "position": "1"},
            {"clicks": "0", "impressions": "90", "position": "11"},
        ]
        self.assertEqual(monitor.metrics(rows), (1, 100, 0.01, 10.0))
        self.assertEqual(monitor.metrics([]), (0, 0, None, None))

    def test_report_does_not_expose_attribution_parameters(self):
        self.assertEqual(
            monitor.safe_url("https://zqremovals.au/contact-us/?rwg_token=private#fragment"),
            "https://zqremovals.au/contact-us/",
        )
        self.assertEqual(monitor.safe_url("https://unknown.example/private"), "")
        self.assertEqual(monitor.sitemap_entries({"sitemap": [{
            "path": "https://zqremovals.au/sitemap.xml?private=token", "unknown": "private",
            "contents": [{"type": "web", "submitted": "79", "indexed": "0", "unknown": "private"}],
        }]}), [{"path": "https://zqremovals.au/sitemap.xml",
                 "contents": [{"type": "web", "submitted": "79", "indexed": "0"}]}])


if __name__ == "__main__":
    unittest.main()
