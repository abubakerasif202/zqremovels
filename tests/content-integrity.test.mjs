import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { businessIdentifiers, movingRates } from '../site-src/data/business.mjs';

const distDir = path.join(process.cwd(), 'site-dist');
const readDist = (relativePath) => readFileSync(path.join(distDir, relativePath), 'utf8');

function indexablePages() {
  const pages = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      const full = path.join(dir, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (entry === 'index.html') {
        const html = readFileSync(full, 'utf8');
        if (/<meta name="robots" content="[^"]*noindex/i.test(html) || /http-equiv="refresh"/i.test(html)) continue;
        const route = `/${path.relative(distDir, path.dirname(full)).replace(/\\/g, '/')}/`.replace('//', '/');
        pages.push({ route, html });
      }
    }
  };
  walk(distDir);
  return pages;
}

const pages = indexablePages();
const footerOf = (html) => html.match(/<footer class="footer-shell">[\s\S]*<\/footer>/)?.[0] ?? '';

test('pricing.md is generated from shared business data', () => {
  const pricing = readDist('pricing.md');
  assert.ok(pricing.includes(movingRates.twoMenAndTruck), 'publishes the 2 men + truck rate');
  assert.ok(pricing.includes(movingRates.threeMenAndTruck), 'publishes the 3 men + truck rate');
  assert.ok(pricing.includes(movingRates.travelCharge), 'publishes the call-out/travel note');
  assert.ok(pricing.includes(`**ABN:** ${businessIdentifiers.abnFormatted}`), 'ABN matches the shared business record');
  assert.equal((pricing.match(/\bABN\b/g) || []).length, 1, 'only one ABN is published');
  assert.doesNotMatch(pricing, /fixed-price|do not use hidden hourly rates/i, 'no superseded pricing model');
  assert.match(readDist('llms.txt'), /Pricing: https:\/\/zqremovalsadelaide\.com\.au\/pricing\.md/);
});

test('every ABN published in crawler-facing text files matches the shared business record', () => {
  for (const file of ['pricing.md', 'llms.txt', 'llms-full.txt', 'ai.txt']) {
    for (const [, abn] of readDist(file).matchAll(/ABN:?\**\s*([\d ]{11,14})/g)) {
      assert.equal(abn.trim(), businessIdentifiers.abnFormatted, `${file} ABN`);
    }
  }
});

test('Door 2 Door comparison page carries no copy from another competitor and no unsourced competitor claims', () => {
  const html = readDist('door-2-door-movers-alternative-adelaide/index.html');
  const main = html.match(/<main[\s\S]*<\/main>/)?.[0] ?? '';
  const jsonLd = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1]).join('\n');
  for (const [label, text] of [['content', main], ['structured data', jsonLd]]) {
    assert.doesNotMatch(text, /No Limits/i, `${label} names the wrong competitor`);
    assert.doesNotMatch(text, /backloading|multi-city|warehouse|depot/i, `${label} repeats claims not on the cited Door 2 Door pages`);
  }
  assert.match(main, /Door 2 Door Alternative/, 'breadcrumb names this competitor');
  assert.match(main, /Best Door 2 Door fit/);
  assert.doesNotMatch(main, /moving move plan|moving local planning|moving focused|All-inclusive moving quotes/i);
  assert.ok(main.includes(movingRates.twoMenAndTruck) && main.includes(movingRates.threeMenAndTruck), 'ZQ pricing row uses the published crew rates');
});

test('guides hub does not advertise the retired No Limits comparison page', () => {
  assert.doesNotMatch(readDist('adelaide-moving-guides/index.html'), /No Limits/i);
});

test('footer link lists never repeat a destination and link the planning and trust pages', () => {
  for (const { route, html } of pages) {
    const lists = [...footerOf(html).matchAll(/<ul class="footer-link-list">([\s\S]*?)<\/ul>/g)].map((m) => m[1]).join('');
    const hrefs = [...lists.matchAll(/<a href="(\/[^"#]*)/g)].map((m) => m[1]);
    const repeated = hrefs.filter((href, index) => hrefs.indexOf(href) !== index);
    assert.deepEqual(repeated, [], `${route} footer repeats ${repeated.join(', ')}`);
  }
  const footer = footerOf(readDist('index.html'));
  assert.match(footer, /href="\/adelaide-moving-guides\/best-time-to-move-adelaide\/"/);
  assert.match(footer, /href="\/insurance-and-coverage\/"/);
});

test('quote links use a real label and are not doubled up in answer blocks', () => {
  for (const { route, html } of pages) {
    assert.doesNotMatch(html, />Moving removalists(?: Adelaide)?<|>Moving quotes Adelaide</, `${route} has a leftover placeholder link label`);
  }
});

test('planning, trust and comparison pages are not hub-only', () => {
  const inbound = (target) => pages.filter(({ route, html }) => route !== target && html.includes(`href="${target}"`)).length;
  assert.ok(inbound('/adelaide-moving-guides/best-time-to-move-adelaide/') >= 3);
  assert.ok(inbound('/insurance-and-coverage/') >= 3);
  assert.ok(inbound('/door-2-door-movers-alternative-adelaide/') >= 2);
});
