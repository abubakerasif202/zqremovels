import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const handler = require('../api/legacy-sitemap.js');
const config = JSON.parse(readFileSync('vercel.json', 'utf8'));
const paths = readFileSync('data/migration/legacy-paths.txt', 'utf8').trim().split(/\r?\n/);

function invoke(host, method = 'GET') {
  const res = { headers: {}, statusCode: 0, body: '', setHeader(key, value) { this.headers[key] = value; }, end(value = '') { this.body = value; } };
  handler({ method, headers: { host } }, res);
  return res;
}

test('legacy sitemap exposes exactly the supplied inventory only on old hosts', () => {
  assert.equal(paths.length, 224);
  assert.equal(new Set(paths).size, 224);
  for (const host of ['zqremovals.au', 'www.zqremovals.au']) {
    const res = invoke(host);
    assert.equal(res.statusCode, 200);
    assert.match(res.headers['Content-Type'], /^application\/xml/);
    assert.deepEqual([...res.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]), paths.map(path => `https://zqremovals.au${path}`));
    assert.equal(invoke(host, 'HEAD').body, '');
    assert.equal(invoke(host, 'POST').statusCode, 405);
  }
  for (const host of ['zqremovalsadelaide.com.au', 'www.zqremovalsadelaide.com.au', 'untrusted.example', '']) {
    assert.equal(invoke(host).statusCode, 404);
    assert.doesNotMatch(invoke(host).body, /<loc>/);
  }
});

test('host catch-alls exclude only the sitemap endpoint and retain permanent HTTPS destinations', () => {
  for (const host of ['zqremovals.au', 'www.zqremovals.au']) {
    const rule = config.redirects.find(rule => rule.has?.some(item => item.type === 'host' && item.value === host));
    assert.equal(rule.source, '/:path((?!legacy-sitemap\\.xml$).*)');
    const pattern = /^\/(?!legacy-sitemap\.xml$)(.*)$/;
    assert.equal(pattern.test('/legacy-sitemap.xml'), false);
    for (const path of ['/', '/house-removals-adelaide/', '/unknown/', '/api/legacy-sitemap', '/legacy-sitemap.xml/']) assert.equal(pattern.test(path), true);
    assert.equal(rule.destination, 'https://zqremovalsadelaide.com.au/:path');
    assert.equal(rule.permanent, true);
    const rewrite = config.rewrites.find(rule => rule.has?.some(item => item.type === 'host' && item.value === host));
    assert.equal(rewrite.source, '/legacy-sitemap.xml');
    assert.equal(rewrite.destination, '/api/legacy-sitemap/');
  }
  assert.equal(config.functions['api/legacy-sitemap.js'].includeFiles, 'data/migration/legacy-paths.txt');
  assert.equal(existsSync('site-dist/legacy-sitemap.xml'), false);
});

test('broken and chained legacy aliases point directly to existing equivalent content', () => {
  const mappings = new Map([
    ['/guides/how-to-prepare-furniture-for-moving/', '/adelaide-moving-guides/how-to-prepare-furniture-for-moving/'],
    ['/adelaide-moving-guides/moving-house-checklist-adelaide', '/adelaide-moving-guides/moving-house-checklist-adelaide/'],
  ]);
  for (const [source, destination] of mappings) {
    const rule = config.redirects.find(rule => rule.source === source && !rule.has);
    assert.equal(rule.destination, `https://zqremovalsadelaide.com.au${destination}`);
    assert.equal(rule.permanent, true);
    const html = readFileSync(`site-dist${destination}index.html`, 'utf8');
    assert.match(html, new RegExp(`rel="canonical" href="https://zqremovalsadelaide.com.au${destination}"`));
  }
});

test('piano service keeps focused metadata and descriptive links from real entry points', () => {
  const piano = readFileSync('site-dist/services/piano-movers-adelaide/index.html', 'utf8');
  assert.match(piano, /<title>Piano Movers Adelaide \| Piano Removalists \| ZQ Removals<\/title>/);
  assert.match(piano, /<h1[^>]*>Piano Movers Adelaide<\/h1>/);
  assert.match(piano, /name="description" content="Piano movers Adelaide for upright and digital pianos/);
  const home = readFileSync('site-dist/index.html', 'utf8');
  const hub = readFileSync('site-dist/removalists-adelaide/index.html', 'utf8');
  assert.match(home, /href="\/services\/piano-movers-adelaide\/">Piano movers Adelaide<\/a>/);
  assert.match(hub, /href="\/services\/piano-movers-adelaide\/">Piano removalists Adelaide<\/a>/);
});
