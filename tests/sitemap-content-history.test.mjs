import test from 'node:test';
import assert from 'node:assert/strict';
import { meaningfulContentHash, resolveContentLastmod } from '../scripts/sitemap-content-history.mjs';
const url = 'https://zqremovalsadelaide.com.au/example/';
const html = '<title>Moving advice</title><main class="old"><h1>Plan a move</h1><p>Pack carefully.</p><a href="/contact-us/">Quote</a></main>';
const history = { pages: { [url]: { hash: meaningfulContentHash(html), lastmod: '2026-09-28' } } };

test('persistent dates survive rebuilds without Git or a build clock', () => {
  assert.equal(resolveContentLastmod(JSON.parse(JSON.stringify(history)), url, html), '2026-09-28');
  assert.equal(resolveContentLastmod(history, url, html.replace('class="old"', 'class="new" data-build="other"')), '2026-09-28');
  assert.equal(resolveContentLastmod(history, url, html + '<script src="/site.js?v=new-build"></script>'), '2026-09-28');
});
test('meaningful copy, link, metadata and structured data changes require a reviewed date', () => {
  for (const changed of [html.replace('Pack carefully.', 'Plan access.'), html.replace('/contact-us/', '/packing-services-adelaide/'), html.replace('Moving advice', 'Packing advice'), html + '<script type="application/ld+json">{"@type":"Service","name":"Packing"}</script>']) {
    assert.equal(resolveContentLastmod(history, url, changed), undefined);
  }
});
test('unknown dates and missing history are omitted instead of using today', () => {
  assert.equal(resolveContentLastmod({}, url, html), undefined);
  assert.equal(resolveContentLastmod({ pages: { [url]: { hash: meaningfulContentHash(html) } } }, url, html), undefined);
  assert.throws(() => meaningfulContentHash('<header>No main</header>'), /without main/);
});

test('content fingerprint ignores comments and scripts even when nested markers are spliced together', () => {
  const base = '<html><head><title>T</title></head><body><main><p>Same</p>MARK</main></body></html>';
  const plain = meaningfulContentHash(base.replace('MARK', ''));
  assert.equal(meaningfulContentHash(base.replace('MARK', '<!--x-->')), plain);
  assert.equal(meaningfulContentHash(base.replace('MARK', '<!<!---->--><script>alert(1)</script>')), meaningfulContentHash(base.replace('MARK', '<!<!---->-->')));
  assert.equal(meaningfulContentHash(base.replace('MARK', '<SCRIPT>1</SCRIPT><style>a{}</style>')), plain);
  assert.notEqual(meaningfulContentHash(base.replace('Same', 'Changed')), plain);
  assert.match(plain, /^c1:[0-9a-f]{14}-[0-9a-f]+$/);
});
