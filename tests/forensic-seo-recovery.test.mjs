import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const dist = path.resolve('site-dist');
const readRoute = (route) => readFileSync(path.join(dist, route, 'index.html'), 'utf8');

function mainText(html) {
  return (html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] || '')
    .replace(/<script\b[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ');
}

test('protected ranking pages keep their URL, indexability, and primary intent', () => {
  const queensPark = readRoute('removalists-queens-park');
  assert.match(queensPark, /<link rel="canonical" href="https:\/\/zqremovalsadelaide\.com\.au\/removalists-queens-park\/"/i);
  assert.match(queensPark, /<meta name="robots" content="index,follow,max-image-preview:large"/i);
  assert.match(queensPark, /<h1[^>]*>Queens Park removalists<\/h1>/i);
  assert.match(queensPark, /Queens Park NSW|Sydney to Adelaide/i);

  const office = readRoute('office-removals-adelaide');
  assert.match(office, /<link rel="canonical" href="https:\/\/zqremovalsadelaide\.com\.au\/office-removals-adelaide\/"/i);
  assert.match(office, /<h1[^>]*>Office Removalists Adelaide/i);
  assert.match(office, /office relocation|business relocation/i);
});

test('priority commercial and suburb pages avoid unsupported pricing and insurance promises', () => {
  const routes = [
    'office-removals-adelaide', 'cheap-removalists-adelaide',
    'removalists-queens-park', 'removalists-norwood', 'removalists-glenelg',
    'removalists-unley', 'removalists-mawson-lakes', 'removalists-modbury',
  ];
  for (const route of routes) {
    const text = mainText(readRoute(route));
    assert.doesNotMatch(text, /fixed[- ]price|fully insured|zero travel fees?|no call-out fees?/i, route);
  }
});

test('lower-cost page keeps verified rates; budget/quote aliases are consolidated', () => {
  const cheap = readRoute('cheap-removalists-adelaide');
  assert.match(cheap, /\$75 per 30 minutes/i);
  assert.match(cheap, /\$89 per 30 minutes/i);
  assert.match(cheap, /1-hour call-out\/travel charge applies where applicable/i);

  const redirects = JSON.parse(readFileSync(path.resolve('vercel.json'), 'utf8')).redirects;
  const bySource = new Map(redirects.map((r) => [r.source.replace(/\/$/, ''), r.destination]));
  for (const alias of ['/budget-removalists-adelaide', '/moving-quotes-adelaide', '/removalists-adelaide-quote']) {
    assert.match(bySource.get(alias) || '', /\/removalists-adelaide-prices\/$/, alias);
  }
});

test('stable moving-company entity id is used on priority pages', () => {
  for (const route of ['office-removals-adelaide', 'cheap-removalists-adelaide', 'removalists-queens-park']) {
    const html = readRoute(route);
    assert.match(html, /https:\/\/zqremovalsadelaide\.com\.au\/#movingcompany/i, route);
    assert.doesNotMatch(html, /https:\/\/zqremovals\.au\/#business/i, route);
  }
});
