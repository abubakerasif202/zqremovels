"""Build a token-free SEO monitoring snapshot from the two local GSC exports."""
import argparse
from collections import defaultdict
import csv
from datetime import date, timedelta
import json
from pathlib import Path
from urllib.parse import urlsplit

HOSTS = {"zqremovals.au", "zqremovalsadelaide.com.au"}
# Intent rules are editorial decisions, not an automated instruction to merge.
TARGETS = {
    "office removalists adelaide": ("commercial", "/office-removals-adelaide/"),
    "removalists adelaide prices": ("commercial", "/removalists-adelaide-prices/"),
    "removalist cost adelaide": ("informational", "/adelaide-moving-guides/removalists-cost-adelaide/"),
    "removalists cost adelaide": ("informational", "/adelaide-moving-guides/removalists-cost-adelaide/"),
    "removalists adelaide": ("transactional", "/removalists-adelaide/"),
    "budget removalists adelaide": ("commercial", "/removalists-adelaide-prices/"),
    "house removals adelaide": ("transactional", "/house-removals-adelaide/"),
    "hyde park removalist": ("geographic", "/removalists-hyde-park/"),
    "hyde park removalists": ("geographic", "/removalists-hyde-park/"),
    "local removalist hyde park": ("geographic", "/removalists-hyde-park/"),
    "removalists hyde park": ("geographic", "/removalists-hyde-park/"),
    "removalists unley park": ("geographic", "/removalists-unley-park/"),
    "local removalist unley park": ("geographic", "/removalists-unley-park/"),
    "removalists unley": ("geographic", "/removalists-unley/"),
    "piano removalists adelaide": ("specialist", "/services/piano-movers-adelaide/"),
    "piano movers adelaide": ("specialist", "/services/piano-movers-adelaide/"),
    "malvern removalists": ("geographic", "/removalists-malvern/"),
    "same day removalists adelaide": ("transactional", "/same-day-removalists-adelaide/"),
    "northern adelaide removalists": ("geographic", "/removalists-northern-adelaide/"),
    "adelaide hills removalists": ("geographic", "/removalists-adelaide-hills/"),
    "adelaide to brisbane removals": ("transactional", "/adelaide-to-brisbane-removals/"),
    "adelaide to sydney removalists": ("transactional", "/adelaide-to-sydney-removalists/"),
    "packing and unpacking services": ("transactional", "/packing-services-adelaide/"),
}


def metrics(rows):
    clicks = impressions = 0
    weighted = 0.0
    for row in rows:
        count = int(row["impressions"])
        clicks += int(row["clicks"])
        impressions += count
        weighted += count * float(row["position"] or 0)
    return (clicks, impressions, clicks / impressions if impressions else None,
            weighted / impressions if impressions else None)


def measure(rows):
    return dict(zip(("clicks", "impressions", "ctr", "position"), metrics(rows)))


def safe_url(value):
    url = urlsplit(value)
    if url.scheme not in ("http", "https") or url.hostname is None:
        return ""
    host = url.hostname.removeprefix("www.")
    if host not in HOSTS:
        return ""
    return f"{url.scheme}://{url.hostname}{url.path or '/'}"


def sitemap_entries(response):
    result = []
    for entry in response.get("sitemap", []):
        safe_path = safe_url(entry.get("path", ""))
        if not safe_path:
            continue
        fields = ("lastSubmitted", "lastDownloaded", "isPending", "isSitemapsIndex", "warnings", "errors")
        contents = [{key: item[key] for key in ("type", "submitted", "indexed") if key in item}
                    for item in entry.get("contents", [])]
        result.append({"path": safe_path, **{key: entry[key] for key in fields if key in entry},
                       "contents": contents})
    return result


def read(path):
    with path.open(encoding="utf-8-sig", newline="") as stream:
        return list(csv.DictReader(stream))


def save_csv(path, rows, fields):
    with path.open("w", encoding="utf-8", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)


def by_key(rows, field):
    groups = defaultdict(list)
    for row in rows:
        groups[row[field]].append(row)
    return groups


def snapshot(folder, end):
    tables = {path.stem: read(path) for path in sorted((folder / "web").glob("*.csv"))}
    total, = tables["period_totals"]
    host = total["property"].removeprefix("sc-domain:")
    if host not in HOSTS or total["search_type"] != "web":
        raise ValueError("Expected a ZQ web property export")
    if not date.fromisoformat(total["start_date"]) <= end <= date.fromisoformat(total["end_date"]):
        raise ValueError("End date is outside the export period")
    daily = tables["daily_totals"]
    windows = {}
    for key, offset in (("latest_28", 0), ("previous_28", 28)):
        last = end - timedelta(days=offset)
        first = last - timedelta(days=27)
        eligible = [r for r in daily if first.isoformat() <= r["date"] <= last.isoformat()]
        windows[key] = {"start": str(first), "end": str(last), "reported_days": len(eligible),
                        **measure(eligible)}
    clean_pages = [r for r in tables["pages"] if safe_url(r["page"])]
    query_page = by_key(tables["query_page"], "query")
    query_totals = by_key(tables["queries"], "query")
    devices = by_key(tables["daily_device"], "device")
    sitemaps = json.loads((folder / "sitemaps.json").read_text(encoding="utf-8-sig"))
    segmentation = {}
    for name in ("daily_country_device", "page_country_device", "query_country_device",
                 "query_page_country_device"):
        rows = tables[name]
        segmentation[name] = {device: measure(group) for device, group in by_key(
            (r for r in rows if r["country"] == "aus" and ("query" not in r or
             r["query"] == "office removalists adelaide") and (name != "query_page_country_device" or
             urlsplit(r["page"]).path == "/office-removals-adelaide/")), "device").items()}
    output = {
        "property": host, "period_start": total["start_date"], "period_end": total["end_date"],
        "first_observed_day": min((r["date"] for r in daily), default=None),
        "last_observed_day": max((r["date"] for r in daily), default=None),
        "totals": measure([total]), **windows,
        "australia": measure(r for r in tables["daily_country"] if r["country"] == "aus"),
        "devices": {key: measure(group) for key, group in devices.items()},
        "au_segments": segmentation,
        "table_row_counts": {name: len(rows) for name, rows in tables.items()},
        "jsonl_row_counts": {p.stem: sum(1 for l in p.read_text(encoding="utf-8-sig").splitlines()
                            if json.loads(l)) for p in sorted((folder / "web").glob("*.jsonl"))},
        "raw_api_response_counts": {p.parent.name: len(json.loads(p.read_text(encoding="utf-8-sig"))
                                    .get("rows", [])) for p in sorted((folder / "web/raw").glob("*/*.json"))},
        "sitemaps": sitemap_entries(sitemaps["response"]),
        "top_pages": [{"page": safe_url(r["page"]), **measure([r])} for r in clean_pages
                      if not urlsplit(r["page"]).query][:20],
        "high_impression_zero_click_count": sum(int(r["impressions"]) >= 50 and
                                               not int(r["clicks"]) for r in tables["queries"]),
        "potential_overlap_query_count": sum(len({safe_url(r["page"]) for r in group
                                             if int(r["impressions"]) >= 3} - {""}) > 1
                                             for group in query_page.values()),
    }
    matrix, overlaps = [], []
    for query, (intent, preferred) in TARGETS.items():
        if not query_totals[query]:
            continue
        candidates = sorted(
            ((safe_url(r["page"]), r) for r in query_page[query] if safe_url(r["page"])
             and not urlsplit(r["page"]).query),
            key=lambda pair: int(pair[1]["impressions"]), reverse=True)
        primary = next((r for url, r in candidates if urlsplit(url).path == preferred), None)
        row = {"property": host, "query": query, "intent": intent, "preferred_path": preferred,
               **measure(query_totals[query]), "observed_top_url": candidates[0][0] if candidates else "",
               "preferred_url_impressions": int(primary["impressions"]) if primary else 0}
        matrix.append(row)
        seen = set()
        for url, rival in candidates:
            if len({item[0] for item in candidates if int(item[1]["impressions"]) >= 3}) < 2:
                break
            if url in seen or int(rival["impressions"]) < 3:
                continue
            seen.add(url)
            recommendation = ("Preserve intent; monitor preferred landing page" if urlsplit(url).path == preferred
                              else "Review intent and internal anchors; keep distinct pages unless evidence supports merging")
            overlaps.append({"property": host, "query": query, "intent": intent, "competing_url": url,
                             "preferred_path": preferred, **measure([rival]), "action": recommendation})
    return output, matrix, overlaps


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("legacy", type=Path)
    parser.add_argument("current", type=Path)
    parser.add_argument("--end", type=date.fromisoformat, required=True)
    parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args()
    snapshots = [snapshot(folder, args.end) for folder in (args.legacy, args.current)]
    if {item[0]["property"] for item in snapshots} != HOSTS:
        parser.error("Provide one export for each ZQ property")
    args.out.mkdir(parents=True, exist_ok=True)
    (args.out / "gsc-monitoring.json").write_text(
        json.dumps([item[0] for item in snapshots], indent=2) + "\n", encoding="utf-8")
    metric_fields = ["clicks", "impressions", "ctr", "position"]
    save_csv(args.out / "keyword-to-page.csv", [row for item in snapshots for row in item[1]],
             ["property", "query", "intent", "preferred_path", *metric_fields,
              "observed_top_url", "preferred_url_impressions"])
    save_csv(args.out / "keyword-cannibalisation.csv", [row for item in snapshots for row in item[2]],
             ["property", "query", "intent", "competing_url", "preferred_path", *metric_fields, "action"])


if __name__ == "__main__":
    main()
