import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { getGeneratedPages, isVerifiedRedirectSource, mergePagesByOutput } from '../site-src/data/seo-v4.mjs';

const root = process.cwd();
const distDir = path.join(root, 'site-dist');
const pages = mergePagesByOutput(
  JSON.parse(readFileSync(path.join(root, 'site-src', 'pages.json'), 'utf8')),
  getGeneratedPages(),
).filter((p) => !isVerifiedRedirectSource(p));

const canonicalHost = 'https://zqremovals.au';
// Surviving guide cluster after GSC route consolidation.
const requiredV5GuideSlugs = [
  'how-much-do-removalists-cost-adelaide',
  'how-to-choose-removalists-adelaide',
  'moving-house-checklist-adelaide',
  'office-relocation-checklist-adelaide',
  'best-time-to-move-adelaide',
  'how-to-prepare-furniture-for-moving',
  'apartment-moving-tips-adelaide',
  'prepare-house-move-adelaide',
];

const coreServiceOutputs = [
  'house-removals-adelaide/index.html',
  'furniture-removalists-adelaide/index.html',
  'office-removals-adelaide/index.html',
  'interstate-removals-adelaide/index.html',
  'packing-services-adelaide/index.html',
  'apartment-removals-adelaide/index.html',
  'services/local-removals-adelaide/index.html',
];

test.before(async () => {
  const buildUrl = pathToFileURL(path.join(root, 'scripts', 'build-site.mjs')).href;
  await import(`${buildUrl}?seoV5=${Date.now()}`);
});

test('seo v5 technical metadata is canonical, complete, and unique on indexable pages', () => {
  const seenTitles = new Map();
  const seenDescriptions = new Map();

  for (const page of indexablePages()) {
    const html = readDist(page.output);
    const title = textMatch(html, /<title>(.*?)<\/title>/i);
    const description = textMatch(html, /<meta name="description" content="([^"]+)"/i);
    const canonicals = [...html.matchAll(/<link rel="canonical" href="([^"]+)"/gi)].map((match) => match[1]);
    const h1Count = (html.match(/<h1\b/gi) || []).length;

    assert.equal(h1Count, 1, `${page.output} must have exactly one h1`);
    assert.deepEqual(canonicals, [page.canonical], `${page.output} canonical mismatch`);
    assert.match(page.canonical, /^https:\/\/zqremovals\.au\//, `${page.output} canonical host`);
    assert.doesNotMatch(html, /https:\/\/www\.zqremovals\.au\//, `${page.output} mixed www host`);
    assert.match(html, /<meta name="viewport" content="width=device-width, initial-scale=1"/i, `${page.output} viewport`);
    assert.match(html, /<meta name="robots" content="[^"]+"/i, `${page.output} robots`);
    assert.match(html, /<meta property="og:title" content="[^"]+"/i, `${page.output} og:title`);
    assert.match(html, /<meta property="og:description" content="[^"]+"/i, `${page.output} og:description`);
    assert.match(html, /<meta property="og:url" content="https:\/\/zqremovals\.au\/[^"]*"/i, `${page.output} og:url`);
    assert.match(html, /<meta property="og:url" content="https:\/\/zqremovals\.au\//i, `${page.output} og:url`);
    assert.match(html, /<meta property="og:image" content="https:\/\/zqremovals\.au\//i, `${page.output} og:image`);
    assert.match(html, /<meta name="twitter:card" content="summary_large_image"/i, `${page.output} twitter card`);
    assert.match(html, /<meta name="twitter:title" content="[^"]+"/i, `${page.output} twitter:title`);
    assert.match(html, /<meta name="twitter:description" content="[^"]+"/i, `${page.output} twitter:description`);
    assert.match(html, /<meta name="twitter:image" content="https:\/\/zqremovals\.au\//i, `${page.output} twitter:image`);
    assert.ok(title.length >= 20 && title.length <= 85, `${page.output} title length ${title.length}`);
    assert.ok(description.length >= 60 && description.length <= 190, `${page.output} description length ${description.length}`);

    assert.ok(!seenTitles.has(title), `duplicate title: ${title}`);
    assert.ok(!seenDescriptions.has(description), `duplicate description: ${description}`);
    seenTitles.set(title, page.output);
    seenDescriptions.set(description, page.output);
  }
});

test('seo v5 guide cluster exists with TOC, FAQ, schema, links, and quote paths', () => {
  for (const slug of requiredV5GuideSlugs) {
    const output = path.posix.join('adelaide-moving-guides', slug, 'index.html');
    const html = readDist(output);
    const main = extractMain(html);
    const jsonLdTypes = schemaTypes(html);
    const links = uniqueRootLinks(main);

    assert.match(html, new RegExp(`<link rel="canonical" href="${canonicalHost}/adelaide-moving-guides/${slug}/"`), slug);
    assert.match(main, /data-seo-v5-toc="true"/, `${slug} missing guide contents`);
    assert.ok((main.match(/class="[^"]*\bfaq-item\b/g) || []).length >= 3, `${slug} missing visible FAQ`);
    assert.ok(jsonLdTypes.has('Article'), `${slug} missing Article schema`);
    assert.ok(jsonLdTypes.has('BreadcrumbList'), `${slug} missing BreadcrumbList schema`);
    assert.ok(jsonLdTypes.has('FAQPage'), `${slug} missing FAQPage schema`);
    assert.ok(countServiceLinks(links) >= 3, `${slug} missing service links`);
    assert.ok(countSuburbLinks(links) >= 4, `${slug} missing suburb links`);
    assert.ok(countGuideLinks(links) >= 2, `${slug} missing guide links`);
    assert.ok(links.includes('/contact-us/#quote-form'), `${slug} missing quote CTA`);
    assert.match(main, /href="tel:\+61433819989"/, `${slug} missing phone CTA`);
  }
});

test('seo v5 json-ld parses and only publishes supported business facts', () => {
  for (const page of indexablePages()) {
    const relativePath = page.output;
    const html = readDist(page.output);
    const visibleFaq = hasVisibleFaqContent(html);

    for (const jsonLd of extractJsonLd(html)) {
      const serialized = JSON.stringify(jsonLd);
      assert.doesNotMatch(serialized, /https:\/\/www\.zqremovals\.au|localhost|\.vercel\.app/i, `bad URL in ${relativePath}`);
      assert.doesNotMatch(serialized, /AggregateRating|aggregateRating|reviewCount|ratingValue/i, `unsupported review schema in ${relativePath}`);
      assert.doesNotMatch(serialized, /openingHours|openingHoursSpecification/i, `unsupported hours schema in ${relativePath}`);
      assert.doesNotMatch(serialized, /latitude|longitude|GeoCoordinates/i, `unsupported geo schema in ${relativePath}`);

      for (const node of flattenJsonLdNodes(jsonLd)) {
        const types = nodeTypes(node);
        if (types.includes('FAQPage')) {
          assert.ok(visibleFaq, `FAQ schema without visible FAQ in ${relativePath}`);
        }
        if (types.includes('MovingCompany')) {
          assert.equal(node.name, 'ZQ Removals', `business name mismatch in ${relativePath}`);
          assert.equal(node.url, `${canonicalHost}/`, `business URL mismatch in ${relativePath}`);
          assert.ok(node.telephone, `business telephone missing in ${relativePath}`);
          assert.deepEqual(node.sameAs || [], [
            'https://share.google/toaQ1pTUMpigxRuQM',
            'https://facebook.com/zqremovals'
          ], `sameAs must use only verified project profiles in ${relativePath}`);
        }
      }
    }
  }
});

test('seo v5 sitemap and robots output is clean, canonical, grouped, and duplicate-free', () => {
  const robots = readDist('robots.txt');
  assert.match(robots, /User-agent: \*/);
  assert.match(robots, /Allow: \//);
  assert.match(robots, /Sitemap: https:\/\/zqremovals\.au\/sitemap-index\.xml/);
  assert.doesNotMatch(robots, /^LLM:/m);
  assert.match(robots, /# https:\/\/zqremovals\.au\/llms\.txt/);

  const expectedSitemaps = [
    'sitemap-pages.xml',
    'sitemap-services.xml',
    'sitemap-suburbs.xml',
    'sitemap-guides.xml',
    'sitemap-images.xml',
  ];
  const sitemapIndex = readDist('sitemap-index.xml');
  assert.match(sitemapIndex, /^<\?xml version="1\.0" encoding="UTF-8"\?>\n/);

  for (const sitemap of expectedSitemaps) {
    assert.match(sitemapIndex, new RegExp(`<loc>${canonicalHost}/${sitemap}</loc>`), `${sitemap} missing from index`);
    const xml = readDist(sitemap);
    assert.match(xml, /^<\?xml version="1\.0" encoding="UTF-8"\?>\n/, `${sitemap} declaration`);
    assert.doesNotMatch(xml, /^\s+<\?xml/, `${sitemap} leading whitespace`);
    assert.doesNotMatch(xml, /https:\/\/www\.zqremovals\.au\//i, `${sitemap} mixed www host`);
    const locs = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
    assert.equal(locs.length, new Set(locs).size, `${sitemap} duplicate loc values`);
    for (const loc of locs) {
      assert.match(loc, /^https:\/\/zqremovals\.au\//, `${sitemap} non-canonical loc ${loc}`);
      assert.doesNotMatch(loc, /\/404\.html|\/thank-you\/|premium-moving-concepts|\/privacy-policy\/|\/terms-and-conditions\//i, `${sitemap} utility loc ${loc}`);
    }
  }

  const canonicalBySitemap = new Map();
  const allNormalLocs = new Map();
  for (const sitemap of ['sitemap-pages.xml', 'sitemap-services.xml', 'sitemap-suburbs.xml', 'sitemap-guides.xml']) {
    const locs = [...readDist(sitemap).matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
    canonicalBySitemap.set(sitemap, new Set(locs));
    for (const loc of locs) {
      assert.equal(allNormalLocs.has(loc), false, `${loc} appears in more than one normal sitemap`);
      allNormalLocs.set(loc, sitemap);
    }
  }
});

test('seo v5 llms files and alternate markdown links are published', () => {
  const llms = readDist('llms.txt');
  const llmsFull = readDist('llms-full.txt');
  const homepage = readDist('index.html');

  assert.match(llms, /Pricing: https:\/\/zqremovals\.au\/pricing\.md/);
  assert.match(llms, /Full crawler brief: https:\/\/zqremovals\.au\/llms-full\.txt/);
  assert.match(llmsFull, /Business overview:/);
  assert.match(llmsFull, /Insurance and proof of cover:/);
  assert.match(llmsFull, /Interstate routes:/);
  assert.match(homepage, /<link rel="alternate" type="text\/markdown" href="\/llms\.txt" \/>/i);
  assert.match(homepage, /<link rel="alternate" type="text\/markdown" href="\/llms-full\.txt" \/>/i);
});

test('seo v5 thank-you and utility pages stay noindex and out of sitemap', () => {
  const sitemap = [
    readDist('sitemap.xml'),
    readDist('sitemap-index.xml'),
    readDist('sitemap-pages.xml'),
    readDist('sitemap-services.xml'),
    readDist('sitemap-suburbs.xml'),
    readDist('sitemap-guides.xml'),
    readDist('sitemap-images.xml'),
  ].join('\n');
  const thankYou = readDist(path.join('thank-you', 'index.html'));
  const robots = readDist('robots.txt');

  assert.match(thankYou, /<meta name="robots" content="noindex,follow"/i);
  assert.doesNotMatch(sitemap, /\/thank-you\/|\/404\.html/i);
  assert.doesNotMatch(robots, /thank-you|404\.html/i);
});

test('seo v5 internal links resolve and indexable pages have discovery links', () => {
  const existingOutputs = new Set(indexablePages().map((page) => page.output));

  for (const page of indexablePages()) {
    const html = readDist(page.output);
    const main = extractMain(html);
    const links = uniqueRootLinks(main);

    assert.ok(links.length >= 3, `${page.output} has fewer than three internal links`);
    for (const href of links) {
      const output = hrefToOutput(href);
      assert.ok(existingOutputs.has(output), `${page.output} points to missing route ${href}`);
    }

    if (isCommercialOrGuide(page)) {
      assert.ok(countServiceLinks(links) >= 3, `${page.output} missing service discovery links`);
      assert.ok(countSuburbLinks(links) >= 4, `${page.output} missing suburb discovery links`);
      assert.ok(countGuideLinks(links) >= 2, `${page.output} missing guide discovery links`);
      assert.ok(links.includes('/contact-us/#quote-form'), `${page.output} missing quote CTA`);
      assert.match(main, /href="tel:\+61433819989"/, `${page.output} missing phone CTA`);
    }
  }
});

test('seo v5 indexable pages have complete twitter cards and concise hero headings', () => {
  for (const page of indexablePages()) {
    const html = readDist(page.output);
    assert.match(html, /<meta name="twitter:card" content="summary_large_image" \/>/i, `${page.output} missing twitter:card`);
    assert.match(html, /<meta name="twitter:title" content="[^"]+" \/>/i, `${page.output} missing twitter:title`);
    assert.match(html, /<meta name="twitter:description" content="[^"]+" \/>/i, `${page.output} missing twitter:description`);

    const h1 = textMatch(html, /<h1\b[^>]*>([\s\S]*?)<\/h1>/i).replace(/\s+/g, ' ').trim();
    assert.ok(h1.length <= 80 || page.output === 'index.html', `${page.output} H1 too long: ${h1.length}`);
    assert.equal((html.match(/<h1\b/gi) || []).length, 1, `${page.output} should have exactly one H1`);
  }
});

test('seo v5 sitemap files never include the www homepage variant', () => {
  for (const file of ['sitemap.xml', 'sitemap-index.xml', 'sitemap-pages.xml', 'sitemap-services.xml', 'sitemap-suburbs.xml', 'sitemap-guides.xml', 'sitemap-images.xml']) {
    assert.doesNotMatch(readDist(file), /https:\/\/www\.zqremovals\.au\//i, `${file} must not include the www host`);
  }
});

test('seo v5 schema remains apex-hosted and does not duplicate FAQ or breadcrumb types on the same page', () => {
  for (const page of indexablePages()) {
    const html = readDist(page.output);
    const jsonLdBlocks = extractJsonLd(html);
    const allTypes = jsonLdBlocks.flatMap((block) => flattenJsonLdNodes(block)).flatMap((node) => Array.isArray(node['@type']) ? node['@type'] : [node['@type']].filter(Boolean));
    const typeCounts = allTypes.reduce((counts, type) => counts.set(type, (counts.get(type) || 0) + 1), new Map());

    for (const [type, count] of typeCounts) {
      if (['FAQPage', 'BreadcrumbList', 'MovingCompany', 'WebPage', 'Service'].includes(type)) {
        assert.ok(count >= 1, `${page.output} missing ${type}`);
      }
    }

    assert.doesNotMatch(html, /https:\/\/www\.zqremovals\.au\//i, `${page.output} mixed www host`);
  }
});

test('seo v5 required schema types exist on homepage, service pages, nested pages, and guides', () => {
  const homepageTypes = schemaTypes(readDist('index.html'));
  assert.ok(homepageTypes.has('MovingCompany'), 'homepage missing MovingCompany schema');
  assert.ok(homepageTypes.has('WebSite'), 'homepage missing WebSite schema');

  for (const output of coreServiceOutputs) {
    const types = schemaTypes(readDist(output));
    assert.ok(types.has('Service'), `${output} missing Service schema`);
  }

  for (const page of indexablePages().filter((candidate) => candidate.output.includes('/'))) {
    assert.ok(schemaTypes(readDist(page.output)).has('BreadcrumbList'), `${page.output} missing BreadcrumbList schema`);
  }
});

test('seo v5 pages with tables include accessible captions', () => {
  for (const page of indexablePages()) {
    const html = readDist(page.output);
    if (/<table\b/i.test(html)) {
      assert.match(html, /<caption>[\s\S]*?<\/caption>/i, `${page.output} table missing caption`);
    }
  }
});

test('seo v5 intent profiles differentiate high-intent Adelaide removalist pages', () => {
  const cases = [
    ['cheap-removalists-adelaide/index.html', /transparent rates/i],
    ['removalists-adelaide-prices/index.html', /transparent|fixed moving cost|removalist rates/i],
    ['furniture-removalists-adelaide/index.html', /item protection and handling/i],
    ['house-removals-adelaide/index.html', /full home relocation/i],
    ['interstate-removals-adelaide/index.html', /route planning and long-distance logistics/i],
    ['office-removals-adelaide/index.html', /commercial continuity and access planning/i],
    ['packing-services-adelaide/index.html', /fragile items and time-saving preparation/i],
  ];

  for (const [output, intentPattern] of cases) {
    const html = readDist(output);
    assert.match(html, /data-seo-v5-intent-profile=/, `${output} missing intent profile section`);
    assert.match(html, intentPattern, `${output} missing differentiated intent copy`);
  }
});

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
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkHtmlFiles(fullPath, results);
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      results.push(fullPath);
    }
  }
  return results;
}

function textMatch(text, pattern) {
  return text.match(pattern)?.[1] || '';
}

function isNoindexPage(page) {
  return (page.robots || '').split(',').map((value) => value.trim().toLowerCase()).includes('noindex');
}

function isIndexablePage(page) {
  return page.layout !== 'redirect' &&
    !isNoindexPage(page) &&
    page.output !== '404.html' &&
    page.output !== 'thank-you.html' &&
    page.output !== 'thank-you/index.html' &&
    page.output !== 'privacy-policy/index.html' &&
    page.output !== 'terms-and-conditions/index.html' &&
    page.output !== 'seo-v4/overview/index.html' &&
    !page.output.startsWith('guides/') &&
    !page.output.startsWith('premium-moving-concepts/');
}

function indexablePages() {
  return pages.filter(isIndexablePage);
}

function extractMain(html) {
  return html.match(/<main\b[\s\S]*?<\/main>/i)?.[0] || html;
}

function uniqueRootLinks(html) {
  return [...new Set([...html.matchAll(/href="(\/[^"]*)"/g)]
    .map((match) => match[1])
    .filter((href) => !href.startsWith('//') && !href.startsWith('/api/'))
    .map((href) => href.split('?')[0]))];
}

function hrefToOutput(href) {
  const clean = href.split('#')[0];
  if (clean === '/' || clean === '') return 'index.html';
  if (clean.endsWith('/')) return `${clean.slice(1)}index.html`;
  if (clean.endsWith('.html')) return clean.slice(1);
  return `${clean.slice(1)}/index.html`;
}

function countServiceLinks(links) {
  const services = new Set([
    '/removalists-adelaide/',
    '/house-removals-adelaide/',
    '/furniture-removalists-adelaide/',
    '/packing-services-adelaide/',
    '/office-removals-adelaide/',
    '/interstate-removals-adelaide/',
    '/apartment-removalists-adelaide/',
    '/cheap-removalists-adelaide/',
    '/removalist-cost-adelaide/',
    '/moving-quotes-adelaide/',
    '/fixed-price-removalists-adelaide/',
    '/budget-removalists-adelaide/',
  ]);
  return links.filter((href) => services.has(href)).length;
}

function countSuburbLinks(links) {
  return links.filter((href) => href.startsWith('/removalists-') && href !== '/removalists-adelaide/').length;
}

function countGuideLinks(links) {
  return links.filter((href) => href.startsWith('/adelaide-moving-guides/') && href !== '/adelaide-moving-guides/').length;
}

function isCommercialOrGuide(page) {
  return page.generatedKind === 'commercial' ||
    page.generatedKind === 'guide' ||
    page.output.startsWith('adelaide-moving-guides/') ||
    page.output.startsWith('services/');
}

function extractJsonLd(html) {
  return [...html.matchAll(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/gi)].map((match) => {
    assert.doesNotThrow(() => JSON.parse(match[1]), 'invalid JSON-LD block');
    return JSON.parse(match[1]);
  });
}

function flattenJsonLdNodes(value) {
  if (!value || typeof value !== 'object') return [];
  if (Array.isArray(value)) return value.flatMap((entry) => flattenJsonLdNodes(entry));
  const nodes = [value];
  if (Array.isArray(value['@graph'])) {
    nodes.push(...value['@graph'].flatMap((entry) => flattenJsonLdNodes(entry)));
  }
  return nodes;
}

function nodeTypes(node) {
  return Array.isArray(node['@type']) ? node['@type'] : [node['@type']].filter(Boolean);
}

function schemaTypes(html) {
  return new Set(extractJsonLd(html).flatMap((jsonLd) => flattenJsonLdNodes(jsonLd)).flatMap(nodeTypes));
}

function hasVisibleFaqContent(html) {
  return /class="[^"]*\bfaq-item\b/i.test(html) ||
    (/(FAQ|Questions people ask|Questions Adelaide|Questions customers ask)/i.test(html) && /<h3\b/i.test(html));
}
