import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();
const pages = JSON.parse(await readFile(path.join(root, 'site-src', 'pages.json'), 'utf8'));
const conceptPages = pages.filter((page) => page.output.startsWith('premium-moving-concepts/'));
const expectedRoutes = [
  'premium-moving-concepts/index.html',
  'premium-moving-concepts/premium-hero-and-trust-section/index.html',
  'premium-moving-concepts/brand-logo/index.html',
  'premium-moving-concepts/luxury-pricing-packages/index.html',
  'premium-moving-concepts/testimonials-and-premium-footer/index.html',
];

test('archived concept routes retain source content without deleted asset references', async () => {
  assert.deepEqual(conceptPages.map((page) => page.output).sort(), expectedRoutes.sort());
  for (const page of conceptPages) {
    assert.match(page.robots, /noindex/i);
    assert.equal(page.layout, 'standard', 'archive uses the maintained shared stylesheet');
    assert.doesNotMatch(JSON.stringify(page), /\/media\/stitch\//);
    const source = await readFile(path.join(root, 'site-src', page.contentFile), 'utf8');
    assert.doesNotMatch(source, /\/media\/stitch\//);
    assert.match(source, /original (?:concept )?screenshots?[^<]*(?:unavailable|removed)|original screenshot unavailable/i);
    assert.equal((source.match(/<h1\b/g) || []).length, 1);
    assert.match(source, /id="main-content"/);
  }
});

test('built concept archive retains routes, noindex and truthful unavailable notices', async () => {
  for (const page of conceptPages) {
    const html = await readFile(path.join(root, 'site-dist', page.output), 'utf8');
    assert.match(html, /<meta name="robots" content="noindex,follow"/i);
    assert.doesNotMatch(html, /\/media\/stitch\//);
    assert.match(html, /screenshot[^<]*(?:unavailable|removed)/i);
    assert.match(html, /<link rel="canonical" href="https:\/\/zqremovalsadelaide\.com\.au\/premium-moving-concepts\//);
  }
});
