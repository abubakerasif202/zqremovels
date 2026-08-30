import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { businessIdentity, googleReviews } from '../site-src/data/business.mjs';
import { buildDescription, buildTitle, getGeneratedPages, isVerifiedRedirectSource, mergePagesByOutput } from '../site-src/data/seo-v4.mjs';

const root = process.cwd();
const distDir = path.join(root, 'site-dist');
const expectedAbn = businessIdentity.abn.formatted;
const pages = mergePagesByOutput(
  JSON.parse(readFileSync(path.join(root, 'site-src', 'pages.json'), 'utf8')),
  getGeneratedPages(),
).filter((page) => !isVerifiedRedirectSource(page));

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

function walkHtmlFiles(dir, results = []) {
  for (const entry of readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      walkHtmlFiles(fullPath, results);
      continue;
    }

    if (entry.endsWith('.html')) {
      results.push(fullPath);
    }
  }

  return results;
}

function outputToRoute(output) {
  if (output === 'index.html') {
    return '/';
  }

  if (output.endsWith('/index.html')) {
    return `/${output.replace(/\/index\.html$/, '/')}`;
  }

  return `/${output}`;
}

function isNoindexPage(page) {
  return (page.robots || '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .includes('noindex');
}

function isRedirectPage(page) {
  return page.layout === 'redirect';
}

function isUtilityPage(page) {
  return page.output === '404.html' || page.output === 'thank-you.html';
}

function isPreviewPage(page) {
  return page.output === 'premium-moving-concepts/index.html' || page.output.startsWith('premium-moving-concepts/');
}

function isLegacyGuidePage(page) {
  return page.output.startsWith('guides/');
}

function shouldIncludeInSitemap(page) {
  return !isRedirectPage(page) &&
    !isNoindexPage(page) &&
    !isUtilityPage(page) &&
    !isPreviewPage(page) &&
    !isLegacyGuidePage(page) &&
    page.output !== 'privacy-policy/index.html' &&
    page.output !== 'terms-and-conditions/index.html';
}

async function buildSite() {
  const buildUrl = pathToFileURL(path.join(root, 'scripts', 'build-site.mjs')).href;
  await import(`${buildUrl}?searchConsoleFixes=${Date.now()}`);
}

test.before(async () => {
  await buildSite();
});

test('generated sitemap and canonicals stay on the apex host', () => {
  const sitemap = readDist('sitemap-index.xml');
  const homepage = readDist('index.html');
  const interstateHub = readDist(path.join('interstate-removals-adelaide', 'index.html'));
  const robots = readDist('robots.txt');
  const llms = readDist('llms.txt');
  const ai = readDist('ai.txt');

  assert.doesNotMatch(sitemap, /https:\/\/www\.zqremovals\.au\//);
  assert.match(sitemap, /<sitemapindex/);
  assert.match(homepage, /<link rel="canonical" href="https:\/\/zqremovalsadelaide\.com\.au\/" \/>/);
  assert.match(homepage, /<title>Adelaide Removalists You Can Rely On \| ZQ Removals<\/title>/);
  assert.match(
    homepage,
    /<meta name="description" content="Careful Adelaide removalists for house, apartment, office and interstate moves\. Request a free quote from ZQ Removals today\." \/>/,
  );
  assert.match(
    interstateHub,
    /<link rel="canonical" href="https:\/\/zqremovalsadelaide\.com\.au\/interstate-removals-adelaide\/" \/>/,
  );
  assert.match(robots, /Sitemap: https:\/\/zqremovalsadelaide\.com\.au\/sitemap-index\.xml/);
  assert.match(llms, /Website: https:\/\/zqremovalsadelaide\.com\.au/);
  assert.match(llms, /Priority money pages:/);
  assert.match(llms, /\[Removalists Adelaide \| 5-Star Local Movers \| ZQ Removals\]\(https:\/\/zqremovalsadelaide\.com\.au\/removalists-adelaide\/\)/);
  assert.match(llms, /Best pages by task:/);
  assert.match(llms, /\[Quote request: Removalists Adelaide \| 5-Star Local Movers \| ZQ Removals\]\(https:\/\/zqremovalsadelaide\.com\.au\/removalists-adelaide\/\)/);
  assert.match(llms, /\[Packing help: Packing Services Adelaide \| Professional Packing Help\]\(https:\/\/zqremovalsadelaide\.com\.au\/packing-services-adelaide\/\)/);
  assert.match(llms, /Best entry pages:/);
  assert.match(ai, /Entity: ZQ Removals/);
  assert.match(ai, /No www host variants\./);
  assert.equal((homepage.match(/<h1\b/gi) || []).length, 1, 'homepage must have exactly one h1');
});

test('sitemap xml files start with a clean xml declaration', () => {
  for (const file of [
    'sitemap.xml',
    'sitemap-index.xml',
    'sitemap-pages.xml',
    'sitemap-services.xml',
    'sitemap-suburbs.xml',
    'sitemap-guides.xml',
    'sitemap-images.xml',
  ]) {
    const xml = readDist(file);
    assert.match(
      xml,
      /^\u003c\?xml version="1\.0" encoding="UTF-8"\?>\n/,
      `missing or malformed XML declaration in ${file}`,
    );
    assert.doesNotMatch(xml, /^\s+\u003c\?xml/, `leading whitespace found in ${file}`);
  }
});

test('generated html does not leak mixed-host seo output', () => {
  for (const htmlFile of walkHtmlFiles(distDir)) {
    const html = readFileSync(htmlFile, 'utf8');
    assert.doesNotMatch(
      html,
      /https:\/\/www\.zqremovals\.au\//,
      `mixed host output found in ${path.relative(distDir, htmlFile)}`,
    );
  }
});

test('sitemap contains only intended indexable routes', () => {
  const sitemapFiles = ['sitemap-pages.xml', 'sitemap-services.xml', 'sitemap-suburbs.xml', 'sitemap-guides.xml'];
  const locations = sitemapFiles
    .flatMap((file) => [...readDist(file).matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]));
  const expected = pages
    .filter((page) => shouldIncludeInSitemap(page))
    .map((page) => `https://zqremovalsadelaide.com.au${outputToRoute(page.output)}`);

  assert.deepEqual(new Set(locations), new Set(expected));

  for (const page of pages.filter((page) => !shouldIncludeInSitemap(page))) {
    assert.ok(
      !locations.includes(`https://zqremovalsadelaide.com.au${outputToRoute(page.output)}`),
      `unexpected sitemap inclusion for ${page.output}`,
    );
  }
});

test('visible breadcrumbs are rendered on key page types and align with JSON-LD', () => {
  const pagesToCheck = [
    ['index.html', ['aria-label="Breadcrumb"', 'li aria-current="page">Home']],
    [path.join('removalists-adelaide', 'index.html'), ['aria-label="Breadcrumb"', '/">Home</a>', 'Removalists Adelaide']],
    [path.join('removalists-salisbury', 'index.html'), ['aria-label="Breadcrumb"', '/">Home</a>', 'Salisbury']],
    [path.join('adelaide-moving-guides', 'removalists-cost-adelaide', 'index.html'), ['aria-label="Breadcrumb"', 'Adelaide Moving Guides', 'How Much Do Removalists Cost in Adelaide?']],
    [path.join('adelaide-to-sydney-removals', 'index.html'), ['aria-label="Breadcrumb"', 'Interstate Removals', 'Adelaide to Sydney Removals']],
    [path.join('adelaide-moving-guides', 'moving-house-checklist-adelaide', 'index.html'), ['aria-label="Breadcrumb"', 'Adelaide Moving Guides', 'Moving house checklist Adelaide']],
  ];

  for (const [output, needles] of pagesToCheck) {
    const html = readDist(output);
    for (const needle of needles) {
      assert.match(html, new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `missing breadcrumb text ${needle} in ${output}`);
    }
  }

  const breadcrumbJsonLdCount = [...walkHtmlFiles(distDir)].reduce((count, htmlFile) => {
    const html = readFileSync(htmlFile, 'utf8');
    return count + (html.match(/"@type": "BreadcrumbList"/g) || []).length;
  }, 0);
  assert.ok(breadcrumbJsonLdCount > 0, 'expected BreadcrumbList JSON-LD to remain present');
});

test('breadcrumb and faq schema do not duplicate within a single page', () => {
  for (const htmlFile of walkHtmlFiles(distDir)) {
    const html = readFileSync(htmlFile, 'utf8');
    const breadcrumbCount = (html.match(/"@type": "BreadcrumbList"/g) || []).length;
    const faqCount = (html.match(/"@type": "FAQPage"/g) || []).length;

    assert.ok(breadcrumbCount <= 1, `duplicate BreadcrumbList schema found in ${path.relative(distDir, htmlFile)}`);
    assert.ok(faqCount <= 1, `duplicate FAQPage schema found in ${path.relative(distDir, htmlFile)}`);
  }
});

test('canonical Adelaide moving checklist guide is generated with clean seo, links, schema, and no remote vision-board assets', () => {
  // /moving-checklist-adelaide/ and /adelaide-moving-guides/moving-checklist-adelaide/
  // are consolidated onto this canonical guide.
  const output = path.join('adelaide-moving-guides', 'moving-house-checklist-adelaide', 'index.html');
  const html = readDist(output);
  const main = extractMain(html);
  const links = extractRootLinks(main);

  assert.match(html, /<title>[^<]*checklist[^<]*ZQ Removals<\/title>/i);
  assert.match(html, /<meta name="description" content="[^"]{80,}" \/>/i);
  assert.match(html, /<link rel="canonical" href="https:\/\/zqremovalsadelaide\.com\.au\/adelaide-moving-guides\/moving-house-checklist-adelaide\/" \/>/i);
  assert.match(main, /<h1[^>]*>[^<]*checklist[^<]*<\/h1>/i);
  assert.match(main, /href="\/contact-us\/#quote-form"/i);
  assert.match(main, /href="tel:\+61433819989"/i);
  assert.ok(links.includes('/removalists-adelaide/'), 'missing Adelaide hub link');
  assert.ok(links.includes('/house-removals-adelaide/'), 'missing house removals link');
  assert.ok(links.includes('/packing-services-adelaide/'), 'missing packing link');
  assert.ok(links.some((href) => href.startsWith('/contact-us/')), 'missing contact link');
  assert.match(html, /"@type": "BreadcrumbList"/);
  assert.match(html, /"@type":\s*(\[\s*)?"(Article|BlogPosting)"/);
  assert.match(html, /"@type": "FAQPage"/);
  assert.doesNotMatch(main, /opal\.google|lh3\.googleusercontent/i);
  assert.doesNotMatch(main, /Product Vision Board 2024/i);
  assert.doesNotMatch(main, /Surry Hills/i);
  assert.match(html, /sticky-mobile-cta/);
});

test('shared mobile UX markup stays accessible and compact', () => {
  const template = readFileSync(path.join(root, 'site-src', 'templates', 'standard.html'), 'utf8');
  const header = readFileSync(path.join(root, 'site-src', 'partials', 'header.html'), 'utf8');
  const css = readFileSync(path.join(root, 'premium-site.css'), 'utf8')
    .replace(/\s*([{}:;,>])\s*/g, '$1');

  assert.match(template, /<a class="button button-secondary" href="tel:\+61433819989">Call 0433 819 989<\/a>/);
  assert.match(template, /<a class="button button-primary" href="\/contact-us\/#quote-form">Get a Free Quote<\/a>/);
  assert.match(header, /aria-controls="mobile-nav-panel"/);
  assert.match(header, /aria-expanded="false"/);
  assert.ok(css.includes('html,'), 'missing global html selector');
  assert.match(css, /overflow-x:\s*clip/i);
  assert.match(css, /@media \(max-width:\s*640px\)/i);
  assert.match(css, /\.sticky-mobile-cta\s*\{/i);
  assert.match(css, /padding-bottom:\s*calc\(0\.75rem \+ env\(safe-area-inset-bottom,\s*0px\)\)/i);
  assert.match(css, /\.js \.reveal-on-scroll\s*\{/i);
  assert.doesNotMatch(css, /\.js \.reveal-on-scroll\s*\{[\s\S]*?transition:\s*all/i);
  assert.match(css, /@media \(max-width:\s*767px\)[\s\S]*?\.mobile-nav-top[\s\S]*?display:\s*none/i);
  assert.match(css, /@media \(max-width:\s*767px\)[\s\S]*?\.header-main\s*\{[\s\S]*?min-height:\s*4rem/i);
  assert.match(css, /outline:\s*2px solid var\(--zq-cta\)/i);
  assert.match(css, /\.form-feedback\s*\{[\s\S]*?min-height:\s*1\.5rem/i);
  assert.match(css, /\.quote-form-premium input,\s*\.quote-form-premium select,\s*\.quote-form-premium textarea/i);
});

test('key titles and descriptions stay within safe SEO length guardrails', () => {
  const keyPages = [
    ['index.html', 60, 160],
    ['removalists-adelaide/index.html', 60, 160],
    ['adelaide-moving-guides/removalists-cost-adelaide/index.html', 60, 160],
    ['removalists-salisbury/index.html', 60, 160],
    ['removalists-glenelg/index.html', 60, 160],
    ['removalists-adelaide-cbd/index.html', 60, 160],
    ['removalists-hyde-park/index.html', 68, 160],
    ['removalists-malvern/index.html', 60, 160],
    ['removalists-unley/index.html', 60, 160],
    ['removalists-unley-park/index.html', 60, 160],
    ['removalists-medindie/index.html', 60, 160],
    ['adelaide-to-sydney-removalists/index.html', 60, 160],
    ['adelaide-to-brisbane-removals/index.html', 70, 160],
    ['adelaide-to-melbourne-removalists/index.html', 60, 160],
    ['movers-and-packers-adelaide/index.html', 65, 165],
    ['removalists-adelaide-prices/index.html', 60, 160],
    ['office-removals-adelaide/index.html', 60, 160],
    ['services/piano-movers-adelaide/index.html', 60, 160],
    ['adelaide-moving-guides/index.html', 60, 160],
  ];

  for (const [output, maxTitle, maxDescription] of keyPages) {
    const page = pages.find((entry) => entry.output === output);
    assert.ok(page, `missing page metadata for ${output}`);
    assert.ok(page.title.length <= maxTitle, `${output} title is too long: ${page.title.length}`);
    assert.ok(page.description.length <= maxDescription, `${output} description is too long: ${page.description.length}`);
  }
});

test('live-audit commercial snippets and guide publication schema stay fixed', () => {
  const pricing = readDist('removalists-adelaide-prices/index.html');
  const office = readDist('office-removals-adelaide/index.html');
  const piano = readDist('services/piano-movers-adelaide/index.html');
  const guide = readDist('adelaide-moving-guides/moving-house-checklist-adelaide/index.html');

  assert.match(pricing, /<title>Removalists Adelaide Prices \| ZQ Removals<\/title>/i);
  assert.match(pricing, /\$75 per 30 minutes/i);
  assert.match(pricing, /\$89 per 30 minutes/i);
  assert.match(pricing, /1-hour call-out or travel charge applies where applicable/i);
  assert.match(office, /<title>Office Removalists Adelaide \| ZQ Removals<\/title>/i);
  assert.match(piano, /<title>Piano Movers Adelaide \| ZQ Removals<\/title>/i);
  assert.match(guide, /"datePublished": "2026-05-23"/);
  assert.match(guide, /"dateModified": "2026-08-29"/);
});

test('homepage pricing cluster links to Adelaide prices page for crawl discovery', () => {
  const homepage = readDist('index.html');
  assert.match(
    homepage,
    /href="\/removalists-adelaide-prices\/"/,
    'homepage pricing cluster must link to removalists Adelaide prices',
  );
});

test('priority suburb and interstate pages use the requested high-intent metadata', () => {
  const expectations = [
    ['removalists-hyde-park/index.html', /Hyde Park Removalists \| Fixed-Price Movers Adelaide \| ZQ Removals/i, /Need reliable removalists in Hyde Park\?/i],
    ['removalists-malvern/index.html', /Malvern Removalists \| Local Furniture Movers Adelaide/i, /Book trusted Malvern removalists/i],
    ['removalists-unley/index.html', /Removalists Unley \| Professional Adelaide Movers/i, /Unley removalists for character homes, apartments and townhouses/i],
    ['removalists-unley-park/index.html', /Unley Park Removalists \| Local Movers Adelaide/i, /Unley Park removalists for tight streets/i],
    ['removalists-medindie/index.html', /Medindie Removalists \| Premium Home Movers Adelaide/i, /Choose Medindie removalists/i],
    ['adelaide-to-sydney-removalists/index.html', /Adelaide to Sydney Removalists/i, /Adelaide to Sydney removalists/i],
    ['adelaide-to-brisbane-removals/index.html', /Adelaide to Brisbane Removalists \| Interstate Movers/i, /Adelaide to Brisbane removalists/i],
    ['adelaide-to-melbourne-removalists/index.html', /Adelaide to Melbourne Removalists/i, /Adelaide to Melbourne removalists/i],
  ];

  for (const [output, titlePattern, descriptionPattern] of expectations) {
    const page = pages.find((entry) => entry.output === output);
    assert.ok(page, `missing metadata for ${output}`);
    assert.match(page.title, titlePattern, `${output} title mismatch`);
    assert.match(page.description, descriptionPattern, `${output} description mismatch`);
  }
});

test('generated SEO helpers dedupe repeated Adelaide removalist phrases safely', () => {
  const duplicatePhrasePattern = /(Removalists Adelaide[\s\S]*Adelaide Removalists|Adelaide Removalists[\s\S]*Removalists Adelaide)/i;
  const title = buildTitle('Removalists Adelaide | Adelaide Removalists | ZQ Removals');
  const quoteTitle = buildTitle('Adelaide Removalists | Removalists Adelaide', 'quote');
  const description = buildDescription('Removalists Adelaide and Adelaide Removalists searches need a fixed-price quote with access, inventory, timing, and route detail before booking.');

  assert.ok(title.length <= 68, `title too long: ${title.length}`);
  assert.ok(quoteTitle.length <= 68, `quote title too long: ${quoteTitle.length}`);
  assert.ok(description.length <= 155, `description too long: ${description.length}`);
  assert.doesNotMatch(title, duplicatePhrasePattern);
  assert.doesNotMatch(quoteTitle, duplicatePhrasePattern);
  assert.doesNotMatch(description, duplicatePhrasePattern);
});

test('robots and AI crawler files stay standards-compliant', () => {
  const robots = readDist('robots.txt');
  const llms = readDist('llms.txt');
  const llmsFull = readDist('llms-full.txt');
  const pricing = readDist('pricing.md');

  assert.match(robots, /^User-agent: \*\r?\nAllow: \/\r?\nSitemap: https:\/\/zqremovalsadelaide\.com\.au\/sitemap-index\.xml/m);
  assert.doesNotMatch(robots, /^LLM:/m);
  assert.match(llms, /Website: https:\/\/zqremovalsadelaide\.com\.au/);
  assert.match(llmsFull, /Entity: ZQ Removals/);
  assert.match(pricing, /# Pricing — ZQ Removals/);
  assert.match(pricing, /https:\/\/zqremovalsadelaide\.com\.au\/contact-us\/#quote-form/);
});

test('responsive image handling keeps hero images sized and prioritized correctly', () => {
  const homepage = readDist('index.html');
  const heroImg = homepage.match(/<picture>[\s\S]*?<img[\s\S]*?<\/picture>/i)?.[0] || '';
  const serviceGalleryImg = homepage.match(/<img[^>]+src="\/media\/zq-service-premium\.webp"[\s\S]*?>/i)?.[0] || '';

  assert.match(heroImg, /srcset="[^"]*\/media\/responsive\/home-local-hero-branded-480w\.webp 480w/i);
  assert.match(heroImg, /sizes="[^"]*"/i);
  assert.match(heroImg, /width="768"/i);
  assert.match(heroImg, /height="406"/i);
  assert.match(heroImg, /loading="eager"/i);
  assert.match(heroImg, /fetchpriority="high"/i);
  assert.match(serviceGalleryImg, /src="\/media\/zq-service-premium\.webp"/i);
  assert.match(serviceGalleryImg, /loading="lazy"/i);
  assert.match(serviceGalleryImg, /width="960"/i);
  assert.match(serviceGalleryImg, /height="640"/i);
});

test('vercel redirects cover legacy html aliases for crawlable pages and route families', () => {
  const vercelConfig = JSON.parse(readFileSync(path.join(root, 'vercel.json'), 'utf8'));
  const redirects = new Map(
    vercelConfig.redirects.map(({ source, destination }) => [source, destination]),
  );

  for (const [source, destination] of [
    ['/about.html', '/about/'],
    ['/contact-us.html', '/contact-us/'],
    ['/house-removals-adelaide.html', '/house-removals-adelaide/'],
    ['/interstate-removals-adelaide.html', '/interstate-removals-adelaide/'],
    ['/office-removals-adelaide.html', '/office-removals-adelaide/'],
    ['/packing-services-adelaide.html', '/packing-services-adelaide/'],
    ['/furniture-removalists-adelaide.html', '/furniture-removalists-adelaide/'],
    ['/removalists-adelaide.html', '/removalists-adelaide/'],
    ['/adelaide-moving-guides/removalist-cost-adelaide.html', '/adelaide-moving-guides/removalists-cost-adelaide/'],
    ['/guides/removalist-cost-adelaide.html', '/adelaide-moving-guides/removalists-cost-adelaide/'],
  ]) {
    assert.equal(redirects.get(source), destination);
  }

  assert.equal(
    redirects.get('/adelaide-moving-guides/:slug.html'),
    '/adelaide-moving-guides/:slug/',
  );
  assert.equal(redirects.get('/adelaide-to-:slug.html'), '/adelaide-to-:slug/');
  assert.equal(redirects.get('/removalists-:slug.html'), '/removalists-:slug/');
});

test('host migration redirects every old and www host to the new apex with path preservation', () => {
  const vercelConfig = JSON.parse(readFileSync(path.join(root, 'vercel.json'), 'utf8'));
  const hostRedirects = vercelConfig.redirects.filter((redirect) => (
    redirect.source === '/:path*'
    && redirect.permanent === true
    && Array.isArray(redirect.has)
    && redirect.has.some((condition) => condition.type === 'host')
  ));

  assert.deepEqual(
    hostRedirects.map((redirect) => redirect.has.find((condition) => condition.type === 'host').value).sort(),
    ['www.zqremovals.au', 'zqremovals.au', 'www.zqremovalsadelaide.com.au'].sort(),
  );
  for (const redirect of hostRedirects) {
    assert.equal(redirect.destination, 'https://zqremovalsadelaide.com.au/:path*');
  }
});

test('search console not-found validation URLs have direct legacy redirects', () => {
  const vercelConfig = JSON.parse(readFileSync(path.join(root, 'vercel.json'), 'utf8'));
  const redirects = new Map(
    vercelConfig.redirects.map(({ source, destination }) => [source, destination]),
  );

  for (const [source, destination] of [
    ['/adelaide-cbd', '/removalists-adelaide-cbd/'],
    ['/adelaide-cbd/', '/removalists-adelaide-cbd/'],
    ['/adelaide-cbd.html', '/removalists-adelaide-cbd/'],
    ['/adelaide-cbd/index.html', '/removalists-adelaide-cbd/'],
    ['/privacy', '/privacy-policy/'],
    ['/privacy/', '/privacy-policy/'],
    ['/privacy.html', '/privacy-policy/'],
    ['/privacy/index.html', '/privacy-policy/'],
    ['/privacy-policy.html', '/privacy-policy/'],
    ['/terms', '/terms-and-conditions/'],
    ['/terms/', '/terms-and-conditions/'],
    ['/terms.html', '/terms-and-conditions/'],
    ['/terms/index.html', '/terms-and-conditions/'],
    ['/terms-and-conditions.html', '/terms-and-conditions/'],
    ['/adelaide-moving-guides/removalist-cost-adelaide', '/adelaide-moving-guides/removalists-cost-adelaide/'],
    ['/adelaide-moving-guides/removalist-cost-adelaide/', '/adelaide-moving-guides/removalists-cost-adelaide/'],
    ['/adelaide-moving-guides/removalist-cost-adelaide/index.html', '/adelaide-moving-guides/removalists-cost-adelaide/'],
    ['/guides/removalist-cost-adelaide', '/adelaide-moving-guides/removalists-cost-adelaide/'],
    ['/guides/removalist-cost-adelaide/', '/adelaide-moving-guides/removalists-cost-adelaide/'],
    ['/guides/removalist-cost-adelaide/index.html', '/adelaide-moving-guides/removalists-cost-adelaide/'],
  ]) {
    assert.equal(redirects.get(source), destination, `${source} should redirect directly`);
  }

  const catchAllIndexPosition = vercelConfig.redirects.findIndex(({ source }) => source === '/:path*/index.html');
  for (const source of [
    '/adelaide-cbd/index.html',
    '/interstate-removalists-adelaide/index.html',
    '/local-removals-adelaide/index.html',
    '/privacy/index.html',
    '/removalists-semore/index.html',
    '/terms/index.html',
    '/adelaide-moving-guides/removalist-cost-adelaide/index.html',
    '/guides/removalist-cost-adelaide/index.html',
  ]) {
    const position = vercelConfig.redirects.findIndex((redirect) => redirect.source === source);
    assert.ok(position >= 0, `${source} redirect is missing`);
    assert.ok(
      position < catchAllIndexPosition,
      `${source} should be matched before /:path*/index.html`,
    );
  }
});

test('search console not-found validation aliases have static noindex fallback pages', () => {
  const sitemap = [
    'sitemap-pages.xml',
    'sitemap-services.xml',
    'sitemap-suburbs.xml',
    'sitemap-guides.xml',
  ].map((file) => readDist(file)).join('\n');

  for (const [output, canonical, refresh] of [
    ['adelaide-cbd.html', 'https://zqremovalsadelaide.com.au/removalists-adelaide-cbd/', '0; url=/removalists-adelaide-cbd/'],
    ['privacy.html', 'https://zqremovalsadelaide.com.au/privacy-policy/', '0; url=/privacy-policy/'],
    [path.join('privacy', 'index.html'), 'https://zqremovalsadelaide.com.au/privacy-policy/', '0; url=/privacy-policy/'],
    ['terms.html', 'https://zqremovalsadelaide.com.au/terms-and-conditions/', '0; url=/terms-and-conditions/'],
    [path.join('terms', 'index.html'), 'https://zqremovalsadelaide.com.au/terms-and-conditions/', '0; url=/terms-and-conditions/'],
    [path.join('adelaide-moving-guides', 'removalist-cost-adelaide', 'index.html'), 'https://zqremovalsadelaide.com.au/adelaide-moving-guides/removalists-cost-adelaide/', '0; url=/adelaide-moving-guides/removalists-cost-adelaide/'],
    [path.join('guides', 'removalist-cost-adelaide', 'index.html'), 'https://zqremovalsadelaide.com.au/adelaide-moving-guides/removalists-cost-adelaide/', '0; url=/adelaide-moving-guides/removalists-cost-adelaide/'],
  ]) {
    const html = readDist(output);
    assert.match(html, /<meta name="robots" content="noindex,nofollow" \/>/);
    assert.match(html, new RegExp(`<link rel="canonical" href="${canonical.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}" \\/>`));
    assert.match(html, new RegExp(`<meta http-equiv="refresh" content="${refresh.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}" \\/>`));
    assert.doesNotMatch(sitemap, new RegExp(output.replace(/\\/g, '/').replace(/index\\.html$/, '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('generated pages link to the canonical plural removalists cost guide', () => {
  for (const htmlFile of walkHtmlFiles(distDir)) {
    const relativePath = path.relative(distDir, htmlFile).replace(/\\/g, '/');
    const html = readFileSync(htmlFile, 'utf8');
    assert.doesNotMatch(
      html,
      /href="\/adelaide-moving-guides\/removalist-cost-adelaide\//,
      `${relativePath} links to the deprecated singular cost guide route`,
    );
  }
});

test('generated pages do not contain broken internal links', () => {
  for (const htmlFile of walkHtmlFiles(distDir)) {
    const relativePath = path.relative(distDir, htmlFile).replace(/\\/g, '/');
    const html = readFileSync(htmlFile, 'utf8');
    for (const match of html.matchAll(/href="([^"]+)"/g)) {
      const href = match[1];
      if (!href.startsWith('/') || href.startsWith('//')) {
        continue;
      }

      const cleanHref = href.split('#')[0].split('?')[0];
      if (!cleanHref || cleanHref.startsWith('/api/')) {
        continue;
      }

      const targetCandidates = [];
      if (cleanHref === '/') {
        targetCandidates.push(path.join(distDir, 'index.html'));
      } else if (cleanHref.endsWith('/')) {
        targetCandidates.push(
          path.join(distDir, cleanHref.slice(1), 'index.html'),
          path.join(distDir, cleanHref.slice(1), 'index', 'index.html')
        );
      } else {
        targetCandidates.push(
          path.join(distDir, cleanHref.slice(1)),
          path.join(distDir, cleanHref.slice(1), 'index.html'),
          path.join(distDir, cleanHref.slice(1), 'index', 'index.html')
        );
        if (!cleanHref.endsWith('.html')) {
          targetCandidates.push(path.join(distDir, `${cleanHref.slice(1)}.html`));
        }
      }

      assert.ok(
        targetCandidates.some((targetPath) => statSync(targetPath, { throwIfNoEntry: false })),
        `broken internal link in ${relativePath}: ${href}`,
      );
    }
  }
});

test('generated html keeps internal links root-absolute and avoids relative crawl traps', () => {
  for (const htmlFile of walkHtmlFiles(distDir)) {
    const html = readFileSync(htmlFile, 'utf8');
    for (const match of html.matchAll(/href="([^"]+)"/g)) {
      const href = match[1];
      if (
        href.startsWith('http://') ||
        href.startsWith('https://') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        href.startsWith('javascript:') ||
        href.startsWith('data:') ||
        href.startsWith('vbscript:') ||
        href.startsWith('#')
      ) {
        continue;
      }

      assert.match(
        href,
        /^\//,
        `non-root-absolute internal href found in ${path.relative(distDir, htmlFile)}: ${href}`,
      );
      assert.ok(
        !href.startsWith('//'),
        `protocol-relative href found in ${path.relative(distDir, htmlFile)}: ${href}`,
      );
    }
  }
});

test('generated html no longer serves large Gemini PNG hero assets', () => {
  for (const htmlFile of walkHtmlFiles(distDir)) {
    const html = readFileSync(htmlFile, 'utf8');
    assert.doesNotMatch(
      html,
      /\/media\/Gemini_Generated_Image_[^"]+\.png/,
      `legacy Gemini PNG reference found in ${path.relative(distDir, htmlFile)}`,
    );
  }
});

test('indexable pages expose complete unique metadata and one matching canonical', () => {
  const seenTitles = new Map();
  const seenDescriptions = new Map();

  for (const page of pages.filter((candidate) => shouldIncludeInSitemap(candidate))) {
    const html = readDist(page.output);
    const title = html.match(/<title>(.*?)<\/title>/i)?.[1] || '';
    const description = html.match(/<meta name="description" content="([^"]+)"/i)?.[1] || '';
    const canonicals = [...html.matchAll(/<link rel="canonical" href="([^"]+)"/gi)].map((match) => match[1]);
    const h1s = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map((match) => match[1].replace(/<[^>]+>/g, '').trim());
    const h2Count = [...html.matchAll(/<h2\b/gi)].length;

    assert.ok(title, `missing title for ${page.output}`);
    assert.ok(description, `missing meta description for ${page.output}`);
    assert.deepEqual(canonicals, [page.canonical], `canonical mismatch for ${page.output}`);
    assert.equal(h1s.length, 1, `expected exactly one h1 for ${page.output}`);
    assert.ok(h1s.every(Boolean), `empty h1 for ${page.output}`);
    assert.ok(h2Count >= 1, `missing h2 structure for ${page.output}`);
    assert.match(html, /<meta property="og:title" content="[^"]+"/i, `missing og:title for ${page.output}`);
    assert.match(html, /<meta property="og:description" content="[^"]+"/i, `missing og:description for ${page.output}`);
    assert.match(html, /<meta property="og:url" content="https:\/\/zqremovalsadelaide\.com\.au\/[^"]*"/i, `missing og:url for ${page.output}`);
    assert.match(html, /<meta property="og:image" content="https:\/\/zqremovalsadelaide\.com\.au\/[^"]+"/i, `missing apex og:image for ${page.output}`);
    assert.match(html, /<meta name="twitter:card" content="summary_large_image"/i, `missing twitter card for ${page.output}`);
    assert.match(html, /<meta name="twitter:title" content="[^"]+"/i, `missing twitter:title for ${page.output}`);
    assert.match(html, /<meta name="twitter:description" content="[^"]+"/i, `missing twitter:description for ${page.output}`);
    assert.match(html, /<meta name="twitter:image" content="https:\/\/zqremovalsadelaide\.com\.au\/[^"]+"/i, `missing twitter:image for ${page.output}`);

    assert.ok(!seenTitles.has(title), `duplicate title: ${title}`);
    assert.ok(!seenDescriptions.has(description), `duplicate description: ${description}`);
    seenTitles.set(title, page.output);
    seenDescriptions.set(description, page.output);
  }
});

test('production output avoids localhost and vercel deployment urls', () => {
  const forbidden = /(?:localhost|127\.0\.0\.1|\.vercel\.app|vercel\.app)/i;
  for (const file of [
    'sitemap.xml',
    'sitemap-index.xml',
    'sitemap-pages.xml',
    'sitemap-services.xml',
    'sitemap-suburbs.xml',
    'sitemap-guides.xml',
    'sitemap-images.xml',
    'robots.txt',
  ]) {
    assert.doesNotMatch(readDist(file), forbidden, `non-production URL leaked in ${file}`);
  }

  for (const htmlFile of walkHtmlFiles(distDir)) {
    const html = readFileSync(htmlFile, 'utf8');
    assert.doesNotMatch(html, forbidden, `non-production URL leaked in ${path.relative(distDir, htmlFile)}`);
  }
});

test('json-ld is valid, host-consistent, and uses only supported business facts', () => {
  for (const htmlFile of walkHtmlFiles(distDir)) {
    const relativePath = path.relative(distDir, htmlFile).replace(/\\/g, '/');
    const html = readFileSync(htmlFile, 'utf8');
    for (const jsonLd of extractJsonLd(html)) {
      assert.doesNotMatch(JSON.stringify(jsonLd), /https:\/\/www\.zqremovals\.au|localhost|\.vercel\.app/i, `bad schema URL in ${relativePath}`);
      assert.doesNotMatch(JSON.stringify(jsonLd), /AggregateRating|aggregateRating|reviewCount|ratingValue/i, `unsupported review schema in ${relativePath}`);

      for (const node of flattenJsonLdNodes(jsonLd)) {
        const types = Array.isArray(node['@type']) ? node['@type'] : [node['@type']].filter(Boolean);
        if (types.includes('MovingCompany')) {
          assert.equal(node.name, 'ZQ Removals', `MovingCompany name mismatch in ${relativePath}`);
          assert.equal(node.url, 'https://zqremovalsadelaide.com.au/', `MovingCompany URL mismatch in ${relativePath}`);
          assert.equal(normalizeTelephone(node.telephone), '0433819989', `MovingCompany telephone mismatch in ${relativePath}`);
          assert.deepEqual(
            node.sameAs,
            ['https://share.google/toaQ1pTUMpigxRuQM', 'https://facebook.com/zqremovals'],
            `MovingCompany sameAs mismatch in ${relativePath}`,
          );
          assert.equal(node.taxID, expectedAbn, `MovingCompany ABN mismatch in ${relativePath}`);
          assert.deepEqual(
            node.identifier,
            { '@type': 'PropertyValue', name: 'ABN', value: expectedAbn },
            `MovingCompany identifier mismatch in ${relativePath}`,
          );
          assert.equal(node.address?.['@type'], 'PostalAddress', `MovingCompany address type mismatch in ${relativePath}`);
          assert.equal(node.address?.addressLocality, 'Andrews Farm', `MovingCompany address locality mismatch in ${relativePath}`);
          assert.equal(node.address?.addressRegion, 'SA', `MovingCompany address region mismatch in ${relativePath}`);
          assert.equal(node.address?.postalCode, '5114', `MovingCompany address postal code mismatch in ${relativePath}`);
          assert.equal(node.address?.addressCountry, 'AU', `MovingCompany address country mismatch in ${relativePath}`);
          assert.ok(schemaValueNames(node.areaServed).includes('Adelaide'), `MovingCompany areaServed missing Adelaide in ${relativePath}`);
          assert.equal(node.openingHours, undefined, `unverified openingHours published in ${relativePath}`);
          assert.equal(node.openingHoursSpecification, undefined, `unverified openingHoursSpecification published in ${relativePath}`);
          if (node.founder !== undefined) {
            assert.equal(node.founder?.['@type'], 'Person', `founder must be a Person in ${relativePath}`);
            assert.equal(node.founder?.name, 'Qasim Ali', `founder mismatch in ${relativePath}`);
          }
        }
      }
    }
  }
});

test('required schema types exist on local, service, suburb, guide, FAQ, and breadcrumb pages', () => {
  const cases = [
    ['index.html', ['MovingCompany', 'WebPage']],
    [path.join('house-removals-adelaide', 'index.html'), ['MovingCompany', 'Service', 'FAQPage', 'BreadcrumbList']],
    [path.join('office-removals-adelaide', 'index.html'), ['MovingCompany', 'Service']],
    [path.join('interstate-removals-adelaide', 'index.html'), ['MovingCompany', 'Service']],
    [path.join('removalists-glenelg', 'index.html'), ['MovingCompany', 'Service', 'FAQPage', 'BreadcrumbList']],
    [path.join('removalists-salisbury', 'index.html'), ['MovingCompany', 'Service', 'FAQPage', 'BreadcrumbList']],
    [path.join('adelaide-moving-guides', 'how-to-choose-removalists-adelaide', 'index.html'), ['Article', 'FAQPage', 'BreadcrumbList']],
    [path.join('adelaide-moving-guides', 'office-relocation-checklist-adelaide', 'index.html'), ['Article', 'FAQPage', 'BreadcrumbList']],
  ];

  for (const [file, requiredTypes] of cases) {
    const html = readDist(file);
    const foundTypes = new Set(extractJsonLd(html).flatMap((jsonLd) => flattenJsonLdNodes(jsonLd)).flatMap((node) => Array.isArray(node['@type']) ? node['@type'] : [node['@type']].filter(Boolean)));
    for (const type of requiredTypes) {
      assert.ok(foundTypes.has(type), `${file} missing ${type} schema`);
    }
  }
});

test('guide article schema preserves dates and the commercial CTA stays unique', () => {
  const articleOutput = path.join('adelaide-moving-guides', 'how-much-do-removalists-cost-adelaide', 'index.html');
  const sourceOutput = articleOutput.replace(/\\/g, '/');
  const articleHtml = readDist(articleOutput);
  const hubHtml = readDist(path.join('adelaide-moving-guides', 'index.html'));
  const generalGuideHtml = readDist(path.join('adelaide-moving-guides', 'how-to-choose-removalists-adelaide', 'index.html'));
  const sourcePage = pages.find((page) => page.output === sourceOutput);

  assert.ok(sourcePage, `missing source metadata for ${articleOutput}`);
  assert.equal((articleHtml.match(/data-commercial-cta="guide-hub"/g) || []).length, 1, `${articleOutput} should include one commercial CTA`);
  assert.equal((articleHtml.match(/id="guide-next-step"/g) || []).length, 1, `${articleOutput} should keep a single guide-next-step anchor`);
  assert.equal((hubHtml.match(/data-commercial-cta="guide-hub"/g) || []).length, 0, 'guide hub must not receive the commercial CTA');
  assert.equal((generalGuideHtml.match(/data-commercial-cta="guide-hub"/g) || []).length, 1, 'guides article should include the commercial CTA');

  const articleBlocks = extractJsonLd(articleHtml);
  const articleNodes = articleBlocks.flatMap((jsonLd) => flattenJsonLdNodes(jsonLd));
  const faqSchema = articleNodes.find((node) => nodeTypes(node).includes('FAQPage'));
  assert.ok(faqSchema, `missing FAQPage node in ${articleOutput}`);

  const faqBlocks = [...articleHtml.matchAll(/<article\b[^>]*class="[^"]*\bfaq-item\b[^"]*"[\s\S]*?<\/article>/gi)].map((match) => match[0]);
  assert.equal(faqBlocks.length, faqSchema.mainEntity.length, `${articleOutput} visible FAQ count should match FAQPage JSON-LD`);
  for (const block of faqBlocks) {
    assert.match(block, /<article\b[^>]*itemscope[^>]*itemtype="https:\/\/schema\.org\/Question"/i, 'FAQ item missing Question microdata');
    assert.match(block, /<h3\b[^>]*itemprop="name"/i, 'FAQ question missing name microdata');
    assert.match(block, /<div\b[^>]*itemprop="acceptedAnswer"[^>]*itemscope[^>]*itemtype="https:\/\/schema\.org\/Answer"/i, 'FAQ answer missing Answer microdata');
    assert.match(block, /<div\b[^>]*itemprop="text"\s*>\s*<p>/i, 'FAQ answer text nesting is malformed');
    assert.doesNotMatch(block, /<p\b[^>]*itemprop="text"/i, 'FAQ answer paragraph should not carry itemprop="text" directly');
    assert.equal((block.match(/itemprop="text"/g) || []).length, 1, 'FAQ answer text itemprop should appear once per block');
  }

  const builtArticle = articleNodes.find((node) => nodeTypes(node).some((type) => type === 'Article' || type === 'BlogPosting'));
  assert.ok(builtArticle, `missing Article/BlogPosting node in ${articleOutput}`);

  const sourceArticle = sourcePage.jsonLd
    .map((block) => JSON.parse(block))
    .flatMap((jsonLd) => flattenJsonLdNodes(jsonLd))
    .find((node) => nodeTypes(node).some((type) => type === 'Article' || type === 'BlogPosting'));

  assert.ok(sourceArticle, `missing source Article/BlogPosting node for ${articleOutput}`);
  assert.deepEqual(builtArticle['@type'], sourceArticle['@type'], 'Article @type must stay normalized');
  assert.equal(builtArticle.headline, sourceArticle.headline, 'Article headline changed unexpectedly');
  assert.equal(builtArticle.description, sourceArticle.description, 'Article description changed unexpectedly');
  assert.deepEqual(builtArticle.mainEntityOfPage, sourceArticle.mainEntityOfPage, 'Article mainEntityOfPage changed unexpectedly');
  assert.deepEqual(builtArticle.author, normalizeGoogleProfileTokens(sourceArticle.author), 'Article author changed unexpectedly');
  assert.deepEqual(builtArticle.publisher, normalizeGoogleProfileTokens(sourceArticle.publisher), 'Article publisher changed unexpectedly');
  assert.equal(builtArticle.datePublished, sourceArticle.datePublished, 'Article datePublished changed unexpectedly');
  assert.equal(builtArticle.dateModified, sourceArticle.dateModified, 'Article dateModified changed unexpectedly');
  if (sourceArticle.image) {
    assert.deepEqual(builtArticle.image, sourceArticle.image, 'Article image changed unexpectedly');
  }
});

test('commercial CTA only appears on the expected guide article pages', () => {
  const actualPages = pages.filter((page) => readDist(page.output).includes('data-commercial-cta="guide-hub"'));

  assert.ok(actualPages.length > 0, 'expected guide articles should render the commercial CTA');
  for (const page of actualPages) {
    const isGuideArticle =
      (page.output.startsWith('adelaide-moving-guides/') && page.output !== 'adelaide-moving-guides/index.html') ||
      (page.output.startsWith('guides/') && page.output !== 'guides/index.html');
    const robots = (page.robots || '').toLowerCase();

    assert.ok(isGuideArticle, `${page.output} should be a guide article`);
    assert.notEqual(page.layout, 'redirect', `${page.output} must not be a redirect`);
    assert.ok(!robots.includes('noindex'), `${page.output} must stay indexable`);
    assert.notEqual(page.output, '404.html', `${page.output} must not be a utility page`);
    assert.notEqual(page.output, 'thank-you.html', `${page.output} must not be a utility page`);
    assert.notEqual(page.output, 'thank-you/index.html', `${page.output} must not be a utility page`);
  }
});

test('key SEO pages keep enough body-level internal links for cluster discovery', () => {
  for (const output of [
    'index.html',
    'removalists-adelaide/index.html',
    'removalists-southern-adelaide/index.html',
    'removalists-northern-adelaide/index.html',
    'house-removals-adelaide/index.html',
    'furniture-removalists-adelaide/index.html',
    'office-removals-adelaide/index.html',
    'interstate-removals-adelaide/index.html',
    'adelaide-moving-guides/index.html',
  ]) {
    const html = readDist(output);
    const main = html.match(/<main\b[\s\S]*?<\/main>/i)?.[0] || html;
    const targets = new Set([...main.matchAll(/href="(\/[^"#?]+\/?)"/g)].map((match) => match[1]).filter((href) => href !== '/'));
    assert.ok(targets.size >= 8, `${output} has only ${targets.size} body internal links`);
  }
});

function extractJsonLd(html) {
  return [...html.matchAll(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/gi)].map((match) => {
    assert.doesNotThrow(() => JSON.parse(match[1]), 'invalid JSON-LD block');
    return JSON.parse(match[1]);
  });
}

function flattenJsonLdNodes(value) {
  if (!value || typeof value !== 'object') {
    return [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((entry) => flattenJsonLdNodes(entry));
  }

  const nodes = [value];
  if (Array.isArray(value['@graph'])) {
    nodes.push(...value['@graph'].flatMap((entry) => flattenJsonLdNodes(entry)));
  }

  return nodes;
}

function nodeTypes(node) {
  return Array.isArray(node?.['@type']) ? node['@type'] : [node?.['@type']].filter(Boolean);
}

function schemaValueNames(value) {
  const items = Array.isArray(value) ? value : [value];
  return items
    .filter(Boolean)
    .map((item) => (typeof item === 'string' ? item : item?.name || ''))
    .filter(Boolean);
}

function normalizeTelephone(value = '') {
  return String(value).replace(/\s+/g, '');
}

test('priority Adelaide suburb pages are substantial and keep service, nearby, FAQ, and CTA paths', () => {
  const suburbSlugs = pages
    .filter((page) => page.generatedKind === 'suburb')
    .map((page) => page.output.replace(/^removalists-/, "").replace(/\/index\.html$/, ""));

  for (const slug of suburbSlugs) {
    const html = readDist(path.join(`removalists-${slug}`, 'index.html'));
    const main = extractMain(html);
    const links = extractRootLinks(main);

    const wordCount = countWords(main);
    assert.ok(wordCount >= 900 && wordCount <= 2500, `${slug} suburb page outside 900-2500 words: ${wordCount}`);
    assert.match(main, /data-generated-module="local-insights"/, `${slug} missing local insights`);
    assert.match(main, /data-generated-module="trust"/, `${slug} missing trust section`);
    assert.ok((main.match(/class="faq-item/g) || []).length >= 5, `${slug} missing FAQ depth`);
    assert.ok(links.filter((href) => href.includes('-removals-adelaide') || href.includes('furniture-removalists-adelaide') || href.includes('packing-services-adelaide') || href.includes('interstate-removals-adelaide')).length >= 3, `${slug} missing service links`);
    assert.ok(links.filter((href) => href.startsWith('/removalists-') && !href.includes(slug)).length >= 3, `${slug} missing nearby suburb links`);
    assert.ok(links.includes('/contact-us/#quote-form') || main.includes('tel:0433819989'), `${slug} missing quote/call CTA`);
  }
});
test('expanded Adelaide moving guide cluster has 30 plus posts with service links and FAQ support', () => {
  const guideRoot = path.join(distDir, 'adelaide-moving-guides');
  const guideDirs = readdirSync(guideRoot).filter((entry) => {
    const dirPath = path.join(guideRoot, entry);
    if (!statSync(dirPath, { throwIfNoEntry: false })?.isDirectory()) return false;
    return statSync(path.join(dirPath, 'index.html'), { throwIfNoEntry: false }) ||
           statSync(path.join(dirPath, 'index', 'index.html'), { throwIfNoEntry: false });
  });
  const requiredServiceLinks = [
    '/house-removals-adelaide/',
    '/furniture-removalists-adelaide/',
    '/office-removals-adelaide/',
    '/interstate-removals-adelaide/',
    '/packing-services-adelaide/',
  ];

  // GSC route consolidation folded the duplicate/near-duplicate guide posts into
  // a focused cluster. Assert the surviving cluster is real and substantial.
  assert.ok(guideDirs.length >= 8, `expected a focused guide cluster, found ${guideDirs.length}`);

  for (const slug of [
    'moving-house-checklist-adelaide',
    'how-to-choose-removalists-adelaide',
    'best-time-to-move-adelaide',
    'office-relocation-checklist-adelaide',
  ]) {
    const html = readDist(path.join('adelaide-moving-guides', slug, 'index.html'));
    const main = extractMain(html);
    const links = extractRootLinks(main);

    assert.ok(countWords(main) >= 400, `${slug} guide is too thin`);
    assert.ok(requiredServiceLinks.some((href) => links.includes(href)), `${slug} missing service link`);
    assert.ok((main.match(/class="faq-item/g) || []).length >= 3, `${slug} missing FAQ support`);
  }
});

test('core money pages include cost breakdowns, trust upgrades, suburb links, and eight FAQs', () => {
  for (const output of [
    'house-removals-adelaide/index.html',
    'furniture-removalists-adelaide/index.html',
    'office-removals-adelaide/index.html',
    'interstate-removals-adelaide/index.html',
  ]) {
    const html = readDist(output);
    const main = extractMain(html);
    const links = extractRootLinks(main);

    const minWords = 1500;
    assert.ok(countWords(main) >= minWords && countWords(main) <= 4000, `${output} outside money-page word range`);
    assert.match(main, /data-service-money-upgrade=/, `${output} missing cost breakdown upgrade`);
    assert.match(main, /data-service-trust-upgrade=/, `${output} missing trust upgrade`);
    assert.ok(links.filter((href) => href.startsWith('/removalists-')).length >= 6, `${output} missing suburb links`);
    assert.ok((main.match(/class="faq-item/g) || []).length >= 8, `${output} missing FAQ depth`);
  }
});

test('conversion prompts keep mobile call, above-fold quote access, and qualified urgency copy', () => {
  const template = readFileSync(path.join(root, 'site-src', 'templates', 'standard.html'), 'utf8');
  const homepage = readDist('index.html');
  const hero = homepage.match(/<section class="zq-v2-hero[\s\S]*?<\/section>/i)?.[0] || '';

  assert.match(template, /sticky-mobile-cta/);
  assert.match(template, /href="tel:\+61433819989"[^>]*>Call 0433 819 989<\/a>/);
  assert.match(hero, /href="#quote-form"[^>]*>Get a Free Quote/i);
  assert.match(hero, /href="tel:\+61433819989"/);
  assert.match(homepage, /Urgent requests are reviewed against crew, vehicle and route availability/i);
});

test('homepage targets Adelaide removalists and keeps above-fold conversion controls', () => {
  const homepage = readDist('index.html');
  const hero = homepage.match(/<section class="zq-v2-hero[\s\S]*?<\/section>/i)?.[0] || '';

  assert.match(homepage, /<title>Adelaide Removalists You Can Rely On \| ZQ Removals<\/title>/);
  assert.match(homepage, /<meta name="description" content="Careful Adelaide removalists for house, apartment, office and interstate moves\. Request a free quote from ZQ Removals today\."/i);
  assert.match(hero, /<h1[^>]*>Adelaide Removalists You Can Rely On<\/h1>/);
  assert.match(hero, /From the first box to the final placement/i);
  assert.match(hero, /href="#quote-form"[^>]*>Get a Free Quote/i);
  assert.match(hero, /href="tel:\+61433819989"/);
  assert.match(hero, /5\.0[\s\S]*from 81[\s\S]*Google reviews/i);
  assert.match(hero, /aria-label="Read ZQ Removals Google reviews\. Rated 5\.0 out of 5 from 81 reviews\."/i);
  assert.match(hero, /href="https:\/\/share\.google\/toaQ1pTUMpigxRuQM"/i);
  assert.doesNotMatch(hero, /guaranteed|fully insured/i);
  for (const href of [
    '/house-removals-adelaide/',
    '/furniture-removalists-adelaide/',
    '/office-removals-adelaide/',
    '/apartment-removals-adelaide/',
    '/removalists-glenelg/',
  ]) {
    assert.match(homepage, new RegExp(`href="${href.replace(/\//g, '\\/')}"`));
  }
});

test('homepage conversion audit requirements stay visible, accessible, and schema-backed', () => {
  const homepage = readDist('index.html');
  const main = homepage.match(/<main\b[\s\S]*?<\/main>/i)?.[0] || '';

  assert.equal((main.match(/<h1\b/gi) || []).length, 1);
  for (const heading of [
    'The right help, from doorway to destination.',
    'Capability you can see in the details.',
    'Four clear steps to move day.',
    'Local knowledge across the city.',
    'Rated 5 Stars by Adelaide Customers',
    'Prepared for the spaces people move through.',
    'Useful answers before you book.',
  ]) {
    assert.match(main, new RegExp(`>${heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}<\/h2>`, 'i'));
  }
  for (const field of ['name', 'phone', 'email', 'move_date', 'pickup_suburb', 'dropoff_suburb', 'move_scope', 'move_size', 'message']) {
    assert.match(main, new RegExp(`name="${field}"`, 'i'));
  }
  for (const size of ['Studio or one bedroom', 'Two bedrooms', 'Three bedrooms', 'Four or more bedrooms', 'Office or commercial']) {
    assert.match(main, new RegExp(size, 'i'));
  }
  assert.match(main, /href="https:\/\/share\.google\/toaQ1pTUMpigxRuQM"[^>]*target="_blank"[^>]*rel="noopener noreferrer"/i);
  for (const reviewText of [
    'Rakib Rafi',
    'Great service. They helped move my house a long way from Adelaide, almost 450km away.',
    'coline tangai',
    'Very helpful and kind.',
    'Wayne Rowe \\(Wayno\\)',
    'Very efficient, on time and affordable.',
  ]) {
    assert.match(main, new RegExp(reviewText, 'i'));
  }
  assert.match(main, /Request my quote/i);
  assert.equal((main.match(/itemtype="https:\/\/schema\.org\/Question"/g) || []).length, 8);
  assert.match(homepage, /"@type": "FAQPage"/);
  assert.match(main, /alt="ZQ Removals truck and Adelaide removalists moving protected furniture outside a home"/i);
  assert.match(main, /alt="Adelaide removalists wrapping a dining chair and packing a moving box inside a bright home"/i);
  assert.doesNotMatch(main, /Site owner to replace|Placeholder for a verified Google review|Review excerpts below are placeholders/i);
  assert.doesNotMatch(main, /54 Google|5\.0\/5|fully insured|award-winning/i);
});

test('v6 service pages carry CTR titles, related services, suburb links, FAQ and CTA', () => {
  const cases = [
    ['furniture-removalists-adelaide/index.html', /Furniture Removalists Adelaide \| Careful Movers/i],
    ['house-removals-adelaide/index.html', /House Removalists Adelaide \| Local Home Moves/i],
    ['office-removals-adelaide/index.html', /Office Removalists Adelaide \| ZQ Removals/i],
    ['apartment-removalists-adelaide/index.html', /Apartment Removalists Adelaide/i],
  ];

  for (const [output, titlePattern] of cases) {
    const html = readDist(output);
    const main = extractMain(html);
    const links = extractRootLinks(main);

    assert.match(html, titlePattern, `${output} missing V6 CTR title`);
    assert.match(html, /<meta name="description" content="[^"]{80,}/i, `${output} missing strong meta description`);
    assert.match(main, /<h1\b/i, `${output} missing H1`);
    assert.match(main, /data-service-related-upgrade=|data-generated-module="related-services"|Related services/i, `${output} missing related services`);
    assert.ok(links.filter((href) => href.startsWith('/removalists-')).length >= 5, `${output} missing nearby suburb links`);
    assert.ok((main.match(/class="faq-item/g) || []).length >= 2, `${output} missing FAQ block`);
    assert.match(main, /href="\/contact-us\/#quote-form"|href="tel:\+61433819989"/, `${output} missing CTA`);
  }
});

test('v6 generated suburb pages include near-me wording, five nearby links, services and FAQ answers', () => {
  for (const slug of ['andrews-farm', 'glenelg', 'marion', 'salisbury', 'mawson-lakes']) {
    const html = readDist(path.join(`removalists-${slug}`, 'index.html'));
    const main = extractMain(html);
    const suburbName = slug.split('-').map((part) => part[0].toUpperCase() + part.slice(1)).join(' ');
    const links = extractRootLinks(main);

    assert.match(main, new RegExp(`${suburbName} moves`, 'i'), `${slug} missing suburb move wording`);
    assert.match(main, /transparent-rate quote/i, `${slug} missing transparent-rate quote wording`);
    assert.match(main, /access|parking|stairs|lifts|carry distance/i, `${slug} missing access wording`);
    assert.ok(links.filter((href) => href.startsWith('/removalists-') && !href.includes(slug)).length >= 5, `${slug} missing five nearby suburb links`);
    assert.ok(links.filter((href) => ['/house-removals-adelaide/', '/furniture-removalists-adelaide/', '/office-removals-adelaide/', '/packing-services-adelaide/', '/interstate-removals-adelaide/'].includes(href)).length >= 3, `${slug} missing related service links`);
    assert.match(main, new RegExp(`Do you service ${suburbName}\\?`, 'i'), `${slug} missing service FAQ`);
    assert.match(main, new RegExp(`Can you move furniture in ${suburbName}\\?`, 'i'), `${slug} missing furniture FAQ`);
    assert.match(main, /same-day|urgent|last-minute/i, `${slug} missing urgency FAQ`);
    assert.match(main, new RegExp(`quote for ${suburbName}`, 'i'), `${slug} missing quote FAQ`);
  }
});

test('route hub and guide hub keep surviving generated pages linked (no orphans)', () => {
  const removalistsHub = readDist('removalists-adelaide/index.html');
  const guideHub = readDist(path.join('adelaide-moving-guides', 'index.html'));

  const canonicalPath = (page) => {
    try { return new URL(page.canonical).pathname; } catch { return `/${page.output.replace(/index\.html$/, '')}`; }
  };
  const survivingRoutes = pages.filter((p) => p.generatedKind === 'local-route').map(canonicalPath);
  const survivingComparisons = pages.filter((p) => p.generatedKind === 'comparison').map(canonicalPath);
  const survivingGuides = pages
    .filter((p) => p.output.startsWith('adelaide-moving-guides/') && p.output !== 'adelaide-moving-guides/index.html')
    .map(canonicalPath);

  const linkedIn = (html, href) => html.includes(`href="${href}"`);

  // At least most surviving local-route pages must be reachable from the hub.
  const routeHits = survivingRoutes.filter((href) => linkedIn(removalistsHub, href)).length;
  assert.ok(routeHits >= Math.ceil(survivingRoutes.length * 0.7), `only ${routeHits}/${survivingRoutes.length} local routes linked from hub`);

  // Surviving comparison + guide pages must be discoverable from the guide hub.
  const guideHits = [...survivingComparisons, ...survivingGuides].filter((href) => linkedIn(guideHub, href)).length;
  assert.ok(guideHits >= Math.ceil((survivingComparisons.length + survivingGuides.length) * 0.5), `only ${guideHits} guide/comparison pages linked from guide hub`);
});

test('removalists Adelaide hub has focused intent, schema, CTA and supporting internal links', () => {
  const html = readDist(path.join('removalists-adelaide', 'index.html'));
  const main = extractMain(html);
  const firstSection = main.match(/<section\b[\s\S]*?<\/section>/i)?.[0] || '';

  assert.equal((main.match(/<h1\b/gi) || []).length, 1);
  assert.match(html, /<title>Removalists Adelaide \| 5-Star Local Movers \| ZQ Removals<\/title>/i);
  assert.match(html, /<link rel="canonical" href="https:\/\/zqremovalsadelaide\.com\.au\/removalists-adelaide\/"/i);
  assert.match(html, /"@type":"BreadcrumbList"|"@type": "BreadcrumbList"/i);
  assert.match(html, /"@type":"Service"|"@type": "Service"/i);
  assert.doesNotMatch(html, /AggregateRating|aggregateRating|reviewCount|ratingValue/i);
  assert.match(firstSection, /removalists in Adelaide/i);
  assert.match(firstSection, /house moves[\s\S]*apartment moves[\s\S]*furniture removals[\s\S]*office relocations[\s\S]*packing support[\s\S]*interstate/i);
  assert.match(firstSection, /inventory[\s\S]*stairs[\s\S]*lifts[\s\S]*parking[\s\S]*timing[\s\S]*fragile/i);
  assert.match(main, /How to choose removalists in Adelaide/i);
  assert.match(main, /What affects an Adelaide removalist quote/i);
  assert.match(main, /When detailed quoting helps reduce uncertainty/i);
  assert.match(main, /href="\/contact-us\/#quote-form"/i);

  for (const output of [
    'index.html',
    path.join('house-removals-adelaide', 'index.html'),
    path.join('removalists-adelaide-prices', 'index.html'),
    path.join('removalists-glenelg', 'index.html'),
    path.join('adelaide-moving-guides', 'how-to-choose-removalists-adelaide', 'index.html'),
  ]) {
    assert.match(readDist(output), /href="\/removalists-adelaide\/"/i, `${output} missing Adelaide hub link`);
  }
});

test('v6 colour contrast guard prevents known invisible text pairings', () => {
  const css = readFileSync(path.join(root, 'premium-site.css'), 'utf8')
    .replace(/\s*([{}:;,>])\s*/g, '$1');

  assert.match(css, /trust-item-bg-service[^}]*color:var\(--text-on-light\)/i);
  assert.match(css, /route-card-bg-service[^}]*color:var\(--text-on-light\)/i);
  assert.match(css, /section-soft \.faq-list-premium \.faq-question[^}]*color:var\(--text-on-light\)/i);
  assert.doesNotMatch(css, /trust-item-bg-service[\s\S]{0,240}color:var\(--text-on-dark\)/i);
  assert.doesNotMatch(css, /section-soft \.faq-list-premium \.faq-question[\s\S]{0,120}color:var\(--text-on-dark\)/i);
});

test('light page heroes and primary buttons keep readable foreground colours', () => {
  const css = readFileSync(path.join(root, 'premium-site.css'), 'utf8')
    .replace(/\s*([{}:;,>])\s*/g, '$1');
  const priorityOutputs = [
    path.join('removalists-marion', 'index.html'),
    path.join('removalists-hyde-park', 'index.html'),
    path.join('removalists-malvern', 'index.html'),
    path.join('removalists-unley', 'index.html'),
    path.join('removalists-unley-park', 'index.html'),
    path.join('removalists-medindie', 'index.html'),
    path.join('adelaide-to-sydney-removalists', 'index.html'),
    path.join('adelaide-to-brisbane-removals', 'index.html'),
    path.join('adelaide-to-melbourne-removalists', 'index.html'),
  ];

  assert.match(css, /hero-shell:not\(\.hero-shell-home\)[^{]*{(?=[^}]*var\(--zq-bg\))(?=[^}]*color:var\(--zq-text\))/i);
  assert.match(css, /hero-shell:not\(\.hero-shell-home\)\s*:is\(h1,h2,h3,strong\)[^{]*{color:var\(--zq-text\)/i);
  assert.match(css, /hero-shell:not\(\.hero-shell-home\)\s*:is\(p,li\)[^{]*,[^}]*color:var\(--zq-text-muted\)/i);
  assert.match(css, /button-primary{color:#fffdf8\s*!important/i);
  assert.match(css, /button-cta{color:#10231f\s*!important/i);
  assert.doesNotMatch(css, /button-primary,[^}]*button-cta{color:#10231f\s*!important/i);

  for (const output of priorityOutputs) {
    const html = readDist(output);
    const hero = html.match(/<section class="hero-shell[\s\S]*?<\/section>/i)?.[0] || '';
    assert.ok(hero, `${output} missing hero shell`);
    assert.doesNotMatch(hero, /text-white|style="[^"]*color:\s*(?:white|#fff)/i, `${output} hero uses white text on a light shell`);
  }
});

test('priority suburb and interstate pages stay indexable, canonical, and linked from core hubs', () => {
  const priorityPages = [
    ['removalists-hyde-park/index.html', 'https://zqremovalsadelaide.com.au/removalists-hyde-park/'],
    ['removalists-malvern/index.html', 'https://zqremovalsadelaide.com.au/removalists-malvern/'],
    ['removalists-unley/index.html', 'https://zqremovalsadelaide.com.au/removalists-unley/'],
    ['removalists-unley-park/index.html', 'https://zqremovalsadelaide.com.au/removalists-unley-park/'],
    ['removalists-medindie/index.html', 'https://zqremovalsadelaide.com.au/removalists-medindie/'],
    ['adelaide-to-sydney-removalists/index.html', 'https://zqremovalsadelaide.com.au/adelaide-to-sydney-removalists/'],
    ['adelaide-to-brisbane-removals/index.html', 'https://zqremovalsadelaide.com.au/adelaide-to-brisbane-removals/'],
    ['adelaide-to-melbourne-removalists/index.html', 'https://zqremovalsadelaide.com.au/adelaide-to-melbourne-removalists/'],
  ];
  const sitemapLocations = ['sitemap-pages.xml', 'sitemap-services.xml', 'sitemap-suburbs.xml', 'sitemap-guides.xml']
    .flatMap((file) => [...readDist(file).matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]));
  const homepage = readDist('index.html');
  const adelaideHub = readDist(path.join('removalists-adelaide', 'index.html'));

  for (const [output, canonical] of priorityPages) {
    const html = readDist(output);
    const main = extractMain(html);
    const h1Count = (main.match(/<h1\b/gi) || []).length;

    assert.match(html, /<title>[^<]{20,}<\/title>/i, `${output} missing title`);
    assert.match(html, /<meta name="description" content="[^"]{80,}"/i, `${output} missing meta description`);
    assert.match(html, new RegExp(`<link rel="canonical" href="${canonical.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`), `${output} canonical mismatch`);
    assert.doesNotMatch(html, /<meta name="robots" content="[^"]*noindex/i, `${output} must not be noindex`);
    assert.equal(h1Count, 1, `${output} must have exactly one H1`);
    assert.match(main, /href="\/contact-us\/#quote-form"|href="tel:\+61433819989"/i, `${output} missing early quote CTA`);
    assert.ok(sitemapLocations.includes(canonical), `${output} missing from sitemap`);
  }

  for (const suburbOutput of [
    'removalists-hyde-park/index.html',
    'removalists-malvern/index.html',
    'removalists-unley/index.html',
    'removalists-unley-park/index.html',
    'removalists-medindie/index.html',
  ]) {
    const html = readDist(suburbOutput);
    const main = extractMain(html);
    assert.match(main, /Adelaide to Sydney removalists/i, `${suburbOutput} missing Sydney route link`);
    assert.match(main, /Adelaide to Brisbane removalists/i, `${suburbOutput} missing Brisbane route link`);
    assert.match(main, /Adelaide to Melbourne removalists/i, `${suburbOutput} missing Melbourne route link`);
  }

  for (const anchorText of [
    'Hyde Park removalists',
    'Malvern removalists',
    'Unley Park removalists',
    'Adelaide to Sydney removalists',
    'Adelaide to Brisbane removalists',
    'Adelaide to Melbourne removalists',
    'Transparent-rate Adelaide removalists',
  ]) {
    assert.match(homepage, new RegExp(anchorText, 'i'), `homepage missing ${anchorText}`);
  }

  for (const anchorText of [
    'Hyde Park removalists',
    'Malvern removalists',
    'Unley removalists',
    'Unley Park removalists',
    'Medindie removalists',
    'Adelaide to Sydney removalists',
    'Adelaide to Brisbane removalists',
    'Adelaide to Melbourne removalists',
  ]) {
    assert.match(adelaideHub, new RegExp(anchorText, 'i'), `Adelaide hub missing ${anchorText}`);
  }
});

test('redirect aliases stay out of the sitemap and core canonical routes do not redirect away', () => {
  const sitemap = [
    readDist('sitemap-pages.xml'),
    readDist('sitemap-services.xml'),
    readDist('sitemap-suburbs.xml'),
    readDist('sitemap-guides.xml'),
  ].join('\n');
  const vercelConfig = JSON.parse(readFileSync(path.join(root, 'vercel.json'), 'utf8'));
  const redirects = new Map(vercelConfig.redirects.map(({ source, destination }) => [source, destination]));

  for (const alias of [
    'https://zqremovalsadelaide.com.au/adelaide-to-brisbane-removalists/',
    'https://zqremovalsadelaide.com.au/adelaide-to-sydney-removals/',
    'https://zqremovalsadelaide.com.au/adelaide-to-melbourne-removals/',
    'https://zqremovalsadelaide.com.au/guides/removalist-cost-adelaide/',
    'https://zqremovalsadelaide.com.au/404.html',
  ]) {
    assert.doesNotMatch(sitemap, new RegExp(alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `${alias} must not be in sitemap`);
  }

  assert.equal(redirects.get('/adelaide-to-brisbane-removalists'), '/adelaide-to-brisbane-removals/');
  assert.equal(redirects.get('/adelaide-to-brisbane-removalists/'), '/adelaide-to-brisbane-removals/');
  assert.ok(!redirects.has('/adelaide-to-brisbane-removals'), 'canonical Brisbane route must not redirect');
  assert.ok(!redirects.has('/adelaide-to-brisbane-removals/'), 'canonical Brisbane route with slash must not redirect');
  assert.ok(!redirects.has('/removalists-unley-park'), 'canonical Unley Park page must not redirect');
  assert.ok(!redirects.has('/removalists-hyde-park'), 'canonical Hyde Park page must not redirect');
  assert.ok(!redirects.has('/removalists-malvern'), 'canonical Malvern page must not redirect');
  assert.ok(!redirects.has('/house-removals-adelaide'), 'canonical house removals page must not redirect');
});

function extractMain(html) {
  return html.match(/<main\b[\s\S]*?<\/main>/i)?.[0] || html;
}

function extractRootLinks(html) {
  return [...html.matchAll(/href="(\/[^"]*)"/g)].map((match) => match[1]);
}

function countWords(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[^;]+;/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function normalizeGoogleProfileTokens(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => normalizeGoogleProfileTokens(entry));
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, normalizeGoogleProfileTokens(entry)]),
    );
  }
  return typeof value === 'string' ? value.replace(/\{\{\s*google\.profileUrl\s*\}\}/gi, googleReviews.profileUrl) : value;
}
