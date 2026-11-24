import { readFileSync, existsSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { visibleText } from './helpers/html-text.mjs';

const routes = ['/', '/removalists-adelaide/', '/cheap-removalists-adelaide/', '/removalists-adelaide-prices/'];
const read = route => readFileSync(`site-dist/${route === '/' ? '' : route.slice(1)}index.html`, 'utf8');
const text = html => visibleText(html).replace(/\s+/g, ' ');

test('commercial entry pages retain distinct primary titles and customer intent', () => {
  const titles = routes.map(route => read(route).match(/<title>(.*?)<\/title>/)[1]);
  assert.equal(new Set(titles).size, routes.length);
  assert.match(titles[0], /^Removalists Adelaide \| From \$65\/30 Min/);
  assert.match(titles[1], /Local Removalists Adelaide/);
  assert.match(titles[2], /^Cheap Removalists Adelaide \| From \$65\/30 Min/);
  assert.match(titles[3], /Prices \| From \$65\/30 Min/);
  assert.match(text(read('/removalists-adelaide/')), /both suburbs and postcodes/);
  assert.match(text(read('/cheap-removalists-adelaide/')), /total cost, not just the advertised rate/);
});

test('entry pages preserve canonical indexing, valid schema, rates and conversion paths', () => {
  for (const route of routes) {
    const html = read(route);
    assert.ok(html.includes(`rel="canonical" href="https://zqremovalsadelaide.com.au${route}"`), route);
    assert.doesNotMatch(html, /<meta name="robots" content="[^"]*noindex/);
    assert.match(html, /href="tel:\+61433819989"/);
    assert.match(html, /href="\/contact-us\/#quote-form"/);
    assert.match(text(html), /\$75 per 30 min/);
    assert.match(text(html), /\$89 per 30 min/);
    assert.match(text(html), /call-out\/travel charge/i);
    for (const match of html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) JSON.parse(match[1]);
    const main = html.match(/<main\b[\s\S]*?<\/main>/)?.[0] || '';
    for (const [, href] of main.matchAll(/href="(\/[^"#?]*\/)(?:#[^"]*)?"/g)) {
      assert.ok(existsSync(`site-dist${href}index.html`), `${route}: ${href}`);
      assert.doesNotMatch(read(href), /http-equiv="refresh"/i, `${route}: redirects via ${href}`);
    }
  }
});

test('budget packing FAQ is visible and represented once in FAQ schema', () => {
  const html = read('/cheap-removalists-adelaide/');
  const question = 'Can packing services help with a budget move?';
  assert.ok(text(html).includes(question));
  const nodes = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)]
    .flatMap(match => { const value = JSON.parse(match[1]); return value['@graph'] || [value]; });
  const faqs = nodes.filter(node => node['@type'] === 'FAQPage');
  assert.equal(faqs.length, 1);
  assert.equal(faqs[0].mainEntity.filter(item => item.name === question).length, 1);
});
