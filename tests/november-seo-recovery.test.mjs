import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { movingRates } from '../site-src/data/business.mjs';

const read = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const pages = JSON.parse(read('site-src/pages.json'));

test('office metadata reflects the commercial brief and CTA is concise', () => {
  const route = pages.find(({ output }) => output === 'office-removals-adelaide/index.html');
  assert.equal(route.canonical, 'https://zqremovalsadelaide.com.au/office-removals-adelaide/');
  assert.match(route.title, /^Office Removalists Adelaide \| Commercial Moves/);
  assert.match(route.description, /dock.*IT equipment.*restart/i);
  assert.equal(route.ogDescription, route.description);
  assert.equal(route.twitterDescription, route.description);
  const html = read('site-src/content/office-removals-adelaide/index.html');
  assert.match(html, /href="\/contact-us\/#quote-form">Get an Office Move Quote<\/a>/);
  assert.match(html, /href="tel:\+61433819989"/);
});

test('displays the supplied director portrait without labelling the generic hero as Qasim', () => {
  const html = read('site-src/content/about/index.html');
  const image = html.match(/<img[^>]+qasim-ali-director\.webp[^>]+>/)?.[0] ?? '';
  assert.match(image, /alt="Portrait of Qasim Ali"/);
  for (const attr of ['width="192"', 'height="192"', 'loading="lazy"']) assert.ok(image.includes(attr));
  assert.match(html, /Qasim Ali, Founder and Director/);
  assert.doesNotMatch(html, /alt="Qasim Ali and the ZQ Removals team/);
});

test('suburb leads do not describe the two-mover rate as the minimum', () => {
  const registry = read('site-src/data/seo-v4.mjs');
  assert.doesNotMatch(registry, /Published rates start at \$75 per 30 minutes/);
  assert.match(registry, /const smallTruckStartingRate = .*movingRates\.smallTruck/);
  assert.match(movingRates.smallTruck, /^\$\d+ per 30 minutes$/);
});
