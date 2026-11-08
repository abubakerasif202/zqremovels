import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';

// Requires a completed `npm run build` (site-dist).
const HOST = 'https://zqremovalsadelaide.com.au';
const DIST = 'site-dist';
const vercel = JSON.parse(readFileSync('vercel.json', 'utf8'));
const toPath = (url) => url.replace(HOST, '').split('#')[0].split('?')[0];
const isPlain = (source) => !/[:*()]/.test(source);

const rules = vercel.redirects.filter((rule) => isPlain(rule.source));
const sources = new Set(rules.map((rule) => rule.source));

const builtExists = (p) => existsSync(path.join(DIST, p)) && (p.endsWith('/') ? existsSync(path.join(DIST, p, 'index.html')) : true);

function* htmlFiles(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* htmlFiles(full);
    else if (entry.name.endsWith('.html')) yield full;
  }
}

const robotsOf = (html) => html.match(/<meta[^>]+name=["']robots["'][^>]*content=["']([^"']+)/i)?.[1] || '';

// Search Console "Page with redirect" / "Redirect error" URLs reported 2026-11-09.
const REPORTED = [
  '/cheap-vs-fixed-price-removalists-adelaide/', '/adelaide-moving-guides/moving-with-stairs-adelaide/',
  '/fixed-price-vs-hourly-removalists-adelaide/', '/removalists-croydon/', '/apartment-removalists-queens-park/',
  '/services/local-removals-adelaide/', '/adelaide-moving-guides/removalist-cost-adelaide/',
  '/adelaide-moving-guides/moving-house-adelaide-checklist/', '/removalists-klemzig/', '/small-removals-adelaide/',
  '/fixed-price-removalists-adelaide/', '/apartment-removalists-adelaide-cbd/',
  '/adelaide-moving-guides/moving-heavy-furniture-adelaide/', '/removal-companies-adelaide/',
  '/office-removals-adelaide-cbd/', '/removalists-kings-park/', '/services/office-removals-adelaide/',
  '/removalists-seaton/', '/adelaide-moving-guides/packing-tips-adelaide/',
  '/adelaide-moving-guides/how-long-moves-take-adelaide/', '/adelaide-moving-guides/removalists-cost-adelaide-cbd/',
  '/removalists-glandore/', '/packing-services-burnside/', '/packing-services-henley-beach/', '/removalists-newton/',
  '/removalists-clarence-park/', '/adelaide-moving-guides/weekend-vs-weekday-moving-adelaide/',
  '/adelaide-moving-guides/how-much-do-removalists-cost-adelaide/',
];

test('every reported redirect is one permanent hop to a built page', () => {
  for (const source of REPORTED) {
    const matching = rules.filter((rule) => rule.source === source);
    assert.equal(matching.length, 1, `${source} must have exactly one rule`);
    assert.ok(matching[0].permanent === true || [301, 308].includes(matching[0].statusCode), `${source} must be permanent`);
    const destination = toPath(matching[0].destination);
    assert.notEqual(destination, source, `${source} loops`);
    assert.ok(!sources.has(destination), `${source} chains through ${destination}`);
    assert.ok(builtExists(destination), `${destination} is not built`);
  }
});

test('no plain redirect rule chains, loops, duplicates or targets a missing page', () => {
  const seen = new Set();
  for (const rule of rules) {
    assert.ok(!seen.has(rule.source), `duplicate rule for ${rule.source}`);
    seen.add(rule.source);
    const destination = toPath(rule.destination);
    assert.notEqual(destination, rule.source, `${rule.source} loops`);
    assert.ok(!sources.has(destination), `${rule.source} chains through ${destination}`);
    assert.ok(builtExists(destination), `${rule.source} -> ${destination} is not built`);
  }
});

test('sitemaps list only built, indexable, self-canonical, non-redirect pages', () => {
  for (const file of readdirSync(DIST).filter((name) => /sitemap.*\.xml$/.test(name))) {
    const xml = readFileSync(path.join(DIST, file), 'utf8');
    for (const [, loc] of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
      const p = toPath(loc);
      if (p.endsWith('.xml')) continue;
      assert.ok(!sources.has(p), `${file}: ${p} is a redirect source`);
      assert.ok(builtExists(p), `${file}: ${p} is not built`);
      const html = readFileSync(path.join(DIST, p, 'index.html'), 'utf8');
      assert.doesNotMatch(robotsOf(html), /noindex/i, `${file}: ${p} is noindex`);
      assert.match(html, new RegExp(`<link[^>]+rel="canonical"[^>]+href="${HOST}${p}"`), `${file}: ${p} is not self-canonical`);
    }
  }
});

test('llms files and ai-sitemap link to no redirect source', () => {
  for (const file of ['llms.txt', 'llms-full.txt', 'ai-sitemap.xml']) {
    const text = readFileSync(path.join(DIST, file), 'utf8');
    for (const [, p] of text.matchAll(/https:\/\/zqremovalsadelaide\.com\.au(\/[^\s)<>"']*)/g)) {
      assert.ok(!sources.has(p), `${file} links to redirect source ${p}`);
    }
  }
});

test('indexable pages link (href and JSON-LD) to no redirect source', () => {
  const offenders = [];
  for (const file of htmlFiles(DIST)) {
    const html = readFileSync(file, 'utf8');
    if (/http-equiv=["']refresh/i.test(html) || /noindex/i.test(robotsOf(html))) continue;
    const page = `/${path.relative(DIST, path.dirname(file)).replace(/\\/g, '/')}/`;
    for (const [, raw] of html.matchAll(/(?:href=["']|"url":\s*"|"@id":\s*"|"item":\s*")((?:https:\/\/zqremovalsadelaide\.com\.au)?\/[^"'#?]*)/g)) {
      const p = toPath(raw);
      const normalised = p.endsWith('/') || /\.[a-z0-9]+$/i.test(p) ? p : `${p}/`;
      if (sources.has(normalised)) offenders.push(`${page} -> ${normalised}`);
    }
  }
  assert.deepEqual(offenders, []);
});

test('noindex legal pages keep noindex and a self-canonical', () => {
  for (const p of ['/privacy-policy/', '/terms-and-conditions/']) {
    const html = readFileSync(path.join(DIST, p, 'index.html'), 'utf8');
    assert.match(robotsOf(html), /noindex/i);
    assert.match(html, new RegExp(`<link[^>]+rel="canonical"[^>]+href="${HOST}${p}"`));
  }
});
