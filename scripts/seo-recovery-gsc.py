#!/usr/bin/env python3
"""Reproduce aggregate historical Web Search metrics without extracting the ZIP.

Usage: py scripts/seo-recovery-gsc.py PATH_TO_ZIP
"""
import argparse
import collections
import csv
import io
from pathlib import Path
from urllib.parse import urlsplit
from zipfile import ZipFile

QUERIES = {
    "removalists adelaide": "/removalists-adelaide/",
    "removalists near me": "/removalists-adelaide/",
    "affordable removalists adelaide": "/cheap-removalists-adelaide/",
    "cheap removalists adelaide": "/cheap-removalists-adelaide/",
    "house removalists adelaide": "/house-removals-adelaide/",
    "furniture removalists adelaide": "/furniture-removalists-adelaide/",
    "office removalists adelaide": "/office-removals-adelaide/",
    "local removalists adelaide": "/removalists-adelaide/",
    "removalist prices adelaide": "/removalists-adelaide-prices/",
    "removalists adelaide prices": "/removalists-adelaide-prices/",
    "moving services adelaide": "/removalists-adelaide/",
}
PAGES = [
    "/", "/removalists-adelaide/", "/removalists-adelaide-prices/",
    "/house-removals-adelaide/", "/office-removals-adelaide/",
    "/furniture-removalists-adelaide/", "/interstate-removals-adelaide/",
    "/adelaide-moving-guides/removalists-cost-adelaide/", "/contact-us/",
    "/removalists-unley-park/", "/removalists-adelaide-hills/",
    "/removalists-toorak-gardens/", "/removalists-hyde-park/",
    "/removalists-medindie/", "/removalists-queens-park/",
    "/removalists-malvern/", "/removalists-brighton/",
    "/removalists-kensington-gardens/",
]


def add(acc, row):
    impressions = int(row["impressions"])
    acc[0] += int(row["clicks"])
    acc[1] += impressions
    acc[2] += float(row["average_position"] or 0) * impressions


def fmt(acc):
    c, i, p = acc
    return [str(c), f"{i:,}", f"{c / i * 100:.2f}%" if i else "—",
            f"{p / i:.2f}" if i else "—"]


def table(headers, rows):
    return "\n".join(["| " + " | ".join(headers) + " |",
                      "| " + " | ".join(["---"] * len(headers)) + " |"] +
                     ["| " + " | ".join(str(cell) for cell in row) + " |" for row in rows])


def main(archive, output):
    with ZipFile(archive) as z:
        entries = z.namelist()
        root = next((p[:-len("web/daily.csv")] for p in entries
                     if p.endswith("web/daily.csv") and "zqremovals.au" in p), None)
        if root is None:
            raise ValueError("Not a historical zqremovals.au Search Console archive")

        def rows(name):
            with z.open(name) as fh:
                yield from csv.DictReader(io.TextIOWrapper(fh, encoding="utf-8-sig", newline=""))

        daily = sorted(rows(root + "web/daily.csv"), key=lambda r: r["date"])
        if len(daily) < 56:
            raise ValueError("Not enough daily records for two consecutive 28-day periods")
        summary = next(rows(root + "web/summary.csv"))
        maps = {key: collections.defaultdict(lambda: [0, 0, 0.0])
                for key in ("queries", "pages", "page_queries")}
        counts = collections.Counter()
        for kind, mapping in maps.items():
            prefix = root + "web/" + kind + "/"
            for filename in entries:
                if not filename.startswith(prefix) or not filename.endswith(".csv"):
                    continue
                counts[kind] += 1
                for row in rows(filename):
                    if kind == "queries":
                        key = row["query"]
                    else:
                        url = urlsplit(row["page"])
                        if url.hostname != "zqremovals.au":
                            continue
                        key = (url.path, row["query"]) if kind == "page_queries" else url.path
                    if key:
                        add(mapping[key], row)

    def total(days):
        agg = [0, 0, 0.0]
        for day in days:
            add(agg, day)
        return agg

    all_days, old28, new28 = total(daily), total(daily[-56:-28]), total(daily[-28:])
    if (all_days[0], all_days[1]) != (int(summary["clicks"]), int(summary["impressions"])):
        raise ValueError("Daily and summary clicks/impressions disagree")
    md = [
        "# KEYWORD OPPORTUNITIES — Historical GSC",
        "",
        "Source: sc-domain_zqremovals.au.zip, Web Search, archived property only.",
        "Covered dates: " + daily[0]["date"] + " to " + daily[-1]["date"] + ".",
        "New-domain current Search Console data: not in this archive. No combined-site position or ranking-loss claim.",
        "",
        "## Verified historical totals",
        "",
        table(["Period", "Clicks", "Impressions", "CTR", "Avg position (impression weighted)"], [
            ("All " + daily[0]["date"] + "–" + daily[-1]["date"], *fmt(all_days)),
            ("Previous 28 days " + daily[-56]["date"] + "–" + daily[-29]["date"], *fmt(old28)),
            ("Latest 28 days " + daily[-28]["date"] + "–" + daily[-1]["date"], *fmt(new28)),
        ]),
        "",
        "The old-domain decline does not establish a combined-property visibility decline after migration.",
        "Privacy-filtered query/page extracts need not sum to the Search Console property-level totals.",
        "",
        "## Exact-query historical opportunities",
        "",
        table(["Query", "Clicks", "Impressions", "CTR", "Avg position", "Preferred new-domain page"],
              [(term, *fmt(maps["queries"][term]), target) for term, target in QUERIES.items()]),
        "",
        "A missing exact query is shown as 0 exported observations, not proof of zero market demand.",
        "Preferred targets are editorial intent assignments, not observed new-domain winning URLs.",
        "",
        "## High-priority historical landing pages",
        "",
        table(["Old-domain path", "Clicks", "Impressions", "CTR", "Avg position"],
              [(path, *fmt(maps["pages"][path])) for path in PAGES]),
        "",
        "Historical impressions in earlier briefs can differ because their date windows differ.",
        "",
        "## Query-to-page overlap to recheck for cannibalisation",
        "",
    ]
    for term, preferred in QUERIES.items():
        matches = [(path, agg) for (path, query), agg in maps["page_queries"].items()
                   if query == term and agg[1]]
        matches.sort(key=lambda item: -item[1][1])
        if len(matches) > 1:
            examples = "; ".join(path + " (" + str(agg[1]) + " impressions)"
                                 for path, agg in matches[:3])
            md.append("- " + term + ": " + examples + ". Prefer " + preferred +
                      "; check new-domain intent before consolidating.")
    md += [
        "",
        "## Priority follow-up",
        "",
        "1. Export both properties for identical dates, Web Search type and query/page dimensions.",
        "2. Compare redirects and current impressions after mapping the old paths to new canonical equivalents.",
        "3. Keep the pricing landing page distinct from the educational costs guide; review real page-query overlap.",
        "4. Check commercial pages and Toorak Gardens, Brighton and Kensington Gardens in current indexing.",
        "5. Preserve accepted-quote tracking as a separate conversion recovery workstream.",
        "",
        "Archive processing: " + ", ".join(str(counts[key]) + " daily " + key + " CSVs"
                                          for key in ("queries", "pages", "page_queries")) +
        "; no bulk extraction.",
        "",
    ]
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text("\n".join(md), encoding="utf-8")
    print("Wrote", output, "bytes", output.stat().st_size)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("archive", type=Path)
    parser.add_argument("--output", type=Path,
                        default=Path("docs/seo-recovery/KEYWORD-OPPORTUNITIES.md"))
    args = parser.parse_args()
    main(args.archive, args.output)
