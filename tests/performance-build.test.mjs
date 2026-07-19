import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();
const dist = path.join(root, 'site-dist');

async function readDist(relativePath) {
  return readFile(path.join(dist, relativePath), 'utf8');
}

test('generated pages use route-scoped, content-versioned stylesheets', async () => {
  const home = await readDist('index.html');
  const contact = await readDist(path.join('contact-us', 'index.html'));
  const general = await readDist(path.join('removalists-adelaide', 'index.html'));

  assert.match(home, /href="\/premium-home\.min\.css\?v=[a-f0-9]{12}"/);
  assert.match(contact, /href="\/premium-contact\.min\.css\?v=[a-f0-9]{12}"/);
  assert.match(general, /href="\/premium-site\.min\.css\?v=[a-f0-9]{12}"/);

  for (const html of [home, contact, general]) {
    assert.match(html, /src="\/site\.js\?v=[a-f0-9]{12}"/);
    assert.doesNotMatch(html, /data-critical="homepage"/);
  }
});

test('performance bundles are smaller than their source inputs', async () => {
  const sourceCssBytes = (await stat(path.join(root, 'premium-site.css'))).size;
  const sourceScriptBytes = (await stat(path.join(root, 'site.js'))).size;
  const homeCssBytes = (await stat(path.join(dist, 'premium-home.min.css'))).size;
  const contactCssBytes = (await stat(path.join(dist, 'premium-contact.min.css'))).size;
  const generalCssBytes = (await stat(path.join(dist, 'premium-site.min.css'))).size;
  const builtScriptBytes = (await stat(path.join(dist, 'site.js'))).size;

  assert.ok(homeCssBytes < sourceCssBytes * 0.45, 'homepage CSS should remove legacy route styles');
  assert.ok(contactCssBytes < sourceCssBytes * 0.45, 'contact CSS should remove unrelated route styles');
  assert.ok(generalCssBytes < sourceCssBytes * 0.8, 'general CSS should remove inactive homepage layers');
  assert.ok(builtScriptBytes < sourceScriptBytes * 0.85, 'site.js should be minified');
});

test('purged bundles retain critical shared and route-specific selectors', async () => {
  const homeCss = await readDist('premium-home.min.css');
  const contactCss = await readDist('premium-contact.min.css');
  const generalCss = await readDist('premium-site.min.css');

  for (const css of [homeCss, contactCss, generalCss]) {
    assert.match(css, /\.site-header/);
    assert.match(css, /\.sticky-mobile-cta/);
    assert.match(css, /\.is-visible/);
  }

  assert.match(homeCss, /\.zq-v2-hero/);
  assert.match(homeCss, /\.zq-v2-short-form/);
  assert.match(contactCss, /\.contact-hero-grid/);
  assert.match(contactCss, /\.quote-form-premium/);
  assert.match(generalCss, /\.page-hero/);
  assert.match(generalCss, /\.service-card/);
});
