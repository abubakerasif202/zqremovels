import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getGeneratedPages } from '../site-src/data/seo-v4.mjs';

const pages = new Map(getGeneratedPages().map(page => [page.output, page]));
const page = route => pages.get(route + '/index.html');

test('pricing distinguishes published truck packages without inventing a small-truck crew', () => {
  const prices = page('removalists-adelaide-prices');
  assert.match(prices.contentHtml, /Small truck[\s\S]*?\$65 \/ 30 min[\s\S]*?\$130\/hour/);
  assert.match(prices.contentHtml, /Crew confirmed with your quote/);
  assert.match(prices.contentHtml, /Large truck[\s\S]*?\$75 \/ 30 min[\s\S]*?\$150\/hour/);
  assert.match(prices.contentHtml, /\$89 \/ 30 min[\s\S]*?\$178\/hour/);
  assert.match(prices.contentHtml, /Hypothetical examples/);
  assert.match(prices.contentHtml, /1-hour call-out\/travel charge applies where applicable/);
  assert.match(prices.description, /small truck/i);
});

test('Pennington adds address-level quote guidance and preserves sourced local context', () => {
  const html = page('removalists-pennington').contentHtml;
  assert.match(html, /City of Charles Sturt/);
  assert.match(html, /2021 Census/);
  assert.match(html, /loading restrictions/);
  assert.match(html, /photos of the carry path at both addresses/);
  assert.match(html, /stairs, landings and narrow turns/);
  assert.match(html, /house, unit or apartment/);
  assert.match(html, /href="\/contact-us\/[^"]*"/);
  assert.match(page('removalists-pennington').robots, /(?:^|,)index,follow(?:,|$)/);
  assert.doesNotMatch(page('removalists-pennington').robots, /noindex/);
});

test('Port Adelaide offers a contextual Pennington planning link', () => {
  assert.match(page('removalists-port-adelaide').contentHtml, /Pennington pickup or delivery/);
  assert.match(page('removalists-port-adelaide').contentHtml, /href="\/removalists-pennington\/"/);
});

test('piano pricing identifies the large-truck package and retains booking assessment', () => {
  const html = page('services/piano-movers-adelaide').contentHtml;
  assert.match(html, /published large-truck crew rates/);
  assert.match(html, /confirm the applicable truck, crew and handling plan/);
  assert.match(html, /whether the instrument and access can be accepted before you book/);
  assert.match(html, /own piano technician/);
  assert.match(html, /\$75 per 30 minutes/);
  assert.match(html, /\$89 per 30 minutes/);
});

test('same-day scope review does not promise instant confirmation', () => {
  const html = page('same-day-removalists-adelaide').contentHtml;
  assert.doesNotMatch(html, /review your access and inventory details instantly/);
  assert.match(html, /Availability depends on our current schedule/);
});

test('office handoff separates transport and IT restart responsibilities', () => {
  const html = readFileSync('site-src/content/office-removals-adelaide/index.html', 'utf8');
  assert.match(html, /Your IT team handles shutdown, backups and reconnection/);
  assert.match(html, /restart order/);
  assert.match(html, /lift|dock/);
});

test('guide consolidation destination gives practical timing and stair preparation without duration promises', () => {
  const html = readFileSync('site-src/content/adelaide-moving-guides/index.html', 'utf8');
  assert.match(html, /How long will the move take, and what if there are stairs/);
  assert.match(html, /number of stair flights/);
  assert.match(html, /not a guaranteed completion time/);
  assert.match(html, /href="\/furniture-removalists-adelaide\/"/);
});
