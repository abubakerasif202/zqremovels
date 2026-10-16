"""Measure rendered main content; recommendations never modify indexability or routes."""
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parent.parent
ORIGIN = 'https://zqremovalsadelaide.com.au'
SKIP = {'script', 'style', 'noscript', 'nav', 'header', 'footer', 'form'}
VOID = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'}


class MainText(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack = []
        self.parts = []
        self.headings = []
        self.canonical = ''
        self.robots = ''
        self.is_suburb = False

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'body':
            self.is_suburb = 'page-suburb' in attrs.get('class', '').split()
        if tag == 'link' and attrs.get('rel') == 'canonical':
            self.canonical = attrs.get('href', '')
        if tag == 'meta' and attrs.get('name') == 'robots':
            self.robots = attrs.get('content', '')
        if tag not in VOID:
            self.stack.append(tag)

    def handle_endtag(self, tag):
        if tag in self.stack:
            del self.stack[len(self.stack) - 1 - self.stack[::-1].index(tag):]

    def handle_data(self, data):
        if 'main' not in self.stack or any(tag in SKIP for tag in self.stack):
            return
        value = re.sub(r'\s+', ' ', data).strip()
        if value:
            self.parts.append(value)
            if self.stack[-1] in {'h1', 'h2', 'h3'}:
                self.headings.append(value)


def tokens(text):
    return re.findall(r"[a-z0-9]+(?:['’-][a-z0-9]+)*", text.lower())


live = json.loads((ROOT / 'docs/legacy-redirect-live-audit.json').read_text())['records']
legacy = {row['source'].removeprefix('https://zqremovals.au'): row for row in live}
requested = [
    '/removalists-goodwood/', '/removalists-adelaide-cbd/', '/removalists-burnside/',
    '/removalists-campbelltown/', '/removalists-christies-beach/', '/removalists-grange/',
    '/removalists-southern-adelaide/', '/removalists-valley-view/', '/cheap-removalists-adelaide/',
    *['/adelaide-moving-guides/' + slug + '/' for slug in [
        'how-to-prepare-furniture-for-moving', 'apartment-loading-zone-guide-adelaide',
        'apartment-moving-tips-adelaide', 'booking-timing-guide-adelaide',
        'cheap-vs-fixed-price-removalists-adelaide', 'downsizing-move-adelaide']],
]
current = {}
for file in sorted((ROOT / 'site-dist').rglob('*.html')):
    parser = MainText()
    parser.feed(file.read_text(encoding='utf-8'))
    if not parser.parts or not parser.canonical.startswith(ORIGIN):
        continue
    path = '/' + file.relative_to(ROOT / 'site-dist').as_posix().removesuffix('index.html')
    if path == parser.canonical.removeprefix(ORIGIN):
        current[path] = {'parser': parser, 'text': ' '.join(parser.parts), 'file': str(file.relative_to(ROOT))}
hub_paths = {'/removalists-adelaide/', '/removalists-adelaide-prices/', '/removalists-adelaide-hills/', '/removalists-northern-adelaide/', '/removalists-southern-adelaide/'}
suburbs = {path: page for path, page in current.items() if page['parser'].is_suburb and path not in hub_paths}
# Replace only page-place tokens, leaving access/logistics detail intact. No claims
# are inferred from suburb names, GSC labels or word-count thresholds.
normalised = {}
for path, page in suburbs.items():
    name = path.strip('/').removeprefix('removalists-').replace('-', ' ')
    normalised[path] = tokens(re.sub(re.escape(name), ' '.join(['PLACE'] * len(tokens(name))), page['text'], flags=re.I))
frequency = Counter()
for words in normalised.values():
    frequency.update(set(tuple(words[i:i + 7]) for i in range(max(0, len(words) - 6))))


def metrics(path):
    page = current[path]
    words = normalised.get(path, tokens(page['text']))
    shared = set()
    for i in range(max(0, len(words) - 6)):
        if frequency[tuple(words[i:i + 7])] >= 3:
            shared.update(range(i, i + 7))
    total = len(words)
    return total, len(set(tokens(page['text']))), len(shared), total - len(shared), round(100 * len(shared) / max(1, total), 1)


def recommendation(path):
    total, distinct, shared, unique, ratio = metrics(path)
    # Indexable regional/service/guide destinations carry broader intent and are
    # reviewed separately from suburb-node differentiation.
    if path not in suburbs:
        return 'keep & enrich', 'Retained hub/service/guide intent; improve the specific planning answer and links rather than infer thinness from indexing status.'
    if 'noindex' in current[path]['parser'].robots:
        return 'noindex', 'Already noindex; review the access material before deciding whether it merits indexing. No setting changed.'
    editorial_keep = {
        '/removalists-adelaide-cbd/': 'The existing city page has a lift-window, tower/loading-dock and handover workflow that differs from general suburban moves. Keep that intent and expand verified access detail despite repeated template wording.',
        '/removalists-goodwood/': 'The existing rail-corridor/shared-access angle is more specific than generic house-and-unit copy. Keep and replace repeated blocks with a verified move-brief checklist.',
        '/removalists-burnside/': 'The page identifies heritage-home access and protection as its handling brief. Keep provisionally and substantiate that brief with owner-verified examples instead of repeating the eastern-suburbs template.',
        '/removalists-grange/': 'The coastal parking and apartment-entry brief is relevant to loading preparation. Keep provisionally; expand verifiable loading constraints and remove generic metro filler.',
    }
    if path in editorial_keep:
        return 'keep & enrich', editorial_keep[path]
    if unique < 150 and ratio > 75:
        north = any(term in path for term in ['elizabeth', 'salisbury', 'munno-para', 'gawler', 'andrews-farm', 'modbury', 'golden-grove'])
        headings = ' '.join(current[path]['parser'].headings).lower()
        south = 'inner south access checks' in headings or 'southern access checks' in headings
        target = '/removalists-northern-adelaide/' if north else '/removalists-southern-adelaide/' if south else '/removalists-adelaide/'
        return 'merge into a regional page', f'{unique} unshared words and {ratio}% shared wording; consolidate useful access details into {target} only after owner review.'
    return 'keep & enrich', f'{unique} unshared words; existing access/logistics sections provide a distinct brief. Enrich verifiable loading, inventory or timing detail; do not pad repeated template copy.'


rows = []
for path in sorted(suburbs):
    group, reason = recommendation(path)
    rows.append({'path': path, 'scope': 'current suburb', 'group': group, 'reason': reason, 'metrics': metrics(path), 'headings': current[path]['parser'].headings})
for path in requested:
    destination = legacy[path]['finalUrl'].removeprefix(ORIGIN)
    if destination not in current:
        rows.append({'path': path, 'scope': 'GSC-listed', 'group': 'noindex', 'reason': 'No rendered current equivalent found; manual routing review required. No indexability change applied.', 'metrics': None, 'headings': []})
    elif not any(row['path'] == destination for row in rows):
        group, reason = recommendation(destination)
        rows.append({'path': destination, 'scope': 'GSC-listed equivalent', 'group': group, 'reason': reason, 'metrics': metrics(destination), 'headings': current[destination]['parser'].headings})

lines = ['# Thin-content audit — report only', '',
    'Measured from the local production build. No pages were deleted, merged, renamed or newly noindexed.', '',
    '## Method', '',
    f'- Scope: all {len(suburbs)} rendered locality pages marked `page-suburb` (excluding regional hubs, the Adelaide hub and the pricing page), plus the current destinations of all 15 supplied GSC examples.',
    '- Text is taken from `<main>`; scripts, styles, navigation, header/footer, forms and their customer inputs are excluded. Shared main-content CTA and planning sections remain in the count so template inflation is visible.',
    '- Total words = token occurrences. Distinct words = vocabulary size. Shared words = token positions covered by a seven-word sequence found on at least three current suburb pages, after replacing each word in the page’s own suburb name with PLACE (preserving token counts). Unshared words = positions not covered by those recurring sequences. This is a reproducible proxy, not proof that every remaining sentence is useful or factually unique.',
    '- Shared-text percentage can include useful repeated advice. No minimum word count is a Google indexing requirement. The GSC label alone does not prove thin content or establish the cause of the reported traffic decline.',
    '- Recommendations combine the measured repetition with the visible headings/access material listed below. CBD, Goodwood, Burnside and Grange receive explicit editorial retention decisions for their existing handling angles; merge recommendations are candidates for owner review, not an automatic word-count rule. They require owner approval and do not override existing consolidation decisions.', '',
    '## The 15 GSC examples and their actual current destinations', '',
    '| Original path | Live destination | Interpretation |', '| --- | --- | --- |']
for path in requested:
    destination = legacy[path]['finalUrl'].removeprefix(ORIGIN)
    interpretation = 'Same route retained' if destination == path else 'Already consolidated; destination is broader and is not a one-to-one equivalent'
    lines.append(f'| {path} | {destination} | {interpretation} |')
for group in ['keep & enrich', 'merge into a regional page', 'noindex']:
    chosen = [row for row in rows if row['group'] == group]
    lines += ['', f'## {group}', '']
    if not chosen:
        lines.append('No current measured page warrants this recommendation on the available content evidence. Existing redirect-only aliases stay outside the new-domain sitemap; this report proposes no new noindex directives.')
        continue
    lines += ['| Current path | Total words | Distinct words | Shared words | Unshared words | Shared % | Reason |', '| --- | ---: | ---: | ---: | ---: | ---: | --- |']
    for row in chosen:
        values = row['metrics'] or ['N/A'] * 5
        lines.append('| ' + ' | '.join(map(str, [row['path'], *values, row['reason']])) + ' |')
lines += ['', '## Content evidence by page', '']
for row in rows:
    lines += [f"### {row['path']}", '', 'Visible planning headings: ' + '; '.join(row['headings'][:15]) + '.', '']
    if row['path'] in current:
        # Show actual content evidence, including duplicated sections, without inventing logistics.
        page_text = current[row['path']]['text']
        lines += ['Opening content excerpt: ' + page_text[:650] + '…', '']
lines += ['## Scope limits', '',
    'Historical merged suburb aliases do not have a current standalone body to measure. They are listed individually with their actual destinations and equivalence assessments in `redirect-audit.csv`; recreating them would require a separate owner decision and differentiated operational content. Generated redirect stubs, utilities and demo pages are not counted as current suburb landing pages. Regional hub destinations are measured once and cross-referenced for each GSC source.', '',
    'No owner-confirmation placeholders were introduced. Recommendations about adding local operational detail are editorial tasks, not assertions that particular parking, building or equipment arrangements exist.']
(ROOT / 'thin-content-report.md').write_text('\n'.join(lines) + '\n', encoding='utf-8')
(ROOT / 'docs/thin-content-metrics.json').write_text(json.dumps({'suburbPageCount': len(suburbs), 'pages': rows}, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'suburbs': len(suburbs), 'measured': len(rows), 'recommendations': dict(Counter(row['group'] for row in rows))}))
