import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const distDir = path.join(root, 'site-dist');

const pricePages = [
  'cheap-removalists-adelaide',
  'affordable-removalists-adelaide',
  'removalist-cost-adelaide',
  'moving-quotes-adelaide',
  'fixed-price-removalists-adelaide',
  'budget-removalists-adelaide',
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

const prioritySuburbs = [
  'andrews-farm',
  'adelaide-cbd',
  'glenelg',
  'marion',
  'salisbury',
  'mawson-lakes',
  'elizabeth',
  'norwood',
  'north-adelaide',
  'prospect',
  'golden-grove',
  'modbury',
  'port-adelaide',
  'henley-beach',
];

function readDist(relativePath) {
  const normalized = relativePath.replace(/\\/g, '/');
  const candidates = [
    path.join(distDir, relativePath),
  ];
  if (normalized.endsWith('/index.html') && normalized !== 'index.html') {
    const prefix = normalized.slice(0, -11);
    candidates.unshift(path.join(distDir, `${prefix}/index/index.html`));
  } else if (normalized.endsWith('.html') && !normalized.endsWith('/index.html') && normalized !== 'index.html' && normalized !== '404.html') {
    const prefix = normalized.slice(0, -5);
    candidates.unshift(path.join(distDir, `${prefix}/index.html`));
  }
  for (const c of candidates) {
    try {
      return readFileSync(c, 'utf8');
    } catch {
      // ignore
    }
  }
  return readFileSync(path.join(distDir, relativePath), 'utf8');
}

function extractRootLinks(html) {
  return [...html.matchAll(/href="(\/[^"#?]*\/?)(?:#[^"]*)?"/g)].map((match) => match[1]);
}

function walkHtml(dir, results = []) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stats = statSync(full);
    if (stats.isDirectory()) {
      walkHtml(full, results);
    } else if (entry.endsWith('.html')) {
      results.push(full);
    }
  }
  return results;
}

test.before(async () => {
  const buildUrl = pathToFileURL(path.join(root, 'scripts', 'build-site.mjs')).href;
  await import(`${buildUrl}?door2doorOutrank=${Date.now()}${Math.random()}`);
});

test('price-intent pages exist with metadata, H1, canonicals, CTAs, FAQs, schema, and internal links', () => {
  for (const slug of pricePages) {
    const html = readDist(path.join(slug, 'index.html'));
    const links = extractRootLinks(html);

    assert.match(html, /<title>[^<]+ZQ Removals<\/title>/, slug);
    assert.match(html, /<meta name="description" content="[^"]{80,}"/, slug);
    assert.match(html, new RegExp(`<link rel="canonical" href="https://zqremovals\\.au/${slug}/"`), slug);
    assert.equal((html.match(/<h1\b/g) || []).length, 1, slug);
    assert.match(html, /href="tel:\+61433819989"/, slug);
    assert.match(html, /href="\/contact-us\/#quote-form"/, slug);
    assert.match(html, /fixed-price|fixed price/i, slug);
    assert.match(html, /FAQPage/, slug);
    assert.match(html, /BreadcrumbList/, slug);
    assert.ok(links.filter((href) => servicePages.map((item) => `/${item}/`).includes(href)).length >= 2, slug);
    assert.ok(links.filter((href) => href.startsWith('/removalists-')).length >= 2, slug);
  }
});

test('homepage, footer, services, and guides build the price-intent internal linking moat', () => {
  const homepage = readDist('index.html');
  const footerSource = readFileSync(path.join(root, 'site-src', 'partials', 'footer.html'), 'utf8');

  for (const slug of pricePages) {
    assert.match(homepage, new RegExp(`href="/${slug}/"`), `homepage missing ${slug}`);
  }

  assert.match(footerSource, /href="\/adelaide-moving-guides\/removalists-cost-adelaide\/"/, 'footer missing pricing guide');
  assert.match(footerSource, /href="\/removalist-cost-adelaide\/"/, 'footer missing removalist cost page');
  assert.match(footerSource, /href="\/moving-quotes-adelaide\/"/, 'footer missing moving quotes page');
  assert.match(footerSource, /href="\/cheap-removalists-adelaide\/"/, 'footer missing lower-cost page');
  assert.match(footerSource, /href="\/affordable-removalists-adelaide\/"/, 'footer missing affordable page');
  assert.match(footerSource, /href="\/removalists-adelaide-quote\/"/, 'footer missing quote path');
  assert.doesNotMatch(footerSource, /Cheap Removalists Adelaide[\s\S]{0,220}Affordable Removalists Adelaide[\s\S]{0,220}Removalist Cost Adelaide[\s\S]{0,220}Moving Quotes Adelaide/i, 'footer should not expose a dense price-keyword cluster');

  for (const slug of servicePages) {
    const html = readDist(path.join(slug, 'index.html'));
    assert.match(html, /href="\/cheap-removalists-adelaide\/"|href="\/affordable-removalists-adelaide\/"|href="\/removalist-cost-adelaide\/"|href="\/moving-quotes-adelaide\/"/, slug);
  }

  for (const guide of [
    'adelaide-moving-guides/removalists-cost-adelaide/index.html',
    'adelaide-moving-guides/how-to-get-accurate-removalist-quotes-adelaide/index.html',
    'adelaide-moving-guides/cheap-vs-fixed-price-removalists-adelaide/index.html',
  ]) {
    const html = readDist(guide);
    assert.match(html, /href="\/contact-us\/#quote-form"/, guide);
    assert.match(html, /href="\/cheap-removalists-adelaide\/"|href="\/removalist-cost-adelaide\/"|href="\/moving-quotes-adelaide\/"/, guide);
    assert.match(
      html,
      guide.includes('removalists-cost-adelaide')
        ? /hourly rates, fixed quotes/i
        : /Hourly rates vs fixed-price moving quotes/,
      guide,
    );
  }
});

test('priority suburb pages include near-me, affordable, fixed-price, nearby, service, quote and FAQ signals', () => {
  for (const slug of prioritySuburbs) {
    const html = readDist(path.join(`removalists-${slug}`, 'index.html'));
    const main = html.match(/<main\b[\s\S]*?<\/main>/i)?.[0] || html;
    const suburb = slug.split('-').map((part) => part[0].toUpperCase() + part.slice(1)).join(' ');
    const links = extractRootLinks(main);

    assert.match(main, new RegExp(`${suburb} moves`, 'i'), slug);
    assert.match(main, /fixed-price quote/i, slug);
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

  assert.doesNotMatch(html, /\$\d+|from \$|per hour/i);
});

test('tracking, schema, host, secret, review, and contrast guards hold across generated output', () => {
  const analytics = readFileSync(path.join(root, 'analytics.mjs'), 'utf8');
  const site = readFileSync(path.join(root, 'site.js'), 'utf8');
  const sitemap = readDist('sitemap.xml') + readDist('sitemap-pages.xml') + readDist('sitemap-services.xml') + readDist('sitemap-suburbs.xml');
  const css = readDist('premium-site.min.css');

  for (const token of ['phone_click', 'quote_form_start', 'quote_form_submit', 'service_cta_click', 'suburb_cta_click', 'price_page_cta_click']) {
    assert.match(`${analytics}\n${site}`, new RegExp(token));
  }

  assert.doesNotMatch(sitemap, /https:\/\/www\.zqremovals\.au\//);
  assert.match(css, /\.sticky-mobile-cta/);
  assert.match(css, /\.table-wrap/);

  for (const file of walkHtml(distDir)) {
    if (file.includes(`${path.sep}premium-moving-concepts${path.sep}`)) {
      continue;
    }
    const html = readFileSync(file, 'utf8');
    assert.doesNotMatch(html, /https:\/\/www\.zqremovals\.au\//, file);
    assert.doesNotMatch(html, /AW-\d{6,}|VITE_GA_MEASUREMENT_ID=|VITE_META_PIXEL_ID=/, file);
    if (!file.endsWith(`removalists-adelaide${path.sep}index.html`)) {
      assert.doesNotMatch(html, /aggregateRating|ReviewRating/, file);
    }
    assert.doesNotMatch(html, /\$\d+|from \$|per hour/i, file);
  }
});
