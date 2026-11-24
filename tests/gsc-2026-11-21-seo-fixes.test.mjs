import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';
import { readVercelConfig } from './helpers/vercel-config.mjs';
import { buildOpeningHoursSpecification, businessIdentity, movingRates } from '../site-src/data/business.mjs';

const root = process.cwd();
const distDir = path.join(root, 'site-dist');
const ORIGIN = 'https://zqremovalsadelaide.com.au';

test.before(async () => {
  const buildUrl = pathToFileURL(path.join(root, 'scripts', 'build-site.mjs')).href;
  await import(`${buildUrl}?gsc20261121=${Date.now()}`);
});

const read = (output) => readFileSync(path.join(distDir, output), 'utf8');

function allIndexFiles(dir = distDir, found = []) {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) allIndexFiles(full, found);
    else if (name.endsWith('.html')) found.push(full);
  }
  return found;
}

function jsonLdNodes(html) {
  const nodes = [];
  for (const match of html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)) {
    const parsed = JSON.parse(match[1]);
    for (const item of Array.isArray(parsed) ? parsed : [parsed]) {
      if (Array.isArray(item['@graph'])) nodes.push(...item['@graph']);
      else nodes.push(item);
    }
  }
  return nodes;
}

function sitemapLocs() {
  // sitemap.xml is only the index of child sitemaps; the page sitemaps are sitemap-*.xml (images are not pages).
  const files = readdirSync(distDir).filter((file) => /^sitemap-.*\.xml$/.test(file) && !file.includes('images'));
  const locs = [];
  for (const file of files) {
    for (const match of read(file).matchAll(/<loc>([^<]+)<\/loc>/g)) locs.push({ file, loc: match[1] });
  }
  return locs;
}

test('furniture duplicate: /services/ URL is a permanent redirect to the one canonical furniture page', () => {
  const config = readVercelConfig(root);
  const redirects = new Map(config.redirects.map(({ source, destination, permanent }) => [source, { destination, permanent }]));
  for (const variant of [
    '/services/furniture-removals-adelaide',
    '/services/furniture-removals-adelaide/',
    '/services/furniture-removals-adelaide/index.html',
  ]) {
    // permanent: true is served as a 308 by Vercel, the method-preserving equivalent of a 301.
    assert.deepEqual(redirects.get(variant), { destination: '/furniture-removalists-adelaide/', permanent: true }, variant);
  }

  const stub = read('services/furniture-removals-adelaide/index.html');
  assert.match(stub, /<meta name="robots" content="noindex,follow"/i);
  assert.match(stub, new RegExp(`<link rel="canonical" href="${ORIGIN}/furniture-removalists-adelaide/"`));

  const canonical = read('furniture-removalists-adelaide/index.html');
  assert.match(canonical, new RegExp(`<link rel="canonical" href="${ORIGIN}/furniture-removalists-adelaide/"`));
  assert.doesNotMatch(canonical, /<meta name="robots" content="[^"]*noindex/i);
});

test('furniture duplicate: no built page, sitemap or llms.txt points at the old furniture URLs', () => {
  const oldUrls = ['/services/furniture-removals-adelaide', '/furniture-removals-adelaide'];
  for (const file of allIndexFiles()) {
    const html = readFileSync(file, 'utf8');
    for (const oldUrl of oldUrls) {
      assert.doesNotMatch(html, new RegExp(`href="(?:${ORIGIN.replace(/\./g, '\\.')})?${oldUrl}/?"`), `${path.relative(distDir, file)} links to ${oldUrl}`);
    }
  }
  for (const { file, loc } of sitemapLocs()) {
    for (const oldUrl of oldUrls) assert.ok(!loc.includes(oldUrl + '/'), `${file} lists ${loc}`);
  }
  const llms = readFileSync(path.join(root, 'llms.txt'), 'utf8');
  assert.doesNotMatch(llms, /\/furniture-removals-adelaide\//);
  assert.match(llms, /\/furniture-removalists-adelaide\//);
});

test('sitemap lists only canonical, indexable, non-redirected URLs', () => {
  const config = readVercelConfig(root);
  // Exact sources only: a no-trailing-slash source that redirects to the slash URL does not make the slash URL a redirect.
  const redirectSources = new Set(config.redirects.filter(({ has }) => !has).map(({ source }) => source));

  const locs = sitemapLocs();
  assert.ok(locs.length > 50, 'expected a populated sitemap');
  for (const { file, loc } of locs) {
    assert.ok(loc.startsWith(ORIGIN + '/'), `${file}: ${loc} is not on the canonical host`);
    const pathname = loc.slice(ORIGIN.length);
    assert.ok(!redirectSources.has(pathname), `${file}: ${loc} is a Vercel redirect source`);

    const output = pathname === '/' ? 'index.html' : `${pathname.slice(1)}index.html`;
    assert.ok(existsSync(path.join(distDir, output)), `${file}: ${loc} has no built page`);
    const html = read(output);
    assert.doesNotMatch(html, /http-equiv="refresh"/i, `${file}: ${loc} is a meta-refresh redirect page`);
    assert.doesNotMatch(html, /<meta name="robots" content="[^"]*noindex/i, `${file}: ${loc} is noindex`);
    assert.match(html, new RegExp(`<link rel="canonical" href="${loc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`), `${file}: ${loc} canonical mismatch`);
  }
});

test('homepage MovingCompany JSON-LD publishes the shared opening hours and the listing name', () => {
  const nodes = jsonLdNodes(read('index.html'));
  const companies = nodes.filter((node) => [].concat(node['@type']).includes('MovingCompany'));
  assert.equal(companies.length, 1, 'exactly one MovingCompany node');
  const company = companies[0];
  assert.equal(company.name, 'ZQ Removals Adelaide');
  assert.equal(company.alternateName, businessIdentity.name);
  assert.deepEqual(company.openingHoursSpecification, buildOpeningHoursSpecification());
  assert.deepEqual(company.openingHoursSpecification, [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '07:00',
      closes: '19:00',
    },
  ]);
  // Service-area business: no street address or coordinates are published.
  assert.equal(company.address.streetAddress, undefined);
  assert.equal(company.geo, undefined);
  assert.equal(company.telephone, '0433 819 989');

  const website = nodes.find((node) => node['@type'] === 'WebSite');
  assert.equal(website.name, 'ZQ Removals Adelaide');
  assert.equal(website.alternateName, 'ZQ Removals');
});

test('JSON-LD parses on key pages without duplicate MovingCompany or duplicate @id nodes', () => {
  for (const output of ['index.html', 'removalists-adelaide-prices/index.html', 'removalists-andrews-farm/index.html']) {
    const nodes = jsonLdNodes(read(output));
    assert.ok(nodes.length > 0, `${output}: no JSON-LD`);
    const companyNodes = nodes.filter((node) => [].concat(node['@type']).includes('MovingCompany'));
    assert.ok(companyNodes.length <= 1, `${output}: duplicate MovingCompany nodes`);
    const ids = nodes.map((node) => node['@id']).filter(Boolean);
    assert.equal(new Set(ids).size, ids.length, `${output}: duplicate @id values`);
  }
});

test('Andrews Farm, Gawler and Mount Barker have suburb-specific copy, not the shared template', () => {
  const expectations = {
    'removalists-andrews-farm': { h1: /Andrews Farm removalists: local house, unit and furniture moves/, copy: /ZQ Removals is based in Andrews Farm, SA 5114/ },
    'removalists-gawler': { h1: /Gawler removalists: heritage homes, estates and northern moves/, copy: /older stone cottages and villas near the town centre/ },
    // The hero heading normaliser drops "Adelaide" from the profile h1, so the rendered text is shorter.
    'removalists-mount-barker': { h1: /Mount Barker removalists: Hills house and furniture moves/, copy: /South Eastern Freeway/ },
  };
  for (const [slug, { h1, copy }] of Object.entries(expectations)) {
    const html = read(`${slug}/index.html`);
    assert.match(html, h1, `${slug} h1`);
    assert.match(html, copy, `${slug} copy`);
    assert.match(html, /"@type":\s*"FAQPage"/, `${slug} FAQPage schema`);
  }
});

test('the three suburb pages share little body text with the other suburb pages (5-word shingles)', () => {
  const K = 5;
  const bodyShingles = (html) => {
    const main = (html.match(/<main[\s\S]*?<\/main>/i) || [html])[0]
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<form[\s\S]*?<\/form>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&[a-z#0-9]+;/gi, ' ')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(Boolean);
    const set = new Set();
    for (let i = 0; i + K <= main.length; i++) set.add(main.slice(i, i + K).join(' '));
    return set;
  };
  const pages = new Map();
  for (const dir of readdirSync(distDir)) {
    if (!dir.startsWith('removalists-') || dir === 'removalists-adelaide-prices') continue;
    const file = path.join(distDir, dir, 'index.html');
    if (!existsSync(file)) continue;
    const html = readFileSync(file, 'utf8');
    if (/http-equiv="refresh"/i.test(html)) continue;
    pages.set(dir, bodyShingles(html));
  }
  for (const slug of ['removalists-andrews-farm', 'removalists-gawler', 'removalists-mount-barker']) {
    const mine = pages.get(slug);
    const others = new Set();
    let maxJaccard = 0;
    for (const [name, shingles] of pages) {
      if (name === slug) continue;
      for (const item of shingles) others.add(item);
      let shared = 0;
      for (const item of mine) if (shingles.has(item)) shared += 1;
      maxJaccard = Math.max(maxJaccard, shared / (mine.size + shingles.size - shared));
    }
    let unique = 0;
    for (const item of mine) if (!others.has(item)) unique += 1;
    // Baseline before the fix: 24-28% unique and ~0.54 maximum Jaccard against another suburb page.
    assert.ok(unique / mine.size >= 0.4, `${slug}: only ${(100 * unique / mine.size).toFixed(1)}% unique shingles`);
    assert.ok(maxJaccard <= 0.35, `${slug}: max Jaccard ${maxJaccard.toFixed(3)} against another suburb page`);
  }
});

test('striking-distance and target suburb pages are linked from the homepage and related pages', () => {
  const home = read('index.html');
  const targets = ['hyde-park', 'unley-park', 'medindie', 'malvern', 'toorak-gardens', 'kensington-gardens', 'andrews-farm', 'gawler', 'mount-barker'];
  for (const slug of targets) {
    assert.match(home, new RegExp(`href="/removalists-${slug}/"`), `homepage -> ${slug}`);
    assert.match(read('removalists-adelaide/index.html'), new RegExp(`href="/removalists-${slug}/"`), `hub -> ${slug}`);
  }
  const prices = read('removalists-adelaide-prices/index.html');
  for (const slug of ['hyde-park', 'unley-park', 'medindie', 'malvern', 'toorak-gardens', 'kensington-gardens']) {
    assert.match(prices, new RegExp(`href="/removalists-${slug}/"`), `prices -> ${slug}`);
  }
  assert.match(read('removalists-adelaide-hills/index.html'), /href="\/removalists-mount-barker\/"/);
  assert.match(read('removalists-northern-adelaide/index.html'), /href="\/removalists-andrews-farm\/"/);
  assert.match(read('removalists-northern-adelaide/index.html'), /href="\/removalists-gawler\/"/);
  // Related inner-south and eastern suburb pages point at the striking-distance pages.
  assert.match(read('removalists-unley/index.html'), /href="\/removalists-hyde-park\/"/);
  assert.match(read('removalists-goodwood/index.html'), /href="\/removalists-malvern\/"/);
  assert.match(read('removalists-walkerville/index.html'), /href="\/removalists-medindie\/"/);
});

test('striking-distance suburb pages keep their existing titles and H1s', () => {
  const expected = {
    'removalists-hyde-park': /<title>[^<]*Hyde Park[^<]*<\/title>/,
    'removalists-medindie': /<title>Medindie Removalists \| Local House Movers \| ZQ Removals<\/title>/,
    'removalists-malvern': /<title>Removalists Malvern, Adelaide, SA 5061 \| ZQ Removals<\/title>/,
    'removalists-kensington-gardens': /<title>Removalists Kensington Gardens \| Adelaide Movers<\/title>/,
  };
  for (const [slug, title] of Object.entries(expected)) assert.match(read(`${slug}/index.html`), title, slug);
  assert.match(read('removalists-hyde-park/index.html'), /<h1[^>]*>Hyde Park removalists: local home and furniture moves<\/h1>/);
  assert.match(read('removalists-unley-park/index.html'), /<h1[^>]*>Unley Park removalists: home, townhouse and furniture moves<\/h1>/);
  assert.match(read('removalists-toorak-gardens/index.html'), /<h1[^>]*>Toorak Gardens removalists: careful moves<\/h1>/);
  assert.match(read('removalists-medindie/index.html'), /<h1[^>]*>Medindie removalists<\/h1>/);
  assert.match(read('removalists-malvern/index.html'), /<h1[^>]*>Removalists in Malvern, Adelaide, SA 5061<\/h1>/);
  assert.match(read('removalists-kensington-gardens/index.html'), /<h1[^>]*>Kensington Gardens removalists<\/h1>/);
});

// The owner confirmed on 2026-11-21 that the $65 small-truck package is real. It is published only on the homepage
// and the prices page (visible copy; JSON-LD priceRange is shared), always as the shared movingRates.smallTruck value, and no other small-truck rate exists.
test('the confirmed small-truck rate is consistent and comes from the shared constant', () => {
  assert.equal(movingRates.smallTruck, '$65 per 30 minutes');
  const withRate = allIndexFiles()
    .filter((file) => readFileSync(file, 'utf8').replace(/<script[^>]*application\/ld\+json[\s\S]*?<\/script>/gi, '').includes('$65'))
    .map((file) => path.relative(distDir, file).replace(/\\/g, '/'))
    .sort();
  // Allowlist of pages that may show the small-truck starting rate. The owner asked for it on the home page, the
  // Adelaide hub (the retired small-removalists page redirects there), the prices page, the cheap page and the
  // apartment page. The Door 2 Door comparison table lists the full published rate set. It must not spread to
  // specialist, interstate or large-truck pages (see pricing-visibility.test.mjs).
  assert.deepEqual(withRate, [
    'apartment-removalists-adelaide/index.html',
    'cheap-removalists-adelaide/index.html',
    'door-2-door-movers-alternative-adelaide/index.html',
    'index.html',
    'removalists-adelaide-prices/index.html',
    'removalists-adelaide/index.html',
  ]);

  const prices = read('removalists-adelaide-prices/index.html');
  const quoted = [...prices.matchAll(/small[- ]truck(?: rate)?(?: of| is)? \$(\d+)/gi)].map((m) => m[1]);
  assert.ok(quoted.length > 0 && quoted.every((n) => n === '65'), `prices page small-truck rates: ${quoted}`);
  assert.match(prices, /\$65 per 30 minutes/);

  const company = jsonLdNodes(read('index.html')).find((node) => [].concat(node['@type']).includes('MovingCompany'));
  assert.equal(company.priceRange, movingRates.priceRange);
});