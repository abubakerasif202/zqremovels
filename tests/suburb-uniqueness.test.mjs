import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

// Requires a completed `npm run build` (site-dist).
const mainText = (slug) => {
  const html = readFileSync(`site-dist/removalists-${slug}/index.html`, 'utf8');
  const main = (html.match(/<main[\s\S]*?<\/main>/i) || [''])[0]
    .replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ').toLowerCase();
  return main.split(/[^a-z0-9$]+/).filter(Boolean);
};
const shingles = (words) => {
  const set = new Set();
  for (let i = 0; i + 4 < words.length; i += 1) set.add(words.slice(i, i + 5).join(' '));
  return set;
};
const overlap = (a, b) => {
  let shared = 0;
  for (const s of a) if (b.has(s)) shared += 1;
  return shared / Math.min(a.size, b.size);
};

test('Toorak Gardens is clearly different from sibling eastern-suburb pages', () => {
  const toorak = shingles(mainText('toorak-gardens'));
  for (const sibling of ['kensington-gardens', 'norwood', 'burnside', 'linden-park', 'walkerville', 'st-peters']) {
    if (!existsSync(`site-dist/removalists-${sibling}/index.html`)) continue;
    assert.ok(overlap(toorak, shingles(mainText(sibling))) < 0.5, `Toorak Gardens overlaps ${sibling} too much`);
  }
});

test('Toorak Gardens page stays indexable with a self-canonical', () => {
  const html = readFileSync('site-dist/removalists-toorak-gardens/index.html', 'utf8');
  assert.match(html, /<link[^>]+rel="canonical"[^>]+href="https:\/\/zqremovalsadelaide\.com\.au\/removalists-toorak-gardens\/"/);
  assert.doesNotMatch(html, /name="robots"[^>]*noindex/i);
  assert.match(readFileSync('site-dist/sitemap-suburbs.xml', 'utf8'), /removalists-toorak-gardens\//);
});
