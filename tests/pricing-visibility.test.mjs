import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { googleReviews, movingRates } from '../site-src/data/business.mjs';

// Reads the generated output, so run `npm run build` first.
const dist = path.resolve('site-dist');
const decode = (value) => value.replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&');
const read = (slug) => {
  const file = path.join(dist, slug, 'index.html');
  assert.ok(fs.existsSync(file), `missing build output for ${slug || 'home'}; run npm run build`);
  return fs.readFileSync(file, 'utf8');
};
const titleOf = (html) => decode(html.match(/<title>([\s\S]*?)<\/title>/)[1]);
const descriptionOf = (html) => decode(html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"/i)[1]);
const mainText = (html) => decode((html.match(/<main[\s\S]*?<\/main>/)?.[0] || '')
  .replace(/<script[\s\S]*?<\/script\s*>|<style[\s\S]*?<\/style\s*>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/\s+/g, ' '));

// "$65 per 30 minutes" -> "$65/30 Min" (the small-truck package; the only package this rate applies to).
const shortRate = movingRates.smallTruck.replace(' per 30 minutes', '/30 Min');

test('the small-truck starting rate is the $65 owner-confirmed package from the shared pricing source', () => {
  assert.equal(movingRates.smallTruck, '$65 per 30 minutes');
  assert.match(movingRates.summary, /Small truck: \$65 per 30 minutes/);
});

test('home, prices and cheap page titles lead with the starting rate and fit a SERP', () => {
  const expected = {
    '': `Removalists Adelaide | From ${shortRate} | ZQ Removals`,
    'removalists-adelaide-prices': `Removalists Adelaide Prices | From ${shortRate} | ZQ`,
    'cheap-removalists-adelaide': `Cheap Removalists Adelaide | From ${shortRate} | ZQ`,
  };
  for (const [slug, title] of Object.entries(expected)) {
    const html = read(slug);
    assert.equal(titleOf(html), title, `${slug || 'home'} title`);
    assert.ok(title.length <= 60, `${slug || 'home'} title is ${title.length} chars`);
    assert.equal(decode(html.match(/property="og:title"[^>]*content="([^"]*)"/i)[1]), title, `${slug || 'home'} og:title`);
  }
});

test('home description uses the shared review count and the small-truck rate, within snippet length', () => {
  const description = descriptionOf(read(''));
  assert.match(description, new RegExp(`rated ${Number(googleReviews.rating).toFixed(1)} from ${googleReviews.reviewCount} Google reviews`));
  assert.ok(description.includes(`from ${movingRates.smallTruck}`));
  assert.ok(description.length <= 160, `home description is ${description.length} chars`);
});

test('the $65 starting rate is visible early on the relevant commercial pages', () => {
  // Maximum character offset of the first "$65" in the visible main text, so the rate is not buried.
  const limits = {
    '': 1500,
    'removalists-adelaide': 3000,
    'removalists-adelaide-prices': 1000,
    'cheap-removalists-adelaide': 1000,
    'apartment-removalists-adelaide': 4000,
  };
  for (const [slug, limit] of Object.entries(limits)) {
    const index = mainText(read(slug)).indexOf('$65');
    assert.ok(index >= 0, `${slug || 'home'} does not show the $65 starting rate`);
    assert.ok(index <= limit, `${slug || 'home'} shows $65 too deep in the page (character ${index})`);
  }
});

test('the $65 small-truck rate is not applied to specialist, interstate or large-truck pages', () => {
  for (const slug of [
    'services/piano-movers-adelaide',
    'interstate-removals-adelaide',
    'furniture-removalists-adelaide',
    'house-removals-adelaide',
    'office-removals-adelaide',
  ]) {
    const html = read(slug);
    assert.ok(!mainText(html).includes('$65'), `${slug} body must not advertise $65`);
    assert.ok(!titleOf(html).includes('$65') && !descriptionOf(html).includes('$65'), `${slug} metadata must not advertise $65`);
  }
});

test('the homepage rate note lists all three packages and the call-out charge from the shared source', () => {
  const text = mainText(read(''));
  for (const rate of [movingRates.smallTruck, movingRates.twoMenAndTruck, movingRates.threeMenAndTruck]) {
    assert.ok(text.includes(rate), `home is missing ${rate}`);
  }
  assert.ok(text.includes(movingRates.travelCharge), 'home is missing the call-out/travel charge');
});
