import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const priorities = [
  ['hyde-park', 'Hyde Park Removalists | Local Home Movers | ZQ Removals'],
  ['unley-park', 'Unley Park Removalists | Local Home Moves | ZQ Removals'],
  ['medindie', 'Medindie Removalists | Local House Movers | ZQ Removals'],
];

for (const [slug, title] of priorities) {
  test(`GSC suburb ${slug} has local intent metadata, canonical and quote path`, () => {
    const html = readFileSync(path.join(process.cwd(), 'site-dist', `removalists-${slug}`, 'index.html'), 'utf8');
    const htmlTitle = html.match(/<title>([^<]+)<\/title>/i)?.[1] || '';
    assert.equal(htmlTitle, title);
    assert.match(html, new RegExp(`<link[^>]+rel="canonical"[^>]+href="https://zqremovalsadelaide\\.com\\.au/removalists-${slug}/"`, 'i'));
    assert.match(html, /href="\/contact-us\/#quote-form"/);
    assert.match(html, /<h1\b[^>]*>/i);
    assert.match(html, /<script[^>]*application\/ld\+json/i);
  });
}
