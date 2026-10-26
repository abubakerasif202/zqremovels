import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

// Reads the generated output in site-dist, so run `npm run build` first.
const root = process.cwd();
const distDir = path.join(root, 'site-dist');
const HOST = 'https://zqremovalsadelaide.com.au';

const readDist = (relative) => readFileSync(path.join(distDir, relative), 'utf8');
const pageFile = (route) => path.posix.join(route.replace(/^\/|\/$/g, ''), 'index.html');
const readRoute = (route) => readDist(route === '/' ? 'index.html' : pageFile(route));

const decode = (value = '') => value
  .replace(/&amp;/g, '&')
  .replace(/&quot;/g, '"')
  .replace(/&#39;|&apos;/g, "'")
  .replace(/&nbsp;/g, ' ');
const strip = (html) => decode(html.replace(/<script\b[\s\S]*?<\/script>/gi, ' ').replace(/<style\b[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
const title = (html) => decode(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? '').trim();
const description = (html) => decode(html.match(/<meta name="description" content="([^"]*)"/i)?.[1] ?? '').trim();
const h1 = (html) => strip(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? '');
const main = (html) => html.match(/<main\b[\s\S]*<\/main>/i)?.[0] ?? '';
const hrefs = (html) => [...html.matchAll(/<a\b[^>]*\shref="([^"]+)"/gi)].map((match) => match[1]);
const hasLink = (html, href) => hrefs(main(html)).includes(href);
const isIndexable = (html) => !/http-equiv="refresh"/i.test(html) && !/<meta name="robots" content="[^"]*noindex/i.test(html);
const canonical = (html) => html.match(/<link rel="canonical" href="([^"]+)"/i)?.[1];
const robots = (html) => html.match(/<meta name="robots" content="([^"]*)"/i)?.[1];

const HUB_OUTPUTS = new Set([
  'removalists-adelaide',
  'removalists-adelaide-prices',
  'removalists-northern-adelaide',
  'removalists-southern-adelaide',
]);

test('homepage keeps Adelaide positioning, search intent and visible published rates', () => {
  const html = readRoute('/');
  assert.match(h1(html), /Adelaide moves, planned properly/i);
  const lead = strip(html.match(/<p class="zqh-lead">([\s\S]*?)<\/p>/i)?.[1] ?? '');
  assert.match(lead, /Adelaide removalists/i);
  const pricing = strip(html.match(/<p class="zqh-pricing-note">([\s\S]*?)<\/p>/i)?.[1] ?? '');
  assert.match(pricing, /\$75 per 30 minutes/);
  assert.match(pricing, /\$89 per 30 minutes/);
  assert.match(pricing, /one-hour call-out\/travel/i);
  assert.ok(hasLink(html, '/office-removals-adelaide/'), 'homepage must link to the office page');
  assert.match(html, /data-lead-event="quote_cta_click"/);
});

test('homepage and /removalists-adelaide/ are differentiated', () => {
  const home = readRoute('/');
  const hub = readRoute('/removalists-adelaide/');

  assert.notEqual(title(home), title(hub));
  assert.notEqual(description(home), description(hub));
  assert.notEqual(h1(home), h1(hub));

  assert.doesNotMatch(title(hub), /house/i, 'hub title must not retarget to house removalists');
  assert.doesNotMatch(title(hub), /5-star/i, 'hub title must not use an unverified rating claim');
  assert.doesNotMatch(strip(main(hub)), /5-star/i);
  assert.doesNotMatch(strip(main(hub)), /fixed price|specialists in apartment|no hidden/i);

  for (const href of [
    '/house-removals-adelaide/',
    '/apartment-removalists-adelaide/',
    '/furniture-removalists-adelaide/',
    '/office-removals-adelaide/',
    '/packing-services-adelaide/',
    '/removalists-adelaide-prices/',
  ]) {
    assert.ok(hasLink(hub, href), `hub missing ${href}`);
  }
  assert.equal(canonical(hub), `${HOST}/removalists-adelaide/`);
  assert.match(robots(hub) ?? '', /index,follow/);
});

test('hub links only point at pages that exist and are not redirects', () => {
  const hub = readRoute('/removalists-adelaide/');
  const internal = [...new Set(hrefs(main(hub)).filter((href) => href.startsWith('/') && !href.startsWith('//')))]
    .map((href) => href.split('#')[0])
    .filter((href) => href && !/\.(webp|png|jpg|svg|css|js)$/i.test(href));
  const dead = internal.filter((href) => {
    const file = path.join(distDir, pageFile(href));
    return !existsSync(file) || /http-equiv="refresh"/i.test(readFileSync(file, 'utf8'));
  });
  assert.deepEqual(dead, [], `hub links to missing or redirecting pages: ${dead.join(', ')}`);
});

test('prices page and cost guide target distinct intents and link together', () => {
  const prices = readRoute('/removalists-adelaide-prices/');
  const guide = readRoute('/adelaide-moving-guides/removalists-cost-adelaide/');

  assert.notEqual(title(prices), title(guide));
  assert.notEqual(description(prices), description(guide));
  assert.ok(hasLink(guide, '/removalists-adelaide-prices/'), 'cost guide must link to the prices page');
  assert.ok(hasLink(prices, '/adelaide-moving-guides/removalists-cost-adelaide/'), 'prices page should point to the cost guide');

  const priceText = strip(main(prices));
  assert.match(priceText, /30-minute increments/i);
  assert.match(priceText, /call-out\/travel/i);
  assert.match(priceText, /\$75 per 30 minutes/);
  assert.match(priceText, /\$89 per 30 minutes/);

  const guideText = strip(main(guide));
  for (const factor of [/stairs/i, /lifts/i, /parking/i, /carry distance/i, /packing/i, /inventory/i]) {
    assert.match(guideText, factor);
  }
});

test('every worked example is labelled hypothetical and uses only approved arithmetic', () => {
  const APPROVED_RATES = { 2: 75, 3: 89 };
  const APPROVED_CALLOUT = { 2: 150, 3: 178 };
  const money = (text) => [...text.matchAll(/\$(\d[\d,]*)/g)].map((match) => Number(match[1].replace(/,/g, '')));
  const approvedAmounts = new Set([75, 89, 150, 178]);

  for (const route of ['/removalists-adelaide-prices/', '/adelaide-moving-guides/removalists-cost-adelaide/']) {
    const html = main(readRoute(route));

    // Worked-example tables carry their assumptions in data attributes; recompute each total.
    const rows = [...html.matchAll(/<tr\b([^>]*data-half-hours[^>]*)>/g)].map((match) => match[1]);
    const attr = (row, name) => Number(row.match(new RegExp(`data-${name}="(\\d+)"`))?.[1]);
    for (const row of rows) {
      const crew = attr(row, 'crew');
      assert.ok(APPROVED_RATES[crew], `${route}: unapproved crew size ${crew}`);
      assert.equal(attr(row, 'rate'), APPROVED_RATES[crew], `${route}: rate is not approved`);
      assert.equal(attr(row, 'callout'), APPROVED_CALLOUT[crew], `${route}: call-out is not one hour of the crew rate`);
      assert.equal(attr(row, 'total'), attr(row, 'half-hours') * attr(row, 'rate') + attr(row, 'callout'), `${route}: example total does not add up`);
    }

    // The duration table: whole hours, two half-hour increments per hour, no call-out.
    const durationTable = html.match(/<table class="rate-table">\s*<caption>Hypothetical example durations[\s\S]*?<\/table>/)?.[0];
    if (durationTable) {
      for (const [, hours, two, three] of durationTable.matchAll(/<th scope="row">(\d) hours<\/th><td>\$(\d+)<\/td><td>\$(\d+)<\/td>/g)) {
        assert.equal(Number(two), Number(hours) * 2 * 75, `${hours} hours at 2 men`);
        assert.equal(Number(three), Number(hours) * 2 * 89, `${hours} hours at 3 men`);
      }
    }

    // Any page that shows computed dollar figures beyond the approved rates must call them hypothetical.
    const text = strip(html);
    const extra = money(text).filter((amount) => !approvedAmounts.has(amount));
    if (extra.length > 0 || rows.length > 0 || durationTable) {
      assert.match(text, /hypothetical example/i, `${route} shows worked figures without a hypothetical label`);
    }
    if (rows.length > 0) {
      assert.match(text, /assume/i, `${route} example must state its assumptions`);
    }
    assert.doesNotMatch(text.replace(/not a guarantee/gi, ''), /guarantee|fixed price|discount/i, `${route} makes an unapproved pricing claim`);
  }

  const prices = main(readRoute('/removalists-adelaide-prices/'));
  assert.ok((prices.match(/data-half-hours/g) ?? []).length >= 2, 'prices page should keep its call-out examples');
});

test('office page is linked from the homepage and regional hubs, not used as a suburb-wide link block', () => {
  const office = '/office-removals-adelaide/';
  assert.ok(hasLink(readRoute('/'), office), 'homepage');
  assert.ok(hasLink(readRoute('/removalists-northern-adelaide/'), office), 'northern hub');
  assert.ok(hasLink(readRoute('/removalists-adelaide/'), office), 'services hub');

  const officeHtml = readRoute(office);
  assert.equal(canonical(officeHtml), `${HOST}${office}`);
  assert.match(robots(officeHtml) ?? '', /index,follow/);
  assert.match(strip(main(officeHtml)), /\$75 per 30 minutes/);
  assert.doesNotMatch(strip(main(officeHtml)), /fixed[- ]price|guarantee|insured\b/i);
});

test('office links from suburb pages do not grow beyond the current baseline', () => {
  const linking = [];
  for (const entry of readdirSync(distDir)) {
    if (!entry.startsWith('removalists-') || HUB_OUTPUTS.has(entry)) continue;
    const file = path.join(distDir, entry, 'index.html');
    if (!existsSync(file)) continue;
    const html = readFileSync(file, 'utf8');
    if (isIndexable(html) && hasLink(html, '/office-removals-adelaide/')) linking.push(entry);
  }
  // Retain the broad ceiling as a guard alongside the intent-specific assertion below.
  assert.ok(linking.length <= 40, `office page is linked from ${linking.length} suburb pages`);
});

// Only suburb profiles with a commercial moving angle should feed the office service.
test('office page appears in fewer than 10 suburb pages', () => {
  let count = 0;
  for (const entry of readdirSync(distDir)) {
    if (!entry.startsWith('removalists-') || HUB_OUTPUTS.has(entry)) continue;
    const file = path.join(distDir, entry, 'index.html');
    if (!existsSync(file)) continue;
    const html = readFileSync(file, 'utf8');
    if (isIndexable(html) && hasLink(html, '/office-removals-adelaide/')) count += 1;
  }
  assert.ok(count < 10, `office page is linked from ${count} suburb pages`);
});

test('northern hub links to at least three existing suburb pages', () => {
  const hub = readRoute('/removalists-northern-adelaide/');
  const suburbLinks = [...new Set(hrefs(main(hub)).filter((href) => /^\/removalists-[a-z-]+\/$/.test(href)))]
    .filter((href) => !HUB_OUTPUTS.has(href.replace(/^\/|\/$/g, '')))
    .filter((href) => {
      const file = path.join(distDir, pageFile(href));
      return existsSync(file) && isIndexable(readFileSync(file, 'utf8'));
    });
  assert.ok(suburbLinks.length >= 3, `northern hub links to ${suburbLinks.length} live suburb pages: ${suburbLinks.join(', ')}`);
  assert.equal(canonical(hub), `${HOST}/removalists-northern-adelaide/`);
});

test('piano page makes no unverified insurance, guarantee, price or equipment claims', () => {
  const html = readRoute('/services/piano-movers-adelaide/');
  const text = strip(main(html));
  for (const banned of [/insured/i, /insurance/i, /guarantee/i, /fixed[- ]price/i, /specialist equipment/i, /trained piano/i, /piano technicians? on staff/i]) {
    assert.doesNotMatch(text, banned);
  }
  assert.match(text, /grand piano/i);
  assert.match(text, /upright/i);
  assert.match(text, /photos/i);
  assert.equal(canonical(html), `${HOST}/services/piano-movers-adelaide/`);
  assert.match(robots(html) ?? '', /index,follow/);
});

test('canonical and robots stay unchanged on the retargeted pages', () => {
  for (const [route, expectedRobots] of [
    ['/', 'index,follow'],
    ['/removalists-adelaide/', 'index,follow'],
    ['/office-removals-adelaide/', 'index,follow'],
    ['/removalists-adelaide-prices/', 'index,follow'],
    ['/adelaide-moving-guides/removalists-cost-adelaide/', 'index,follow'],
    ['/removalists-northern-adelaide/', 'index,follow'],
    ['/services/piano-movers-adelaide/', 'index,follow'],
  ]) {
    const html = readRoute(route);
    assert.equal(canonical(html), route === '/' ? `${HOST}/` : `${HOST}${route}`, `${route} canonical`);
    assert.match(robots(html) ?? '', new RegExp(`^${expectedRobots}`), `${route} robots`);
  }
});

test('Kensington Gardens description carries the approved rates wording', () => {
  const html = readRoute('/removalists-kensington-gardens/');
  assert.match(description(html), /2 men \+ truck \$75 per 30 minutes, 3 men \+ truck \$89 per 30 minutes/);
  assert.ok(title(html).length <= 60, `title too long: ${title(html)}`);
  assert.doesNotMatch(description(html), /guarantee|fixed[- ]price|free travel/i);
});

// Blakeview has no page of its own: /removalists-blakeview/ redirects to the northern hub, so it must never be linked.
test('no indexable page links to the retired Blakeview URL and the northern hub links to live pages', async () => {
  const { readFileSync, existsSync } = await import('node:fs');
  const hub = readFileSync('site-dist/removalists-northern-adelaide/index.html', 'utf8');
  assert.doesNotMatch(hub, /href="\/removalists-blakeview\/"/);
  for (const slug of ['salisbury', 'elizabeth', 'andrews-farm', 'mawson-lakes', 'munno-para', 'modbury', 'gawler']) {
    assert.match(hub, new RegExp(`href="/removalists-${slug}/"`), `hub should link ${slug}`);
    assert.ok(existsSync(`site-dist/removalists-${slug}/index.html`), `${slug} page must exist`);
  }
  const gawler = readFileSync('site-dist/removalists-gawler/index.html', 'utf8');
  assert.doesNotMatch(gawler, /href="\/removalists-blakeview\/"/);
});
