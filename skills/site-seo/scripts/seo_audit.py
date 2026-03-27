#!/usr/bin/env python3
"""Audit static-site SEO signals for HTML pages, robots.txt, and sitemap.xml."""

from __future__ import annotations

import argparse
import json
import os
from collections import Counter, defaultdict
from dataclasses import asdict, dataclass, field
from html.parser import HTMLParser
from pathlib import Path
from typing import Any
from urllib.parse import urlparse
import xml.etree.ElementTree as ET


TITLE_MIN = 30
TITLE_MAX = 65
DESCRIPTION_MIN = 70
DESCRIPTION_MAX = 165
EXCLUDED_DIRS = {".git", ".netlify", "node_modules", "skills", "__pycache__"}


@dataclass
class Issue:
    severity: str
    message: str


@dataclass
class PageReport:
    file_path: str
    route: str
    lang: str | None = None
    title: str | None = None
    meta_description: str | None = None
    robots: str | None = None
    canonical: str | None = None
    og_title: str | None = None
    og_description: str | None = None
    og_url: str | None = None
    og_image: str | None = None
    twitter_card: str | None = None
    twitter_title: str | None = None
    twitter_description: str | None = None
    twitter_image: str | None = None
    h1_texts: list[str] = field(default_factory=list)
    json_ld_types: list[str] = field(default_factory=list)
    json_ld_invalid_blocks: int = 0
    image_count: int = 0
    images_missing_alt: int = 0
    issues: list[Issue] = field(default_factory=list)

    @property
    def is_indexable(self) -> bool:
        robots = (self.robots or "").lower()
        return "noindex" not in robots


class SeoHtmlParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.lang: str | None = None
        self.title: str | None = None
        self.meta: dict[str, str] = {}
        self.properties: dict[str, str] = {}
        self.canonical: str | None = None
        self.h1_texts: list[str] = []
        self.image_count = 0
        self.images_missing_alt = 0
        self._in_title = False
        self._in_h1 = False
        self._in_json_ld = False
        self._title_parts: list[str] = []
        self._h1_parts: list[str] = []
        self._json_ld_parts: list[str] = []
        self.json_ld_blocks: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attr_map = {key.lower(): (value or "") for key, value in attrs}
        tag = tag.lower()

        if tag == "html" and attr_map.get("lang"):
            self.lang = attr_map["lang"].strip() or None
        elif tag == "title":
            self._in_title = True
            self._title_parts = []
        elif tag == "meta":
            name = attr_map.get("name", "").strip().lower()
            prop = attr_map.get("property", "").strip().lower()
            content = attr_map.get("content", "").strip()
            if name:
                self.meta[name] = content
            if prop:
                self.properties[prop] = content
        elif tag == "link":
            rel = attr_map.get("rel", "").strip().lower().split()
            href = attr_map.get("href", "").strip()
            if "canonical" in rel and href and not self.canonical:
                self.canonical = href
        elif tag == "h1":
            self._in_h1 = True
            self._h1_parts = []
        elif tag == "script":
            script_type = attr_map.get("type", "").strip().lower()
            if script_type == "application/ld+json":
                self._in_json_ld = True
                self._json_ld_parts = []
        elif tag == "img":
            self.image_count += 1
            alt = attr_map.get("alt")
            if alt is None or not alt.strip():
                self.images_missing_alt += 1

    def handle_endtag(self, tag: str) -> None:
        tag = tag.lower()
        if tag == "title" and self._in_title:
            title = " ".join(part.strip() for part in self._title_parts if part.strip()).strip()
            self.title = title or None
            self._in_title = False
        elif tag == "h1" and self._in_h1:
            h1_text = " ".join(part.strip() for part in self._h1_parts if part.strip()).strip()
            if h1_text:
                self.h1_texts.append(h1_text)
            self._in_h1 = False
        elif tag == "script" and self._in_json_ld:
            payload = "".join(self._json_ld_parts).strip()
            if payload:
                self.json_ld_blocks.append(payload)
            self._in_json_ld = False

    def handle_data(self, data: str) -> None:
        if self._in_title:
            self._title_parts.append(data)
        if self._in_h1:
            self._h1_parts.append(data)
        if self._in_json_ld:
            self._json_ld_parts.append(data)


def normalize_route(relative_path: Path) -> str:
    normalized = relative_path.as_posix()
    if normalized == "index.html":
        return "/"
    if normalized.endswith("/index.html"):
        return f"/{normalized[:-len('index.html')]}"
    return f"/{normalized}"


def load_page(site_root: Path, html_file: Path) -> PageReport:
    parser = SeoHtmlParser()
    raw = html_file.read_text(encoding="utf-8")
    parser.feed(raw)

    relative = html_file.relative_to(site_root)
    report = PageReport(
        file_path=str(relative.as_posix()),
        route=normalize_route(relative),
        lang=parser.lang,
        title=parser.title,
        meta_description=parser.meta.get("description"),
        robots=parser.meta.get("robots"),
        canonical=parser.canonical,
        og_title=parser.properties.get("og:title"),
        og_description=parser.properties.get("og:description"),
        og_url=parser.properties.get("og:url"),
        og_image=parser.properties.get("og:image"),
        twitter_card=parser.meta.get("twitter:card") or parser.properties.get("twitter:card"),
        twitter_title=parser.meta.get("twitter:title") or parser.properties.get("twitter:title"),
        twitter_description=parser.meta.get("twitter:description")
        or parser.properties.get("twitter:description"),
        twitter_image=parser.meta.get("twitter:image") or parser.properties.get("twitter:image"),
        h1_texts=parser.h1_texts,
        image_count=parser.image_count,
        images_missing_alt=parser.images_missing_alt,
    )

    for block in parser.json_ld_blocks:
        try:
            payload = json.loads(block)
        except json.JSONDecodeError:
            report.json_ld_invalid_blocks += 1
            continue
        report.json_ld_types.extend(sorted(extract_json_ld_types(payload)))

    evaluate_page(report)
    return report


def evaluate_page(report: PageReport) -> None:
    add_if_missing(report, report.title, "high", "Missing <title>.")
    add_if_missing(report, report.meta_description, "high", "Missing meta description.")
    add_if_missing(report, report.canonical, "high", "Missing canonical link.")
    add_if_missing(report, report.lang, "medium", "Missing html lang attribute.")

    if not report.h1_texts:
        report.issues.append(Issue("high", "Missing H1 heading."))
    elif len(report.h1_texts) > 1:
        report.issues.append(Issue("medium", f"Multiple H1 headings found ({len(report.h1_texts)})."))

    if report.title:
        title_length = len(report.title.strip())
        if title_length < TITLE_MIN or title_length > TITLE_MAX:
            report.issues.append(
                Issue(
                    "low",
                    f"Title length is {title_length} characters; target roughly {TITLE_MIN}-{TITLE_MAX}.",
                )
            )

    if report.meta_description:
        description_length = len(report.meta_description.strip())
        if description_length < DESCRIPTION_MIN or description_length > DESCRIPTION_MAX:
            report.issues.append(
                Issue(
                    "low",
                    "Meta description length is "
                    f"{description_length} characters; target roughly {DESCRIPTION_MIN}-{DESCRIPTION_MAX}.",
                )
            )

    if report.canonical and not is_absolute_url(report.canonical):
        report.issues.append(Issue("medium", "Canonical URL is not absolute."))

    og_fields = {
        "og:title": report.og_title,
        "og:description": report.og_description,
        "og:url": report.og_url,
        "og:image": report.og_image,
    }
    for field_name, value in og_fields.items():
        if not value:
            report.issues.append(Issue("medium", f"Missing {field_name} meta tag."))

    twitter_fields = {
        "twitter:card": report.twitter_card,
        "twitter:title": report.twitter_title,
        "twitter:description": report.twitter_description,
        "twitter:image": report.twitter_image,
    }
    for field_name, value in twitter_fields.items():
        if not value:
            report.issues.append(Issue("medium", f"Missing {field_name} meta tag."))

    if not report.json_ld_types and report.json_ld_invalid_blocks == 0:
        report.issues.append(Issue("low", "Missing JSON-LD structured data."))
    if report.json_ld_invalid_blocks:
        report.issues.append(
            Issue("high", f"Found {report.json_ld_invalid_blocks} invalid JSON-LD block(s).")
        )

    if report.image_count and report.images_missing_alt:
        report.issues.append(
            Issue(
                "low",
                f"{report.images_missing_alt} of {report.image_count} image(s) are missing alt text.",
            )
        )


def add_if_missing(report: PageReport, value: str | None, severity: str, message: str) -> None:
    if not value or not value.strip():
        report.issues.append(Issue(severity, message))


def extract_json_ld_types(payload: Any) -> set[str]:
    found: set[str] = set()

    def visit(node: Any) -> None:
        if isinstance(node, list):
            for item in node:
                visit(item)
            return
        if not isinstance(node, dict):
            return

        json_type = node.get("@type")
        if isinstance(json_type, str):
            found.add(json_type)
        elif isinstance(json_type, list):
            found.update(item for item in json_type if isinstance(item, str))

        for child in node.values():
            visit(child)

    visit(payload)
    return found


def is_absolute_url(value: str) -> bool:
    parsed = urlparse(value)
    return bool(parsed.scheme and parsed.netloc)


def discover_html_files(site_root: Path) -> list[Path]:
    discovered: list[Path] = []
    for root, dirs, files in os.walk(site_root):
        dirs[:] = [name for name in dirs if name not in EXCLUDED_DIRS and not name.startswith(".")]
        for file_name in files:
            if file_name.lower().endswith(".html"):
                discovered.append(Path(root, file_name))
    return sorted(discovered)


def parse_sitemap(site_root: Path) -> tuple[set[str], list[Issue]]:
    sitemap_path = site_root / "sitemap.xml"
    if not sitemap_path.exists():
        return set(), [Issue("high", "Missing sitemap.xml at site root.")]

    try:
        tree = ET.parse(sitemap_path)
    except ET.ParseError as exc:
        return set(), [Issue("high", f"Invalid sitemap.xml: {exc}.")]

    namespace = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    urls = {
        loc.text.strip()
        for loc in tree.findall(".//sm:url/sm:loc", namespace)
        if loc.text and loc.text.strip()
    }
    if not urls:
        return set(), [Issue("high", "sitemap.xml does not contain any <loc> entries.")]
    return urls, []


def parse_robots(site_root: Path) -> tuple[list[str], list[Issue]]:
    robots_path = site_root / "robots.txt"
    if not robots_path.exists():
        return [], [Issue("high", "Missing robots.txt at site root.")]

    sitemap_urls: list[str] = []
    for raw_line in robots_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        if line.lower().startswith("sitemap:"):
            sitemap_urls.append(line.split(":", 1)[1].strip())

    issues: list[Issue] = []
    if not sitemap_urls:
        issues.append(Issue("medium", "robots.txt does not declare a sitemap URL."))

    return sitemap_urls, issues


def collect_site_issues(pages: list[PageReport], sitemap_urls: set[str]) -> list[Issue]:
    issues: list[Issue] = []
    indexable_pages = [page for page in pages if page.is_indexable]

    title_map = defaultdict(list)
    description_map = defaultdict(list)
    canonical_map = defaultdict(list)

    for page in indexable_pages:
        if page.title:
            title_map[page.title.strip()].append(page.file_path)
        if page.meta_description:
            description_map[page.meta_description.strip()].append(page.file_path)
        if page.canonical:
            canonical_map[page.canonical.strip()].append(page.file_path)

    issues.extend(build_duplicate_issues("title", title_map, "medium"))
    issues.extend(build_duplicate_issues("meta description", description_map, "medium"))
    issues.extend(build_duplicate_issues("canonical", canonical_map, "high"))

    canonical_hosts = {urlparse(page.canonical).netloc for page in indexable_pages if page.canonical and is_absolute_url(page.canonical)}
    sitemap_hosts = {urlparse(url).netloc for url in sitemap_urls if is_absolute_url(url)}
    combined_hosts = {host for host in canonical_hosts | sitemap_hosts if host}
    if len(combined_hosts) > 1:
        issues.append(Issue("high", f"Multiple production hosts detected: {', '.join(sorted(combined_hosts))}."))

    canonical_urls = {page.canonical for page in indexable_pages if page.canonical}
    if sitemap_urls:
        missing_from_sitemap = sorted(
            page.file_path
            for page in indexable_pages
            if page.canonical and is_absolute_url(page.canonical) and page.canonical not in sitemap_urls
        )
        for file_path in missing_from_sitemap:
            issues.append(Issue("medium", f"{file_path} canonical URL is missing from sitemap.xml."))

        for page in pages:
            if not page.is_indexable and page.canonical and page.canonical in sitemap_urls:
                issues.append(Issue("high", f"{page.file_path} is noindex but its canonical URL is present in sitemap.xml."))

        unmapped_sitemap_urls = sorted(url for url in sitemap_urls if url not in canonical_urls)
        for url in unmapped_sitemap_urls:
            issues.append(Issue("low", f"sitemap.xml contains {url} but no matching canonical URL was found in scanned pages."))

    return issues


def build_duplicate_issues(label: str, value_map: dict[str, list[str]], severity: str) -> list[Issue]:
    duplicates: list[Issue] = []
    for value, file_paths in value_map.items():
        if len(file_paths) > 1:
            duplicates.append(
                Issue(
                    severity,
                    f"Duplicate {label} used by {', '.join(sorted(file_paths))}: {value}",
                )
            )
    return duplicates


def summarize_issues(page_issues: list[Issue], site_issues: list[Issue]) -> dict[str, int]:
    counts = Counter(issue.severity for issue in [*page_issues, *site_issues])
    return {severity: counts.get(severity, 0) for severity in ("high", "medium", "low")}


def format_text_report(
    site_root: Path,
    pages: list[PageReport],
    robots_sitemaps: list[str],
    sitemap_urls: set[str],
    robots_issues: list[Issue],
    sitemap_issues: list[Issue],
    site_issues: list[Issue],
) -> str:
    page_issues = [
        Issue(issue.severity, f"{page.file_path}: {issue.message}")
        for page in pages
        for issue in page.issues
    ]
    summary = summarize_issues(page_issues, [*robots_issues, *sitemap_issues, *site_issues])

    lines = [
        f"SEO audit for {site_root}",
        f"Pages scanned: {len(pages)}",
        f"robots.txt sitemap declarations: {len(robots_sitemaps)}",
        f"sitemap.xml URLs: {len(sitemap_urls)}",
        f"Issue counts: high={summary['high']} medium={summary['medium']} low={summary['low']}",
        "",
    ]

    all_site_issues = [*robots_issues, *sitemap_issues, *site_issues]
    for severity in ("high", "medium", "low"):
        severity_items = [
            issue.message
            for issue in [*all_site_issues, *page_issues]
            if issue.severity == severity
        ]
        if not severity_items:
            continue
        lines.append(f"{severity.upper()} ISSUES")
        for message in severity_items:
            lines.append(f"- {message}")
        lines.append("")

    lines.append("PAGE SUMMARY")
    for page in pages:
        lines.append(
            f"- {page.file_path}: title={'yes' if page.title else 'no'}, "
            f"description={'yes' if page.meta_description else 'no'}, "
            f"canonical={'yes' if page.canonical else 'no'}, "
            f"h1={len(page.h1_texts)}, "
            f"jsonld={len(page.json_ld_types)}, "
            f"issues={len(page.issues)}"
        )

    return "\n".join(lines)


def build_json_report(
    site_root: Path,
    pages: list[PageReport],
    robots_sitemaps: list[str],
    sitemap_urls: set[str],
    robots_issues: list[Issue],
    sitemap_issues: list[Issue],
    site_issues: list[Issue],
) -> dict[str, Any]:
    return {
        "site_root": str(site_root),
        "robots_sitemaps": robots_sitemaps,
        "sitemap_urls": sorted(sitemap_urls),
        "robots_issues": [asdict(issue) for issue in robots_issues],
        "sitemap_issues": [asdict(issue) for issue in sitemap_issues],
        "site_issues": [asdict(issue) for issue in site_issues],
        "pages": [
            {
                **asdict(page),
                "issues": [asdict(issue) for issue in page.issues],
            }
            for page in pages
        ],
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Audit SEO signals for a static site.")
    parser.add_argument("site_root", nargs="?", default=".", help="Site root to scan. Defaults to current directory.")
    parser.add_argument("--json", action="store_true", dest="emit_json", help="Emit JSON instead of text.")
    args = parser.parse_args()

    site_root = Path(args.site_root).resolve()
    if not site_root.exists():
        parser.error(f"Site root does not exist: {site_root}")

    html_files = discover_html_files(site_root)
    pages = [load_page(site_root, html_file) for html_file in html_files]

    robots_sitemaps, robots_issues = parse_robots(site_root)
    sitemap_urls, sitemap_issues = parse_sitemap(site_root)
    site_issues = collect_site_issues(pages, sitemap_urls)

    if args.emit_json:
        print(
            json.dumps(
                build_json_report(
                    site_root,
                    pages,
                    robots_sitemaps,
                    sitemap_urls,
                    robots_issues,
                    sitemap_issues,
                    site_issues,
                ),
                indent=2,
            )
        )
    else:
        print(
            format_text_report(
                site_root,
                pages,
                robots_sitemaps,
                sitemap_urls,
                robots_issues,
                sitemap_issues,
                site_issues,
            )
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
