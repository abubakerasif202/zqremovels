"""Validate generated canonical-host hygiene without changing source or output."""
from html.parser import HTMLParser
from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parent.parent
ORIGIN = 'https://zqremovalsadelaide.com.au'


class Head(HTMLParser):
    def __init__(self):
        super().__init__()
        self.canonicals, self.og_urls = [], []
        self.redirect = False

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'link' and attrs.get('rel') == 'canonical':
            self.canonicals.append(attrs.get('href', ''))
        if tag == 'meta' and attrs.get('property') == 'og:url':
            self.og_urls.append(attrs.get('content', ''))
        if tag == 'meta' and attrs.get('http-equiv', '').lower() == 'refresh':
            self.redirect = True


errors, redirects, pages = [], [], []
for file in sorted((ROOT / 'site-dist').rglob('*.html')):
    html = file.read_text(encoding='utf-8')
    relative = file.relative_to(ROOT / 'site-dist').as_posix()
    parser = Head()
    parser.feed(html)
    if re.search(r'https?://(?:www\.)?zqremovals\.au(?:[/"\s<#?]|$)', html):
        errors.append(f'{relative}: old-domain URL in generated HTML')
    for match in re.finditer(r'<script\b[^>]*type=["\']application/ld\+json["\'][^>]*>([\s\S]*?)</script>', html, re.I):
        try:
            json.loads(match.group(1))
        except json.JSONDecodeError:
            errors.append(f'{relative}: invalid JSON-LD')
    if len(parser.canonicals) != 1 or not parser.canonicals[0].startswith(ORIGIN + '/'):
        errors.append(f'{relative}: missing/duplicate/noncanonical canonical')
    if parser.redirect:
        redirects.append(relative)
        # Redirect stubs must canonicalize the destination, not themselves.
        if not re.search(r'name="robots" content="[^"]*noindex', html, re.I):
            errors.append(f'{relative}: redirect stub must be noindex')
        continue
    expected = ORIGIN + ('/' + relative.removesuffix('index.html') if relative != '404.html' else '/404.html')
    if parser.canonicals != [expected]:
        errors.append(f'{relative}: canonical {parser.canonicals} != {expected}')
    if parser.og_urls != [expected]:
        errors.append(f'{relative}: og:url {parser.og_urls} != {expected}')
    pages.append(relative)
for file in [*(ROOT / 'site-dist').glob('*.xml'), ROOT / 'site-dist/robots.txt']:
    text = file.read_text(encoding='utf-8')
    if re.search(r'https?://(?:www\.)?zqremovals\.au(?:[/"\s<#?]|$)', text):
        errors.append(f'{file.name}: unexpected old-domain URL')
report = {'source': 'local production build', 'renderedNonRedirectPages': len(pages), 'redirectStubs': len(redirects), 'errors': errors,
          'notes': ['Redirect-only HTML stubs use their destination canonical and noindex; self-canonical applies to actual content pages.',
                    'The host-restricted legacy sitemap is a function response, not a file in the new-domain sitemap or static output.']}
(ROOT / 'docs/migration-hygiene-audit.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report, indent=2))
raise SystemExit(bool(errors))
