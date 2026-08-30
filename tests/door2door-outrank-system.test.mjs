import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const distDir = path.join(root, 'site-dist');

// Pricing intent is consolidated onto a single canonical page (GSC route-cleanup).
const pricePage = 'removalists-adelaide-prices';

// Legacy price-farm URLs that must now 301 to the canonical pricing page and must
// no longer be generated. Source of truth: site-src/data/zq-redirects-verified.json.
const consolidatedPriceSlugs = [
  'removalist-cost-adelaide',
  'moving-quotes-adelaide',
  'fixed-price-removalists-adelaide',
  'budget-removalists-adelaide',
  'removalists-adelaide-quote',
];

const servicePages = [
  'furniture-removalists-adelaide',
  'house-removals-adelaide',
  'office-removals-adelaide',
  'apartment-removalists-adelaide',
  'same-day-removalists-adelaide',
  'packing-services-adelaide',
  'interstate-removals-adelaide',
];

// Generated suburb pages that survive consolidation (KEEP + not manual-review).
const prioritySuburbs = [
  'andrews-farm',
  'adelaide-cbd',
  'glenelg',
  'marion',
  'salisbury',
  'mawson-lakes',
  'elizabeth',
  'norwood',
  'modbury',
];

const verifiedRedirects = JSON.parse(
  readFileSync(path.join(root, 'site-src', 'data', 'zq-redirects-verified.json'), 'utf8'),
);
const vercelRedirects = JSON.parse(readFileSync(path.join(root, 'vercel.json'), 'utf8')).redirects;

function readDist(relativePath) {
  return readFileSync(path.join(distDir, relativePath), 'utf8');
}

function stripApprovedQuotePackagePricing(html) {
  return html
    .replace(/<form\b[^>]*data-quote-form="quote"[^>]*>[\s\S]*?<\/form>/gi, '')
    .replace(/\$75\s*(?:per|\/)\s*30 minutes/gi, '')
    .replace(/\$89\s*(?:per|\/)\s*30 minutes/gi, '');
}

function extractRootLinks(html) {
  return [...html.matchAll(/href="(\/[^"#?]*\/?)(?:#[^"]*)?"/g)].map((match) => match[1]);
}

function walkHtml(dir, results = []) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stats = statSync(full);
    if (stats.isDirectory()) walkHtml(full, results);
    else if (entry.endsWith('.html')) results.push(full);
  }
  return results;
}

test.before(async () => {
  const buildUrl = pathToFileURL(path.join(root, 'scripts', 'build-site.mjs')).href;
  await import(`${buildUrl}?door2doorOutrank=${Date.now()}${Math.random()}`);
});

test('canonical pricing page carries full metadata, H1, canonical, CTAs, FAQs, schema and internal links', () => {
  const html = readDist(path.join(pricePage, 'index.html'));
  const links = extractRootLinks(html);

  assert.match(html, /<title>[^<]*ZQ[^<]*<\/title>/);
  assert.match(html, /<meta name="description" content="[^"]{80,}"/);
  assert.match(html, new RegExp(`<link rel="canonical" href="https://zqremovalsadelaide\\.com\\.au/${pricePage}/"`));
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  assert.match(html, /href="tel:\+61433819989"/);
  assert.match(html, /href="\/contact-us\/#quote-form"/);
  assert.match(html, /transparent-rate|transparent rate|hourly rate/i);
  assert.match(html, /FAQPage/);
  assert.match(html, /BreadcrumbList/);
  assert.ok(links.filter((href) => servicePages.map((item) => `/${item}/`).includes(href)).length >= 2);
  assert.ok(links.filter((href) => href.startsWith('/removalists-')).length >= 2);
});

test('legacy price-farm URLs are consolidated: not built, and 301 to the canonical pricing page', () => {
  const bySource = new Map(vercelRedirects.map((r) => [r.source.replace(/\/$/, ''), r.destination]));
  for (const slug of consolidatedPriceSlugs) {
    assert.ok(
      !existsSync(path.join(distDir, slug, 'index.html')),
      `${slug} should no longer be generated`,
    );
    const dest = bySource.get(`/${slug}`);
    assert.ok(dest, `vercel.json missing 301 for /${slug}/`);
    assert.match(dest, /\/removalists-adelaide-prices\/$/, `${slug} should 301 to the pricing page`);
  }
  // No verified redirect target is itself redirected (single hop).
  const sources = new Set(verifiedRedirects.map((r) => r.source.replace(/\/$/, '')));
  for (const r of verifiedRedirects) {
    assert.ok(!sources.has(r.destination.replace(/\/$/, '')), `chain: ${r.source} -> ${r.destination}`);
  }
});

test('homepage and footer route price intent to the canonical pricing page without a keyword cluster', () => {
  const homepage = readDist('index.html');
  const footerSource = readFileSync(path.join(root, 'site-src', 'partials', 'footer.html'), 'utf8');

  assert.match(homepage, new RegExp(`href="/${pricePage}/"`), 'homepage missing canonical pricing link');
  assert.match(footerSource, /href="\/removalists-adelaide-prices\/"/, 'footer missing canonical pricing link');

  for (const slug of consolidatedPriceSlugs) {
    assert.doesNotMatch(
      footerSource,
      new RegExp(`href="/${slug}/"`),
      `footer should not link to consolidated alias /${slug}/`,
    );
  }

  // Every rendered page must be free of links to consolidated URLs.
  for (const file of walkHtml(distDir)) {
    if (file.includes(`${path.sep}premium-moving-concepts${path.sep}`)) continue;
    const html = readFileSync(file, 'utf8');
    for (const r of verifiedRedirects) {
      assert.doesNotMatch(html, new RegExp(`href="${r.source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`), `${file} links to redirected ${r.source}`);
    }
  }
});

test('priority suburb pages include local, transparent-rate, nearby, service, quote and FAQ signals', () => {
  for (const slug of prioritySuburbs) {
    const html = readDist(path.join(`removalists-${slug}`, 'index.html'));
    const main = html.match(/<main\b[\s\S]*?<\/main>/i)?.[0] || html;
    const suburb = slug.split('-').map((part) => part[0].toUpperCase() + part.slice(1)).join(' ');
    const links = extractRootLinks(main);

    assert.match(main, new RegExp(`${suburb} moves`, 'i'), slug);
    assert.match(main, /transparent-rate quote|published hourly rates/i, slug);
    assert.match(main, /access|parking|stairs|lifts|carry distance/i, slug);
    assert.ok(links.filter((href) => href.startsWith('/removalists-') && !href.includes(slug)).length >= 5, slug);
    assert.ok(links.filter((href) => servicePages.map((item) => `/${item}/`).includes(href)).length >= 3, slug);
    assert.match(main, /href="\/contact-us\/#quote-form"/, slug);
    assert.match(main, new RegExp(`What affects the price of a ${suburb} move\\?`, 'i'), slug);
  }
});

test('furniture battle page covers high-intent handling and FAQ requirements without invented prices', () => {
  const html = readDist(path.join('furniture-removalists-adelaide', 'index.html'));

  for (const phrase of [
    'Bulky',
    'Antiques',
    'Fragile',
    'stairs',
    'lifts',
    'tight turns',
    'blanket',
    'loading plan',
    'How much does furniture removal cost in Adelaide?',
    'Can you move heavy furniture?',
    'Do you wrap furniture?',
    'Can you move furniture from apartments?',
    'Do you offer same-day furniture removals?',
  ]) {
    assert.match(html, new RegExp(phrase, 'i'), phrase);
  }

  assert.doesNotMatch(stripApprovedQuotePackagePricing(html), /\$\d+|from \$|per hour/i);
});

test('tracking, schema, host, secret, review, and contrast guards hold across generated output', () => {
  const analytics = readFileSync(path.join(root, 'analytics.mjs'), 'utf8');
  const site = readFileSync(path.join(root, 'site.js'), 'utf8');
  const sitemap = readDist('sitemap.xml') + readDist('sitemap-pages.xml') + readDist('sitemap-services.xml') + readDist('sitemap-suburbs.xml');
  const css = readFileSync(path.join(root, 'premium-site.css'), 'utf8')
    .replace(/\s*([{}:;,>])\s*/g, '$1');

  for (const token of ['phone_click', 'quote_form_start', 'quote_form_submit', 'service_cta_click', 'suburb_cta_click', 'price_page_cta_click']) {
    assert.match(`${analytics}\n${site}`, new RegExp(token));
  }

  assert.doesNotMatch(sitemap, /https:\/\/www\.zqremovals\.au\//);
  assert.match(css, /\.sticky-mobile-cta/);
  assert.match(css, /\.table-wrap/);

  for (const file of walkHtml(distDir)) {
    if (file.includes(`${path.sep}premium-moving-concepts${path.sep}`)) continue;
    const html = readFileSync(file, 'utf8');
    assert.doesNotMatch(html, /https:\/\/www\.zqremovals\.au\//, file);
    assert.doesNotMatch(html, /AW-\d{6,}|VITE_GA_MEASUREMENT_ID=|VITE_META_PIXEL_ID=/, file);
    if (!file.endsWith(`removalists-adelaide${path.sep}index.html`)) {
      assert.doesNotMatch(html, /aggregateRating|ReviewRating/, file);
    }
    assert.doesNotMatch(stripApprovedQuotePackagePricing(html), /\$\d+|from \$|per hour/i, file);
  }
});
