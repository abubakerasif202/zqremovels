import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

// Reads the generated output, so run `npm run build` first.
const distDir = path.join(process.cwd(), 'site-dist');

const readPage = (slug) => {
  const file = path.join(distDir, slug, 'index.html');
  assert.ok(existsSync(file), `missing build output for ${slug}; run npm run build`);
  return readFileSync(file, 'utf8');
};

const decode = (value) => value
  .replace(/&#39;|&apos;/g, "'")
  .replace(/&quot;/g, '"')
  .replace(/&amp;/g, '&');

const getMain = (html) => html.match(/<main[\s\S]*?<\/main>/)?.[0] || '';
const getVisibleText = (html) => decode(getMain(html)
  .replace(/<script[\s\S]*?<\/script\s*>|<style[\s\S]*?<\/style\s*>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/\s+/g, ' '));

const listPages = () => readdirSync(distDir)
  .filter((name) => statSync(path.join(distDir, name)).isDirectory() && existsSync(path.join(distDir, name, 'index.html')));

const COMMERCIAL_PAGES = [
  'removalists-adelaide',
  'furniture-removalists-adelaide',
  'office-removals-adelaide',
  'same-day-removalists-adelaide',
];

test('no page has a doubled full stop in visible copy', () => {
  for (const slug of listPages()) {
    const text = getVisibleText(readPage(slug));
    assert.doesNotMatch(text, /[A-Za-z]{3,}\.\.(?!\.)/, `${slug} has a doubled full stop`);
  }
});

test('commercial intent sections use a plain heading instead of a keyword-stuffed one', () => {
  const html = getMain(readPage('same-day-removalists-adelaide'));
  assert.match(html, /<h2>Compare quotes on the same scope<\/h2>/);
  assert.doesNotMatch(html, /<h2>Plan a Same Day Removalists Adelaide/i);
  assert.doesNotMatch(html, /<h2>Plan same day removalists adelaide/i);
});

test('generated booking questions do not repeat the page keyword awkwardly', () => {
  const text = getVisibleText(readPage('same-day-removalists-adelaide'));
  assert.doesNotMatch(text, /confirm before booking Same Day Removalists Adelaide/i);
});

test('furniture hero does not claim specific equipment the business has not published', () => {
  const text = getVisibleText(readPage('furniture-removalists-adelaide'));
  assert.doesNotMatch(text, /premium furniture wrapping/i);
  assert.doesNotMatch(text, /structured vehicle tie-downs/i);
  const intro = text.match(/Furniture Removalists Adelaide for Careful Furniture Moves(.{0,500})/)?.[1] || '';
  assert.match(intro, /handling plan is scoped to your access requirements/);
  assert.doesNotMatch(intro, /ZQ Removals provides professional[\s\S]*ZQ Removals provides professional/);
});

test('each commercial landing page keeps a quote path and a phone call to action', () => {
  for (const slug of COMMERCIAL_PAGES) {
    const main = getMain(readPage(slug));
    assert.match(main, /href="\/contact-us\/#quote-form"/, `${slug} needs a quote link`);
    assert.match(main, /href="tel:/, `${slug} needs a phone link`);
  }
});

test('published rates on commercial pages stay at the verified $75 and $89 figures', () => {
  for (const slug of COMMERCIAL_PAGES) {
    const rates = new Set(getVisibleText(readPage(slug)).match(/\$\d+ per 30 min(?:utes)?/g) || []);
    for (const rate of rates) {
      assert.match(rate, /^\$(75|89) per 30 min/, `${slug} shows unverified rate ${rate}`);
    }
  }
});
