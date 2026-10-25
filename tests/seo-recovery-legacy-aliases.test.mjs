import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const redirects = JSON.parse(readFileSync(new URL('vercel.json', root), 'utf8')).redirects;
const origin = 'https://zqremovalsadelaide.com.au';
const migratedGuides = new Map([
  ['/guides/moving-house-adelaide-checklist/', '/adelaide-moving-guides/moving-house-checklist-adelaide/'],
  ['/guides/best-time-to-book-removalists-adelaide/', '/adelaide-moving-guides/best-time-to-book-removalists-adelaide/'],
  ['/guides/apartment-moving-tips-adelaide/', '/adelaide-moving-guides/apartment-moving-tips-adelaide/'],
]);

test('historical GSC guide URLs have permanent, relevant, indexable destinations', () => {
  const sitemapFiles = [
    'sitemap-pages.xml',
    'sitemap-services.xml',
    'sitemap-suburbs.xml',
    'sitemap-guides.xml',
  ];
  const urls = new Set(sitemapFiles.flatMap((file) =>
    [...readFileSync(new URL('site-dist/' + file, root), 'utf8').matchAll(/<loc>(https:\/\/[^<]+)<\/loc>/g)]
      .map((match) => match[1]),
  ));
  for (const [source, target] of migratedGuides) {
    const matching = redirects.filter((rule) => rule.source === source);
    assert.equal(matching.length, 1, 'single redirect for ' + source);
    assert.equal(matching[0].permanent, true, source + ' permanent');
    assert.equal(matching[0].destination, origin + target, source + ' matching intent');
    assert.ok(urls.has(origin + target), target + ' must be canonical and indexable');
    assert.equal(urls.has(origin + source), false, source + ' must not be indexed');
  }

  const catchAllIndex = redirects.findIndex((rule) =>
    rule.has?.some((condition) => condition.type === 'host' && /^(?:www\.)?zqremovals\.au$/.test(condition.value || '')) &&
    rule.destination === 'https://zqremovalsadelaide.com.au/:path',
  );
  assert.notEqual(catchAllIndex, -1, 'legacy host same-path migration rule exists');
  for (const source of migratedGuides.keys()) {
    const exactIndex = redirects.findIndex((rule) => rule.source === source);
    assert.ok(exactIndex < catchAllIndex, `${source} must precede the host catch-all redirect`);
  }
});
