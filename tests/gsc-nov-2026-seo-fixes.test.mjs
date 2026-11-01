import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';
import { readVercelConfig } from './helpers/vercel-config.mjs';

const read = (relative) => readFileSync(new URL(`../site-dist/${relative}`, import.meta.url), 'utf8');
const meta = (html, name) => html.match(new RegExp(`<meta name="${name}" content="([^"]*)"`))?.[1] || '';
const title = (html) => html.match(/<title>(.*?)<\/title>/)?.[1] || '';
const h1s = (html) => [...html.matchAll(/<h1\b[^>]*>[\s\S]*?<\/h1>/g)];
const decodedLength = (value) => value.replace(/&amp;/g, '&').replace(/&#39;/g, "'").length;

test('office page leads with the query and names the two supporting phrases', () => {
  const html = read('office-removals-adelaide/index.html');
  assert.match(title(html), /^Office Removalists Adelaide/);
  assert.ok(decodedLength(title(html)) <= 60);
  const description = meta(html, 'description');
  assert.ok(description.length >= 150 && description.length <= 160, description);
  assert.match(description, /\$75\/30 min/);
  assert.match(description, /Request your quote today/);
  assert.match(html, /<h2[^>]*>Office movers Adelaide:/);
  assert.match(html, /<h2[^>]*>Office relocation Adelaide,/);
  assert.equal(h1s(html).length, 1);
});

test('cost guide 301s straight to the prices page and leaves the sitemap', () => {
  assert.equal(existsSync(new URL('../site-dist/adelaide-moving-guides/removalists-cost-adelaide/index.html', import.meta.url)), false);
  const sitemap = ['sitemap.xml', 'sitemap-pages.xml', 'sitemap-guides.xml', 'sitemap-services.xml', 'sitemap-suburbs.xml']
    .map((file) => read(file)).join('\n');
  assert.doesNotMatch(sitemap, /removalists-cost-adelaide\//);
  const { redirects } = readVercelConfig();
  const prices = '/removalists-adelaide-prices/';
  for (const source of [
    '/adelaide-moving-guides/removalists-cost-adelaide/',
    '/adelaide-moving-guides/how-much-do-removalists-cost-adelaide/',
    '/guides/how-much-do-removalists-cost-adelaide/',
    '/adelaide-moving-guides/how-much-do-movers-cost-adelaide/',
  ]) {
    assert.equal(redirects.find((rule) => rule.source === source && !rule.has)?.destination, prices, source);
  }
  const pricesHtml = read('removalists-adelaide-prices/index.html');
  assert.match(pricesHtml, /What affects the time your move takes\?/);
  assert.match(pricesHtml, /Cost factors and what to tell the removalist/);
  const faq = [...pricesHtml.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .map((match) => JSON.parse(match[1]))
    .flatMap((node) => node['@graph'] || [node])
    .filter((node) => node['@type'] === 'FAQPage');
  assert.equal(faq.length, 1);
});

test('priority suburb titles lead with Removalists and the hub links all four', () => {
  for (const [file, lead] of [
    ['removalists-hyde-park/index.html', 'Removalists Hyde Park'],
    ['removalists-unley-park/index.html', 'Removalists Unley Park'],
    ['removalists-medindie/index.html', 'Removalists Medindie'],
    ['removalists-toorak-gardens/index.html', 'Removalists Toorak Gardens'],
  ]) {
    const html = read(file);
    assert.match(title(html), new RegExp(`^${lead}`));
    const description = meta(html, 'description');
    assert.ok(description.length >= 150 && description.length <= 160, `${file} ${description.length}`);
    assert.equal(h1s(html).length, 1);
    assert.match(h1s(html)[0][0], new RegExp(lead.replace('Removalists ', '')));
  }
  const hub = read('removalists-adelaide/index.html');
  assert.match(hub, /<link rel="canonical" href="https:\/\/zqremovalsadelaide\.com\.au\/removalists-adelaide\/"/);
  for (const href of ['/removalists-hyde-park/', '/removalists-unley-park/', '/removalists-medindie/', '/removalists-toorak-gardens/', '/']) {
    assert.match(hub, new RegExp(`href="${href}"`));
  }
  assert.doesNotMatch(meta(read('removalists-unley/index.html'), 'description'), /Unley Park/);
});

test('homepage owns Removalists Adelaide and piano is in the services nav', () => {
  const home = read('index.html');
  assert.match(home, /<h1[^>]*>Removalists Adelaide,<br\s*\/?>\s*planned properly\.<\/h1>/);
  assert.match(home, /href="\/services\/piano-movers-adelaide\/"/);
  const piano = read('services/piano-movers-adelaide/index.html');
  assert.match(piano, /Uprights and grands need different handling/);
  assert.match(piano, /Stairs, doorways and the path to the truck/);
  assert.match(piano, /How piano moving is charged/);
  assert.match(piano, /\$75 per 30 minutes/);
  assert.match(piano, /No separate piano rate is published/);
});

test('redirect stubs use noindex,follow', () => {
  for (const file of ['blog/index.html', 'removalists-semore/index.html', 'guides/removalist-cost-adelaide/index.html']) {
    assert.match(read(file), /<meta name="robots" content="noindex,follow"/);
  }
});
