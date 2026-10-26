import { existsSync, readFileSync } from 'node:fs';
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

const getMain = (html) => html.match(/<main[\s\S]*?<\/main>/)?.[0] || '';
const getModules = (html) => [...getMain(html).matchAll(/data-generated-module="([^"]+)"/g)].map((match) => match[1]);

test('Medindie is linked from Walkerville, Prospect and Adelaide CBD', () => {
  for (const source of ['walkerville', 'prospect', 'adelaide-cbd']) {
    const html = getMain(readPage(`removalists-${source}`));
    assert.match(html, /href="\/removalists-medindie\/"/, `removalists-${source} should link to Medindie`);
  }
});

test('prices page explains how to compare removal quotes using only published rates', () => {
  const html = readPage('removalists-adelaide-prices');
  const main = getMain(html);
  assert.ok(getModules(html).includes('pricing-compare-quotes'));
  assert.match(main, /How to compare removal quotes in Adelaide/);
  assert.match(main, /How much does a removalist cost in Adelaide\?/);
  assert.match(main, /How do I compare removal quotes\?/);

  const section = main.match(/<section\b[^>]*data-generated-module="pricing-compare-quotes"[\s\S]*?<\/section>/)?.[0] || '';
  const dollarAmounts = [...section.matchAll(/\$\d+/g)].map((match) => match[0]);
  assert.ok(dollarAmounts.length > 0);
  for (const amount of dollarAmounts) {
    assert.ok(['$75', '$89'].includes(amount), `unexpected price ${amount} in the compare-quotes section`);
  }
});

test('prices page FAQ schema includes the new questions exactly once', () => {
  const html = readPage('removalists-adelaide-prices');
  const faqBlocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .map((match) => JSON.parse(match[1]))
    .flatMap((json) => (Array.isArray(json['@graph']) ? json['@graph'] : [json]))
    .filter((node) => node['@type'] === 'FAQPage');
  assert.equal(faqBlocks.length, 1, 'expected a single FAQPage entity');
  const names = faqBlocks[0].mainEntity.map((item) => item.name);
  assert.equal(names.filter((name) => name === 'How much does a removalist cost in Adelaide?').length, 1);
  assert.equal(names.filter((name) => name === 'How do I compare removal quotes?').length, 1);
});
