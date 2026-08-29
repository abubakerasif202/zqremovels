import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const distDir = path.join(root, 'site-dist');
// removalist-cost / moving-quotes are consolidated onto the pricing canonical;
// cheap-removalists-adelaide stays live for the distinct lower-cost intent.
const rankingTargets = [
  'cheap-removalists-adelaide',
];

test.before(async () => {
  const buildUrl = pathToFileURL(path.join(root, 'scripts', 'build-site.mjs')).href;
  await import(`${buildUrl}?semrushTargets=${Date.now()}`);
});

test('Semrush commercial target pages expose indexable metadata, PAA answers, and useful cluster paths', () => {
  const expectedQuestions = [
    /How much do cheap removalists cost in Adelaide\?/i,
    /What affects an Adelaide removalist quote\?/i,
    /Do removalists charge extra for stairs\?/i,
    /How do I avoid surprise moving costs\?/i,
  ];

  for (const slug of rankingTargets) {
    const html = readDist(`${slug}/index.html`);
    assert.match(html, /<title>[^<]+<\/title>/i, slug);
    assert.match(html, /<meta name="description" content="[^"]+"/i, slug);
    assert.match(html, new RegExp(`<link rel="canonical" href="https://zqremovals\\.au/${slug}/"`), slug);
    assert.equal((html.match(/<h1\b/gi) || []).length, 1, `${slug} h1`);
    assert.match(html, /data-semrush-answer-block="quote-cost"/i, `${slug} missing quote answer block`);
    assert.match(html, /stairs|lifts/i, `${slug} missing access factor`);
    assert.match(html, /parking/i, `${slug} missing parking factor`);
    assert.match(html, /packing/i, `${slug} missing packing factor`);
    assert.match(html, /href="\/contact-us\/#quote-form"/i, `${slug} missing quote CTA`);
    assert.doesNotMatch(html, /data-real-video-placeholder="true"/i, `${slug} should not publish an internal video placeholder`);
    for (const question of expectedQuestions) {
      assert.match(html, question, `${slug} missing PAA question`);
    }
  }

  const cheap = readDist('cheap-removalists-adelaide/index.html');
  for (const href of [
    '/removalists-adelaide-prices/',
    '/house-removals-adelaide/',
    '/packing-services-adelaide/',
  ]) {
    assert.match(cheap, new RegExp(`href="${href}"`), `cheap page missing ${href}`);
  }
});

test('office recovery page leads the commercial intent and hands off to its supporting checklist', () => {
  const office = readDist('office-removals-adelaide/index.html');
  const checklist = readDist('adelaide-moving-guides/office-relocation-checklist-adelaide/index.html');

  assert.match(office, /<title>Office Removal(?:s|ists) Adelaide/i);
  assert.match(office, /<h1>Office Removalists Adelaide/i);
  assert.match(office, /business relocation quote/i);
  assert.match(office, /desks/i);
  assert.match(office, /chairs/i);
  assert.match(office, /filing cabinets/i);
  assert.match(office, /monitors/i);
  assert.match(office, /printers/i);
  assert.match(office, /stock/i);
  assert.match(office, /archive boxes/i);
  assert.match(office, /loading dock/i);
  assert.match(office, /weekend/i);
  assert.match(office, /office move risk checklist/i);
  assert.match(office, /href="\/adelaide-moving-guides\/office-relocation-checklist-adelaide\/"/i);
  assert.doesNotMatch(office, /data-real-video-placeholder="true"/i);
  assert.match(checklist, /href="\/office-removals-adelaide\/"[^>]*>request an office relocation quote/i);
});

test('target page structured data and copy stay factual and non-spammy', () => {
  for (const output of [
    ...rankingTargets.map((slug) => `${slug}/index.html`),
    'office-removals-adelaide/index.html',
    'adelaide-moving-guides/office-relocation-checklist-adelaide/index.html',
  ]) {
    const html = readDist(output);
    assert.doesNotMatch(html, /AggregateRating|ReviewRating|"@type"\s*:\s*"Review"/i, output);
    assert.doesNotMatch(html, /contract-backed|slow-walking traps|guaranteed price|no hidden costs/i, output);
    const exactCheapAnchors = (html.match(/>cheap removalists adelaide</gi) || []).length;
    assert.ok(exactCheapAnchors <= 3, `${output} repeats exact cheap anchor excessively`);
  }
});

function readDist(relativePath) {
  const normalized = relativePath.replace(/\\/g, '/');
  const candidates = [
    path.join(distDir, relativePath),
  ];
  if (normalized.endsWith('/index.html') && normalized !== 'index.html') {
    const prefix = normalized.slice(0, -11);
    candidates.unshift(path.join(distDir, `${prefix}/index/index.html`));
  } else if (normalized.endsWith('.html') && !normalized.endsWith('/index.html') && normalized !== 'index.html' && normalized !== '404.html') {
    const prefix = normalized.slice(0, -5);
    candidates.unshift(path.join(distDir, `${prefix}/index.html`));
  }
  for (const c of candidates) {
    try {
      return readFileSync(c, 'utf8');
    } catch {
      // ignore
    }
  }
  return readFileSync(path.join(distDir, relativePath), 'utf8');
}
