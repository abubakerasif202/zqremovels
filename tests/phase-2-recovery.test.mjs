import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (file) => readFileSync(new URL('../' + file, import.meta.url), 'utf8');

test('mobile decorative hero does not outrank text rendering resources', () => {
  const script = read('scripts/build-site.mjs');
  assert.match(script, /href="\/media\/premium-template-hero-mobile\.webp"[^>]*fetchpriority="low"[^>]*media="\(max-width: 760px\)"/);
  assert.match(script, /href="\/media\/premium-template-hero\.webp"[^>]*fetchpriority="high"[^>]*media="\(min-width: 761px\)"/);
});

test('director section retains the optimised portrait and links to the existing quote journey', () => {
  const section = read('site-src/content/about/index.html').split('Founder and team')[1].split('</section>')[0];
  assert.match(section, /Portrait of Qasim Ali/);
  assert.match(section, /Qasim Ali, Founder and Director/);
  assert.match(section, /width="192" height="192" loading="lazy"/);
  assert.match(section, /href="\/contact-us\/#quote-form">Request a moving quote/);
});

test('moving cost guide passes rate-table intent to the pricing page', () => {
  const guide = read('site-src/content/adelaide-moving-guides/removalists-cost-adelaide/index.html');
  assert.match(guide, /href="\/removalists-adelaide-prices\/">See published crew and truck rates/);
  assert.doesNotMatch(guide, /<h2>Rates in brief<\/h2>/);
});
