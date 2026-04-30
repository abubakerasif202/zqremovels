import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { getGeneratedPages, mergePagesByOutput } from '../site-src/data/seo-v4.mjs';

const root = process.cwd();
const distDir = path.join(root, 'site-dist');
const pages = mergePagesByOutput(
  JSON.parse(readFileSync(path.join(root, 'site-src', 'pages.json'), 'utf8')),
  getGeneratedPages(),
);

function readDist(relativePath) {
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

function shouldIncludeInSitemap(page) {
  return !isRedirectPage(page) &&
    !isNoindexPage(page) &&
    !isUtilityPage(page) &&
    !isPreviewPage(page) &&
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

  assert.doesNotMatch(sitemap, /https:\/\/www\.zqremovals\.au\//);
  assert.match(sitemap, /<sitemapindex/);
  assert.match(homepage, /<link rel="canonical" href="https:\/\/zqremovals\.au\/" \/>/);
  assert.match(
    interstateHub,
    /<link rel="canonical" href="https:\/\/zqremovals\.au\/interstate-removals-adelaide\/" \/>/,
  );
  assert.match(robots, /Sitemap: https:\/\/zqremovals\.au\/sitemap-index\.xml/);
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
    .map((page) => `https://zqremovals.au${outputToRoute(page.output)}`);

  assert.deepEqual(new Set(locations), new Set(expected));

  for (const page of pages.filter((page) => !shouldIncludeInSitemap(page))) {
    assert.ok(
      !locations.includes(`https://zqremovals.au${outputToRoute(page.output)}`),
      `unexpected sitemap inclusion for ${page.output}`,
    );
  }
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

test('critical generated pages do not contain broken internal links', () => {
  const criticalPages = [
    'index.html',
    path.join('removalists-adelaide', 'index.html'),
    path.join('interstate-removals-adelaide', 'index.html'),
    path.join('office-removals-adelaide', 'index.html'),
    path.join('packing-services-adelaide', 'index.html'),
    path.join('furniture-removalists-adelaide', 'index.html'),
    path.join('house-removals-adelaide', 'index.html'),
    path.join('adelaide-moving-guides', 'index.html'),
  ];

  for (const relativePath of criticalPages) {
    const html = readDist(relativePath);
    for (const match of html.matchAll(/href="([^"]+)"/g)) {
      const href = match[1];
      if (!href.startsWith('/') || href.startsWith('//')) {
        continue;
      }

      const cleanHref = href.split('#')[0].split('?')[0];
      if (!cleanHref || cleanHref.startsWith('/api/')) {
        continue;
      }

      let targetPath;
      if (cleanHref === '/') {
        targetPath = path.join(distDir, 'index.html');
      } else if (cleanHref.endsWith('/')) {
        targetPath = path.join(distDir, cleanHref.slice(1), 'index.html');
      } else {
        targetPath = path.join(distDir, cleanHref.slice(1));
      }

      assert.ok(
        statSync(targetPath, { throwIfNoEntry: false }),
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
    assert.ok(h1s.length >= 1, `missing h1 for ${page.output}`);
    assert.ok(h1s.every(Boolean), `empty h1 for ${page.output}`);
    assert.ok(h2Count >= 1, `missing h2 structure for ${page.output}`);
    assert.match(html, /<meta property="og:title" content="[^"]+"/i, `missing og:title for ${page.output}`);
    assert.match(html, /<meta property="og:description" content="[^"]+"/i, `missing og:description for ${page.output}`);
    assert.match(html, /<meta property="og:image" content="https:\/\/zqremovals\.au\/[^"]+"/i, `missing apex og:image for ${page.output}`);
    assert.match(html, /<meta name="twitter:card" content="summary_large_image"/i, `missing twitter card for ${page.output}`);
    assert.match(html, /<meta name="twitter:title" content="[^"]+"/i, `missing twitter:title for ${page.output}`);
    assert.match(html, /<meta name="twitter:description" content="[^"]+"/i, `missing twitter:description for ${page.output}`);

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
          assert.equal(node.url, 'https://zqremovals.au/', `MovingCompany URL mismatch in ${relativePath}`);
          assert.ok(node.telephone, `MovingCompany missing telephone in ${relativePath}`);
          assert.ok(Array.isArray(node.sameAs) && node.sameAs.includes('https://share.google/Y04mpt9RTflWP3iRl'), `MovingCompany missing sameAs in ${relativePath}`);
          assert.equal(node.openingHours, undefined, `unverified openingHours published in ${relativePath}`);
          assert.equal(node.openingHoursSpecification, undefined, `unverified openingHoursSpecification published in ${relativePath}`);
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
    [path.join('adelaide-moving-guides', 'interstate-moving-checklist-adelaide', 'index.html'), ['Article', 'FAQPage', 'BreadcrumbList']],
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

test('priority Adelaide suburb pages are substantial and keep service, nearby, FAQ, and CTA paths', () => {
  const suburbSlugs = [
    'glenelg',
    'norwood',
    'prospect',
    'salisbury',
    'marion',
    'mawson-lakes',
    'unley',
    'port-adelaide',
    'modbury',
    'henley-beach',
    'semaphore',
    'brighton',
    'blackwood',
    'burnside',
    'gawler',
    'seaford',
    'noarlunga',
    'morphett-vale',
    'west-lakes',
    'grange',
    'findon',
    'woodville',
    'golden-grove',
    'mount-barker',
    'adelaide-cbd',
    'north-adelaide',
    'goodwood',
    'magill',
    'campbelltown',
    'athelstone',
    'parafield-gardens',
    'pennington',
    'hove',
    'seacliff',
    'christies-beach',
    'port-noarlunga',
    'oaklands-park',
    'edwardstown',
    'melrose-park',
    'fulham',
    'kidman-park',
    'largs-bay',
    'croydon',
    'kilburn',
    'walkerville',
    'clearview',
    'klemzig',
    'mitcham',
    'plympton',
    'tea-tree-gully',
  ];

  for (const slug of suburbSlugs) {
    const html = readDist(path.join(`removalists-${slug}`, 'index.html'));
    const main = extractMain(html);
    const links = extractRootLinks(main);

    const wordCount = countWords(main);
    assert.ok(wordCount >= 900 && wordCount <= 1500, `${slug} suburb page outside 900-1500 words: ${wordCount}`);
    assert.match(main, /data-generated-module="local-insights"/, `${slug} missing local insights`);
    assert.match(main, /data-generated-module="trust"/, `${slug} missing trust section`);
    assert.ok((main.match(/class="faq-item/g) || []).length >= 5, `${slug} missing FAQ depth`);
    assert.ok(links.filter((href) => href.includes('-removals-adelaide') || href.includes('furniture-removalists-adelaide') || href.includes('packing-services-adelaide') || href.includes('interstate-removals-adelaide')).length >= 3, `${slug} missing service links`);
    assert.ok(links.filter((href) => href.startsWith('/removalists-') && !href.includes(slug)).length >= 3, `${slug} missing nearby suburb links`);
    assert.ok(links.includes('/contact-us/#quote-form') || main.includes('tel:+61433819989'), `${slug} missing quote/call CTA`);
  }
});

test('expanded Adelaide moving guide cluster has 30 plus posts with service links and FAQ support', () => {
  const guideRoot = path.join(distDir, 'adelaide-moving-guides');
  const guideDirs = readdirSync(guideRoot).filter((entry) =>
    statSync(path.join(guideRoot, entry), { throwIfNoEntry: false })?.isDirectory() &&
    statSync(path.join(guideRoot, entry, 'index.html'), { throwIfNoEntry: false }),
  );
  const requiredServiceLinks = [
    '/house-removals-adelaide/',
    '/furniture-removalists-adelaide/',
    '/office-removals-adelaide/',
    '/interstate-removals-adelaide/',
    '/packing-services-adelaide/',
  ];

  assert.ok(guideDirs.length >= 30, `expected at least 30 guide posts, found ${guideDirs.length}`);

  for (const slug of [
    'removalist-cost-breakdown-adelaide',
    'how-much-do-movers-cost-adelaide',
    'cheap-vs-professional-removalists-adelaide',
    'hourly-vs-fixed-price-movers-adelaide',
    'moving-house-checklist-adelaide',
    'last-minute-movers-adelaide-guide',
    'moving-with-stairs-adelaide',
    'office-relocation-checklist-adelaide-guide',
  ]) {
    const html = readDist(path.join('adelaide-moving-guides', slug, 'index.html'));
    const main = extractMain(html);
    const links = extractRootLinks(main);

    assert.ok(countWords(main) >= 800, `${slug} guide is too thin`);
    assert.ok(requiredServiceLinks.some((href) => links.includes(href)), `${slug} missing service link`);
    assert.ok((main.match(/class="faq-item/g) || []).length >= 5, `${slug} missing FAQ support`);
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

    assert.ok(countWords(main) >= 1500 && countWords(main) <= 2500, `${output} outside money-page word range`);
    assert.match(main, /data-service-money-upgrade=/, `${output} missing cost breakdown upgrade`);
    assert.match(main, /data-service-trust-upgrade=/, `${output} missing trust upgrade`);
    assert.ok(links.filter((href) => href.startsWith('/removalists-')).length >= 6, `${output} missing suburb links`);
    assert.ok((main.match(/class="faq-item/g) || []).length >= 8, `${output} missing FAQ depth`);
  }
});

test('conversion prompts keep mobile call, above-fold quote access, and qualified urgency copy', () => {
  const template = readFileSync(path.join(root, 'site-src', 'templates', 'standard.html'), 'utf8');
  const homepage = readDist('index.html');
  const hero = homepage.match(/<section class="hero-shell[\s\S]*?<\/section>/i)?.[0] || '';

  assert.match(template, /sticky-mobile-cta/);
  assert.match(template, /href="tel:\+61433819989"[^>]*>Call Now<\/a>/);
  assert.match(hero, /hero-quote-form/);
  assert.match(hero, /Limited slots this week/i);
  assert.match(hero, /Same-day bookings available subject to/i);
});

test('v6 homepage targets premium Adelaide removalists and above-fold CTAs', () => {
  const homepage = readDist('index.html');
  const hero = homepage.match(/<section class="hero-shell[\s\S]*?<\/section>/i)?.[0] || '';

  assert.match(homepage, /<title>Removalists Adelaide \| Affordable Fixed-Price Movers \| ZQ Removals<\/title>/);
  assert.match(homepage, /<meta name="description" content="[^"]*Adelaide removalists[^"]*affordable fixed-price options[^"]*house[^"]*furniture[^"]*office/i);
  assert.match(hero, /<h1>Premium Adelaide Removalists<\/h1>/);
  assert.match(hero, /href="tel:\+61433819989"[^>]*>Call 0433 819 989<\/a>/);
  assert.match(hero, /href="\/contact-us\/#quote-form"[^>]*>Get Free Quote<\/a>/);
  assert.match(hero, /Same Day &amp; Local Moves|Same Day & Local Moves/);
  for (const phrase of ['Local Adelaide team', 'Careful furniture handling', 'Fixed-price quote options', 'Fast response', '5.0 Google Rating', '38 Google Reviews']) {
    assert.match(hero, new RegExp(phrase, 'i'));
  }
  for (const href of [
    '/house-removals-adelaide/',
    '/furniture-removalists-adelaide/',
    '/office-removals-adelaide/',
    '/apartment-removalists-adelaide/',
    '/removalists-andrews-farm/',
  ]) {
    assert.match(homepage, new RegExp(`href="${href.replace(/\//g, '\\/')}"`));
  }
});

test('v6 service pages carry CTR titles, related services, suburb links, FAQ and CTA', () => {
  const cases = [
    ['furniture-removalists-adelaide/index.html', /Furniture Removalists Adelaide \| Careful Furniture Movers/i],
    ['house-removals-adelaide/index.html', /House Removalists Adelaide \| Premium Home Moving Services/i],
    ['office-removals-adelaide/index.html', /Office Removalists Adelaide \| Business Relocation Services/i],
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

    assert.match(main, new RegExp(`removalists near ${suburbName}`, 'i'), `${slug} missing near-me wording`);
    assert.ok(links.filter((href) => href.startsWith('/removalists-') && !href.includes(slug)).length >= 5, `${slug} missing five nearby suburb links`);
    assert.ok(links.filter((href) => ['/house-removals-adelaide/', '/furniture-removalists-adelaide/', '/office-removals-adelaide/', '/packing-services-adelaide/', '/interstate-removals-adelaide/'].includes(href)).length >= 3, `${slug} missing related service links`);
    assert.match(main, new RegExp(`Do you service ${suburbName}\\?`, 'i'), `${slug} missing service FAQ`);
    assert.match(main, new RegExp(`Can you move furniture in ${suburbName}\\?`, 'i'), `${slug} missing furniture FAQ`);
    assert.match(main, new RegExp(`same-day removals near ${suburbName}`, 'i'), `${slug} missing same-day FAQ`);
    assert.match(main, new RegExp(`quote for ${suburbName}`, 'i'), `${slug} missing quote FAQ`);
  }
});

test('v6 colour contrast guard prevents known invisible text pairings', () => {
  const css = readDist('premium-site.min.css');

  assert.match(css, /trust-item-bg-service[^}]*color:var\(--text-on-light\)/i);
  assert.match(css, /route-card-bg-service[^}]*color:var\(--text-on-light\)/i);
  assert.match(css, /section-soft \.faq-list-premium \.faq-question[^}]*color:var\(--text-on-light\)/i);
  assert.doesNotMatch(css, /trust-item-bg-service[\s\S]{0,240}color:var\(--text-on-dark\)/i);
  assert.doesNotMatch(css, /section-soft \.faq-list-premium \.faq-question[\s\S]{0,120}color:var\(--text-on-dark\)/i);
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
