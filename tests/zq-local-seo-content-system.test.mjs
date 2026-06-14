import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { getGeneratedPages, mergePagesByOutput } from '../site-src/data/seo-v4.mjs';
import {
  zqCanonicalHostPolicy,
  zqExpectedGeneratedOutputs,
  zqSeoRouteManifest,
} from '../site-src/data/zq-seo-pages.mjs';
import { zqServiceSitemapOutputs } from '../site-src/data/zq-services.mjs';
import { zqSuburbQualityRules } from '../site-src/data/zq-suburbs.mjs';

const root = process.cwd();
const distDir = path.join(root, 'site-dist');
const pages = mergePagesByOutput(
  JSON.parse(readFileSync(path.join(root, 'site-src', 'pages.json'), 'utf8')),
  getGeneratedPages(),
);
const pagesByOutput = new Map(pages.map((page) => [normalizeOutput(page.output), page]));
const canonicalHost = zqCanonicalHostPolicy.siteUrl;
const newServiceOutputs = new Set(zqServiceSitemapOutputs);

test.before(async () => {
  const buildUrl = pathToFileURL(path.join(root, 'scripts', 'build-site.mjs')).href;
  await import(`${buildUrl}?zqLocalSeo=${Date.now()}`);
});

test('zq local seo route manifest is generated and indexable', () => {
  for (const output of zqExpectedGeneratedOutputs) {
    const page = pagesByOutput.get(output);
    assert.ok(page, `missing page registry entry: ${output}`);
    assert.notEqual(page.layout, 'redirect', `${output} should not be a redirect`);
    assert.doesNotMatch(String(page.robots || ''), /noindex/i, `${output} should be indexable`);

    const html = readDist(output);
    const canonicals = [...html.matchAll(/<link rel="canonical" href="([^"]+)"/gi)].map((match) => match[1]);
    const title = textMatch(html, /<title>(.*?)<\/title>/i);
    const description = textMatch(html, /<meta name="description" content="([^"]+)"/i);
    const h1s = extractH1s(html);

    assert.deepEqual(canonicals, [page.canonical], `${output} canonical mismatch`);
    assert.match(page.canonical, new RegExp(`^${escapeRegex(canonicalHost)}/`), `${output} canonical host`);
    assert.equal(h1s.length, 1, `${output} must have exactly one h1`);
    const titleMax = newServiceOutputs.has(output) || output.startsWith('guides/') ? 68 : 85;
    assert.ok(title.length >= 20 && title.length <= titleMax, `${output} title length ${title.length}`);
    const descriptionMax = newServiceOutputs.has(output) || output.startsWith('guides/') ? 160 : 190;
    assert.ok(description.length >= 60 && description.length <= descriptionMax, `${output} description length ${description.length}`);
  }
});

test('new service pages have visible FAQs, service schema, sitemap entries, and conversion links', () => {
  const serviceSitemap = readDist('sitemap-services.xml');

  for (const { output, path: routePath } of zqSeoRouteManifest.services.filter((route) => newServiceOutputs.has(route.output))) {
    const html = readDist(output);
    const main = extractMain(html);
    const links = uniqueInternalLinks(main);
    const schema = schemaTypes(html);

    assert.match(serviceSitemap, new RegExp(`${escapeRegex(canonicalHost)}${escapeRegex(routePath)}`), `${output} missing from service sitemap`);
    assert.ok(schema.has('MovingCompany'), `${output} missing MovingCompany schema`);
    assert.ok(schema.has('Service'), `${output} missing Service schema`);
    assert.ok(schema.has('FAQPage'), `${output} missing FAQPage schema`);
    assert.ok(schema.has('BreadcrumbList'), `${output} missing BreadcrumbList schema`);
    assert.ok(visibleFaqCount(main) >= 4, `${output} needs at least four visible FAQs`);
    assert.ok(links.includes('/removalists-adelaide/'), `${output} missing Adelaide hub link`);
    assert.ok(links.includes('/contact-us/#quote-form'), `${output} missing quote CTA`);
    assert.ok(countServiceLinks(links) >= 3, `${output} missing related service links`);
    assert.ok(countSuburbLinks(links) >= 4, `${output} missing suburb links`);
    assert.ok(countGuideLinks(links) >= 2, `${output} missing guide links`);
    assertResolvedLinks(links, output);
  }
});

test('requested guide pages are useful, schema-backed, in the guide sitemap, and internally linked', () => {
  const guideSitemap = readDist('sitemap-guides.xml');
  const seenTitles = new Map();
  const seenDescriptions = new Map();

  for (const { output, path: routePath } of zqSeoRouteManifest.guides.filter((route) => !route.output.startsWith('guides/'))) {
    const html = readDist(output);
    const main = extractMain(html);
    const links = uniqueInternalLinks(main);
    const schema = schemaTypes(html);
    const title = textMatch(html, /<title>(.*?)<\/title>/i);
    const description = textMatch(html, /<meta name="description" content="([^"]+)"/i);

    assert.match(guideSitemap, new RegExp(`${escapeRegex(canonicalHost)}${escapeRegex(routePath)}`), `${output} missing from guide sitemap`);
    assert.ok(schema.has('Article'), `${output} missing Article schema`);
    assert.ok(schema.has('FAQPage'), `${output} missing FAQPage schema`);
    assert.ok(schema.has('BreadcrumbList'), `${output} missing BreadcrumbList schema`);
    assert.ok(visibleFaqCount(main) >= 3, `${output} needs visible guide FAQs`);
    assert.ok(wordCount(stripTags(main)) >= 1200, `${output} guide content is too thin`);
    assert.ok(links.includes('/contact-us/#quote-form'), `${output} missing quote CTA`);
    assert.ok(countServiceLinks(links) >= 3, `${output} missing service links`);
    assert.ok(countSuburbLinks(links) >= 4, `${output} missing suburb links`);
    assert.ok(countGuideLinks(links) >= 2, `${output} missing guide links`);
    assert.ok(!seenTitles.has(title), `duplicate guide title: ${title}`);
    assert.ok(!seenDescriptions.has(description), `duplicate guide description: ${description}`);
    seenTitles.set(title, output);
    seenDescriptions.set(description, output);
    assertResolvedLinks(links, output);
  }
});

test('priority suburb pages remain unique, local, and module-complete', () => {
  const localIntroSignatures = new Set();

  for (const { output, path: routePath, slug } of zqSeoRouteManifest.suburbs) {
    const html = readDist(output);
    const main = extractMain(html);
    const page = pagesByOutput.get(output);
    const schema = schemaTypes(html);

    assert.ok(page, `${output} missing page registry entry`);
    assert.equal(page.canonical, `${canonicalHost}${routePath}`, `${output} canonical route mismatch`);
    assert.ok(schema.has('Service'), `${output} missing Service schema`);
    assert.ok(schema.has('FAQPage'), `${output} missing FAQPage schema`);
    assert.ok(visibleFaqCount(main) >= zqSuburbQualityRules.minimumVisibleFaqCount, `${output} missing suburb FAQs`);

    for (const moduleName of zqSuburbQualityRules.requiredModules) {
      assert.match(main, new RegExp(`data-generated-module="${moduleName}"`), `${output} missing ${moduleName}`);
    }

    const intro = extractGeneratedModule(main, 'local-intro').slice(0, 500).replace(/\s+/g, ' ').trim();
    assert.ok(intro.toLowerCase().includes(slug.split('-')[0]), `${output} local intro should mention the suburb`);
    assert.ok(!localIntroSignatures.has(intro), `${output} duplicates another suburb local intro`);
    localIntroSignatures.add(intro);
  }
});

test('new pages are discoverable from existing hub content and do not use unsupported review schema', () => {
  const homepage = readDist('index.html');
  const adelaideHub = readDist('removalists-adelaide/index.html');
  const footerBearingHtml = `${homepage}\n${adelaideHub}`;

  for (const route of [
    ...zqSeoRouteManifest.services,
    ...zqSeoRouteManifest.guides.filter((guide) => !guide.output.startsWith('guides/')),
  ]) {
    assert.match(footerBearingHtml, new RegExp(`href="${escapeRegex(route.path)}"`), `${route.path} missing hub or footer link`);
  }

  for (const output of zqExpectedGeneratedOutputs) {
    const serializedSchema = JSON.stringify(extractJsonLd(readDist(output)));
    if (output !== 'removalists-adelaide/index.html') {
      assert.doesNotMatch(serializedSchema, /AggregateRating|aggregateRating|reviewCount|ratingValue|ReviewRating/i, `${output} has unsupported review schema`);
    }
    assert.doesNotMatch(serializedSchema, /https:\/\/www\.zqremovals\.au|localhost|\.vercel\.app/i, `${output} has non-canonical schema URL`);
  }
});

test('generated output avoids repeated template-artifact phrases', () => {
  const badPatterns = [
    /\b(Your move is|You need|You may need)\s+\1\b/i,
    /before booking before/i,
    /Understand quote factors before booking before the quote is confirmed\./i,
    /Questions people ask before using/i,
    /service paths that support/i,
    /Specialized relocation logistics for residential estates, commercial infrastructure, and major Australian interstate capital routes\./i,
  ];

  for (const output of zqExpectedGeneratedOutputs) {
    const html = readDist(output);
    for (const pattern of badPatterns) {
      assert.doesNotMatch(html, pattern, `${output} contains a repeated template artifact`);
    }
  }
});

test('footer and service hub links stay useful without exact-match overstuffing', () => {
  const homepage = readDist('index.html');
  const hub = readDist('removalists-adelaide/index.html');
  const footerHtml = readFileSync(path.join(root, 'site-src', 'partials', 'footer.html'), 'utf8');

  for (const href of [
    '/house-removals-adelaide/',
    '/furniture-removalists-adelaide/',
    '/office-removals-adelaide/',
    '/apartment-removalists-adelaide/',
    '/removalist-cost-adelaide/',
    '/cheap-removalists-adelaide/',
    '/affordable-removalists-adelaide/',
    '/removalists-glenelg/',
    '/removalists-marion/',
    '/removalists-salisbury/',
  ]) {
    assert.match(footerHtml, new RegExp(`href="${escapeRegex(href)}"`), `missing footer or hub link for ${href}`);
  }

  const denseFooterCluster = /Cheap Removalists Adelaide[\s\S]{0,220}Affordable Removalists Adelaide[\s\S]{0,220}Removalist Cost Adelaide[\s\S]{0,220}Moving Quotes Adelaide/i;
  assert.doesNotMatch(footerHtml, denseFooterCluster, 'footer still contains an overly dense exact-match money-page cluster');
  assert.match(homepage, /href="\/cheap-removalists-adelaide\/"|href="\/affordable-removalists-adelaide\/"|href="\/removalist-cost-adelaide\//i, 'homepage should still surface key pricing pages');
  assert.match(hub, /href="\/contact-us\/#quote-form"/, 'adelaide hub should keep the quote CTA');
});

test('schema stays on canonical host and review schema requires visible proof', () => {
  for (const output of zqExpectedGeneratedOutputs) {
    const html = readDist(output);
    const jsonLd = extractJsonLd(html);
    const serialized = JSON.stringify(jsonLd);

    assert.doesNotMatch(serialized, /https:\/\/www\.zqremovals\.au|localhost|\.vercel\.app/i, `${output} has non-canonical schema URL`);
    if (output !== 'removalists-adelaide/index.html') {
      assert.doesNotMatch(serialized, /reviewCount|ratingValue|AggregateRating/i, `${output} has unsupported rating schema`);
    }

    const hasReviewSchema = /"@type"\s*:\s*"?ReviewPage"?|"@type"\s*:\s*"?Review"?/i.test(serialized);
    if (hasReviewSchema) {
      assert.match(html, /verified reviews|Google Business Profile reviews|customer reviews/i, `${output} review schema lacks visible proof`);
    }
  }
});

test('homepage hero image is prioritized for mobile LCP', () => {
  const homepage = readDist('index.html');
  const heroImg = homepage.match(/<picture>[\s\S]*?<img[\s\S]*?<\/picture>/i)?.[0] || '';
  assert.match(homepage, /<img[\s\S]*src="\/media\/home-local-hero-branded\.webp"/i);
  assert.match(homepage, /fetchpriority="high"/i);
  assert.match(homepage, /loading="eager"/i);
  assert.doesNotMatch(heroImg, /loading="lazy"/i);
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

function normalizeOutput(output) {
  return String(output || '').replace(/\\/g, '/');
}

function textMatch(text, pattern) {
  return text.match(pattern)?.[1] || '';
}

function stripTags(text = '') {
  return text
    .replace(/<script\b[^>]*>[\s\S]*?<\/script(?:\s+[^>]*)?>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style(?:\s+[^>]*)?>/gi, ' ')
    .replace(/<[^>]+>/g, ' ');
}

function wordCount(text = '') {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function extractMain(html) {
  return html.match(/<main\b[\s\S]*?<\/main>/i)?.[0] || html;
}

function extractH1s(html = '') {
  return [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)]
    .map((match) => stripTags(match[1]).replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

function visibleFaqCount(html = '') {
  return (html.match(/class="[^"]*\bfaq-item\b/gi) || []).length;
}

function uniqueInternalLinks(html = '') {
  return [...new Set([...html.matchAll(/href="(\/[^"]*)"/g)]
    .map((match) => match[1])
    .filter((href) => !href.startsWith('//') && !href.startsWith('/api/'))
    .map((href) => href.split('?')[0]))];
}

function countServiceLinks(links) {
  return links.filter((href) => [
    '/removalists-adelaide/',
    '/house-removals-adelaide/',
    '/furniture-removals-adelaide/',
    '/furniture-removalists-adelaide/',
    '/packing-services-adelaide/',
    '/office-removals-adelaide/',
    '/interstate-removals-adelaide/',
    '/apartment-removals-adelaide/',
    '/apartment-removalists-adelaide/',
    '/local-removalists-adelaide/',
    '/moving-company-adelaide/',
    '/cheap-removalists-adelaide/',
    '/moving-quotes-adelaide/',
    '/fixed-price-removalists-adelaide/',
  ].includes(href)).length;
}

function countSuburbLinks(links) {
  return links.filter((href) => href.startsWith('/removalists-') && href !== '/removalists-adelaide/').length;
}

function countGuideLinks(links) {
  return links.filter((href) => href.startsWith('/adelaide-moving-guides/')).length;
}

function assertResolvedLinks(links, sourceOutput) {
  for (const href of links) {
    if (href === '/contact-us/#quote-form') continue;
    const output = hrefToOutput(href);
    assert.ok(pagesByOutput.has(output), `${sourceOutput} points to missing route ${href}`);
  }
}

function hrefToOutput(href) {
  const clean = href.split('#')[0];
  if (!clean || clean === '/') return 'index.html';
  if (clean.endsWith('/')) return `${clean.slice(1)}index.html`;
  if (clean.endsWith('.html')) return clean.slice(1);
  return `${clean.slice(1)}/index.html`;
}

function extractGeneratedModule(html = '', moduleName) {
  const pattern = new RegExp(`<section[^>]*data-generated-module="${escapeRegex(moduleName)}"[^>]*>[\\s\\S]*?<\\/section>`, 'i');
  return stripTags(html.match(pattern)?.[0] || '');
}

function extractJsonLd(html) {
  return [...html.matchAll(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/gi)]
    .map((match) => JSON.parse(match[1]));
}

function schemaTypes(html) {
  const types = new Set();
  for (const jsonLd of extractJsonLd(html)) {
    collectSchemaTypes(jsonLd, types);
  }
  return types;
}

function collectSchemaTypes(value, out) {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    for (const item of value) collectSchemaTypes(item, out);
    return;
  }

  const type = value['@type'];
  if (Array.isArray(type)) {
    for (const item of type) out.add(item);
  } else if (type) {
    out.add(type);
  }

  for (const entry of Object.values(value)) {
    collectSchemaTypes(entry, out);
  }
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
