import { existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { getGeneratedPages, getRouteCoverageReport, getSuburbDataset, mergePagesByOutput, seoConfig } from '../site-src/data/seo-v4.mjs';

const root = process.cwd();
const distRoot = path.join(root, 'site-dist');
const staticPages = JSON.parse(await readFile(path.join(root, 'site-src', 'pages.json'), 'utf8'));
const generatedPages = getGeneratedPages();
const pages = mergePagesByOutput(staticPages, generatedPages).filter((page) => page.robots !== 'noindex,follow' || page.extra);
const generatedSuburbOutputs = new Set(
  generatedPages.filter((page) => page.generatedKind === 'suburb').map((page) => normalizeOutput(page.output)),
);
const generatedCommercialOutputs = new Set(
  generatedPages.filter((page) => page.generatedKind === 'commercial').map((page) => normalizeOutput(page.output)),
);

const htmlFiles = await collectHtmlFiles(distRoot);
const htmlMap = new Map(await Promise.all(htmlFiles.map(async (file) => [file, await readFile(path.join(distRoot, file), 'utf8')])));
const routeByOutput = new Map(pages.map((page) => [normalizeOutput(page.output), page]));
const graph = buildInternalLinkGraph(htmlMap, routeByOutput);

const failures = [];
const warnings = [];
checkDuplicateMeta('title', (file) => extractFirst(htmlMap.get(file), /<title>(.*?)<\/title>/i), failures);
checkDuplicateMeta('description', (file) => extractFirst(htmlMap.get(file), /<meta name="description" content="([^"]+)"/i), failures);

for (const page of pages) {
  const html = htmlMap.get(page.output.replace(/\\/g, '/'));
  if (!html) {
    failures.push(`missing output: ${page.output}`);
    continue;
  }
  const canonical = extractFirst(html, /<link rel="canonical" href="([^"]+)"/i);
  const title = extractFirst(html, /<title>(.*?)<\/title>/i);
  const h1 = extractFirst(html, /<h1>(.*?)<\/h1>/i);
  if (!canonical) failures.push(`missing canonical: ${page.output}`);
  if (!title) failures.push(`missing title: ${page.output}`);
  if (!h1) failures.push(`missing h1: ${page.output}`);
  if (page.layout !== 'redirect' && page.output.startsWith('removalists-') && wordCount(stripTags(html)) < 650) {
    failures.push(`thin suburb page: ${page.output}`);
  }
  if (page.layout !== 'redirect' && generatedSuburbOutputs.has(normalizeOutput(page.output)) && wordCount(stripTags(html)) < 700) {
    failures.push(`thin generated suburb page: ${page.output}`);
  }
  if (page.layout !== 'redirect' && generatedCommercialOutputs.has(normalizeOutput(page.output)) && wordCount(stripTags(html)) < 550) {
    failures.push(`thin generated money page: ${page.output}`);
  }
  if (page.layout !== 'redirect' && page.output.startsWith('adelaide-moving-guides/') && wordCount(stripTags(html)) < 450) {
    failures.push(`thin guide page: ${page.output}`);
  }
  if (page.robots?.includes('noindex') && !page.output.includes('seo-v4/overview')) {
    continue;
  }
  if (page.canonical && canonical && canonical !== page.canonical) {
    failures.push(`canonical mismatch: ${page.output}`);
  }
}

validateInternalLinkGraph(graph, pages, failures, warnings);
validateGeneratedSuburbModules(pages, htmlMap, failures);
validateImageReferences(htmlMap, failures);
validateSchemaIds(htmlMap, failures);
validateSuburbDatasetSlugs(getSuburbDataset(), generatedPages, failures);

const coverage = getRouteCoverageReport();
if (coverage.length !== generatedPages.filter((page) => page.generatedKind === 'suburb').length) {
  failures.push('route coverage count mismatch');
}

const robots = await readFile(path.join(distRoot, 'robots.txt'), 'utf8').catch(() => '');
if (!robots.includes('/sitemap-index.xml')) failures.push('robots missing sitemap index reference');

const sitemapFiles = ['sitemap-index.xml', 'sitemap-pages.xml', 'sitemap-services.xml', 'sitemap-suburbs.xml', 'sitemap-guides.xml'];
const sitemapXmlByName = new Map();
for (const file of sitemapFiles) {
  const xml = await readFile(path.join(distRoot, file), 'utf8').catch(() => '');
  if (!xml) failures.push(`missing sitemap file: ${file}`);
  sitemapXmlByName.set(file, xml);
}
const sitemapImagesXml = await readFile(path.join(distRoot, 'sitemap-images.xml'), 'utf8').catch(() => '');
if (!sitemapImagesXml) {
  failures.push('missing sitemap file: sitemap-images.xml');
} else {
  sitemapXmlByName.set('sitemap-images.xml', sitemapImagesXml);
}
validateSitemaps(pages, sitemapXmlByName, failures);
validateStrictSeoCompletion(pages, htmlMap, failures);

const uniqueFailures = [...new Set(failures)];
const uniqueWarnings = [...new Set(warnings)];

assert.equal(uniqueFailures.length, 0, uniqueFailures.join('\n'));
if (uniqueWarnings.length > 0) {
  console.log(`seo validation warnings:\n- ${uniqueWarnings.join('\n- ')}`);
}
console.log('bad pages = 0');
console.log(`seo validation passed for ${pages.length} pages`);

async function collectHtmlFiles(dir, prefix = '') {
  const entries = await readdir(dir, { withFileTypes: true });
  const out = [];
  for (const entry of entries) {
    const rel = path.posix.join(prefix.replace(/\\/g, '/'), entry.name);
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...await collectHtmlFiles(abs, rel));
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      out.push(rel.replace(/\\/g, '/'));
    }
  }
  return out;
}

function extractFirst(text = '', pattern) {
  const match = text.match(pattern);
  return match?.[1] || '';
}

function stripTags(text = '') {
  return text.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ');
}

function wordCount(text = '') {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function checkDuplicateMeta(label, getter, failuresList) {
  const seen = new Map();
  for (const page of pages) {
    const value = getter(page.output);
    if (!value) continue;
    if (seen.has(value) && seen.get(value) !== page.output) {
      failuresList.push(`duplicate ${label}: ${value}`);
    } else {
      seen.set(value, page.output);
    }
  }
}

function buildInternalLinkGraph(htmlMap, routeByOutputMap) {
  const graph = new Map();

  for (const [output, html] of htmlMap.entries()) {
    const source = normalizeOutput(output);
    const links = extractInternalLinks(html);
    const contentLinks = extractInternalLinks(extractMainContent(html));

    graph.set(source, {
      outbound: links,
      contentOutbound: contentLinks,
      inbound: [],
      page: routeByOutputMap.get(source),
    });
  }

  for (const [source, node] of graph.entries()) {
    for (const link of node.outbound) {
      if (!link.target) continue;
      const targetNode = graph.get(link.target);
      if (targetNode) {
        targetNode.inbound.push({ source, text: link.text, href: link.href });
      }
    }
  }

  return graph;
}

function validateInternalLinkGraph(graph, pagesList, failuresList, warningsList) {
  for (const page of pagesList) {
    const source = normalizeOutput(page.output);
    const node = graph.get(source);
    if (!node) continue;

    const outgoingTargets = node.contentOutbound.map((link) => link.target).filter(Boolean);
    const uniqueOutgoingTargets = new Set(outgoingTargets);
    const internalOutboundCount = uniqueOutgoingTargets.size;
    const internalInboundCount = node.inbound.length;

    for (const link of node.contentOutbound) {
      if (!link.target) continue;
      if (!graph.has(link.target)) {
        failuresList.push(`broken internal link: ${page.output} -> ${link.href}`);
      }
    }

    if (page.output.startsWith('removalists-') && internalOutboundCount < 3) {
      warningsList.push(`suburb page underlinked outbound: ${page.output}`);
    }
    if (page.output.startsWith('adelaide-moving-guides/') && internalOutboundCount < 3) {
      warningsList.push(`guide page underlinked outbound: ${page.output}`);
    }
    if (page.output === 'index.html' && internalOutboundCount < 4) {
      warningsList.push('homepage outbound links too sparse');
    }
    const repeatedAnchors = findSpammyRepeatedAnchors(node.contentOutbound);
    if (repeatedAnchors.length > 0) {
      warningsList.push(`repetitive anchor pattern: ${page.output}`);
    }
  }

  const missingInbound = pagesList.filter((page) => {
    if (page.output === 'index.html') return false;
    if (page.robots?.includes('noindex')) return false;
    const node = graph.get(normalizeOutput(page.output));
    return node && node.inbound.length === 0;
  });

  for (const page of missingInbound) {
    warningsList.push(`orphan page detected: ${page.output}`);
  }
}

function findSpammyRepeatedAnchors(links) {
  const counts = new Map();
  for (const { text, target } of links) {
    if (!text) continue;
    const key = text.toLowerCase();
    if (!counts.has(key)) {
      counts.set(key, new Set());
    }
    counts.get(key).add(target);
  }
  return [...counts.entries()]
    .filter(([text, targets]) => text.length > 6 && targets.size >= 3)
    .map(([text]) => text);
}

function normalizeOutput(output) {
  return String(output).replace(/\\/g, '/');
}

function isInternalHref(href) {
  return href.startsWith('/') && !href.startsWith('//') && !href.startsWith('/#') && !href.startsWith('/tel:');
}

function normalizeHrefToOutput(href) {
  if (!isInternalHref(href)) return '';
  if (href === '/') return 'index.html';
  const clean = href.split('#')[0].split('?')[0];
  if (clean.endsWith('/')) return `${clean.slice(1)}index.html`;
  const withLeading = clean.startsWith('/') ? clean.slice(1) : clean;
  if (!withLeading) return 'index.html';
  if (withLeading.endsWith('.html')) return withLeading;
  return `${withLeading}/index.html`;
}

function extractInternalLinks(html = '') {
  return [...html.matchAll(/<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)]
    .map((match) => {
      const href = match[1];
      const text = stripTags(match[2]).replace(/\s+/g, ' ').trim();
      return { href, text, target: normalizeHrefToOutput(href) };
    })
    .filter((link) => isInternalHref(link.href));
}

function extractMainContent(html = '') {
  const mainMatch = html.match(/<main[\s\S]*?<\/main>/i);
  if (mainMatch) {
    return mainMatch[0];
  }

  return html
    .replace(/<header[\s\S]*?<\/header>/gi, ' ')
    .replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
    .replace(/<nav[\s\S]*?<\/nav>/gi, ' ');
}

function validateGeneratedSuburbModules(pagesList, htmlMap, failuresList) {
  const expectedModules = [
    'hero-title',
    'local-intro',
    'local-service-summary',
    'logistics-access',
    'move-types',
    'nearby-suburbs',
    'related-services',
    'related-guides',
    'suburb-faq',
    'bottom-cta',
  ];

  for (const page of pagesList) {
    if (page.generatedKind !== 'suburb') continue;

    const html = htmlMap.get(normalizeOutput(page.output)) || '';
    for (const moduleName of expectedModules) {
      if (!html.includes(`data-generated-module="${moduleName}"`)) {
        failuresList.push(`missing generated suburb module: ${page.output} -> ${moduleName}`);
      }
    }

    for (const ctaName of ['top', 'bottom']) {
      if (!html.includes(`data-generated-cta="${ctaName}"`)) {
        failuresList.push(`missing generated suburb cta: ${page.output} -> ${ctaName}`);
      }
    }
  }
}

function validateImageReferences(htmlMap, failuresList) {
  for (const [output, html] of htmlMap.entries()) {
    const imageRefs = [
      ...extractHtmlImageRefs(html),
      ...extractMetaImageRefs(html),
    ];

    for (const href of imageRefs) {
      const assetPath = normalizeAssetHrefToDistPath(href);
      if (!assetPath) continue;
      if (!htmlMap.has(assetPath) && !assetExistsOnDisk(assetPath)) {
        failuresList.push(`missing image asset: ${output} -> ${href}`);
      }
    }
  }
}

function validateSchemaIds(htmlMap, failuresList) {
  for (const [output, html] of htmlMap.entries()) {
    const ids = [];
    for (const block of extractJsonLdBlocks(html)) {
      try {
        const parsed = JSON.parse(block);
        collectSchemaIds(parsed, ids);
      } catch {
        failuresList.push(`invalid json-ld: ${output}`);
      }
    }

    const seen = new Set();
    for (const id of ids) {
      if (seen.has(id)) {
        failuresList.push(`duplicate schema id on page: ${output} -> ${id}`);
      }
      seen.add(id);
    }
  }
}

function validateSuburbDatasetSlugs(suburbDataset, generatedPagesList, failuresList) {
  const allowedSlugMismatches = new Map([
    ['victor-harbor-road', 'victor-harbor-road-corridor'],
  ]);

  for (const { slug, suburb } of suburbDataset) {
    const expected = slugify(suburb);
    if (allowedSlugMismatches.get(slug) === expected) {
      continue;
    }
    if (slug !== expected) {
      failuresList.push(`bad suburb slug: ${slug} -> ${suburb}`);
    }
  }

  if (suburbDataset.some(({ slug }) => slug === 'semore')) {
    failuresList.push('legacy semore slug still present in suburb dataset');
  }

  if (generatedPagesList.some((page) => normalizeOutput(page.output) === 'removalists-semore/index.html' && page.generatedKind === 'suburb')) {
    failuresList.push('legacy semore suburb page still generated');
  }
}

function validateSitemaps(pagesList, sitemapXmlByName, failuresList) {
  const indexedLocs = new Set();
  for (const name of ['sitemap-pages.xml', 'sitemap-services.xml', 'sitemap-suburbs.xml', 'sitemap-guides.xml']) {
    for (const loc of extractSitemapLocs(sitemapXmlByName.get(name) || '')) {
      indexedLocs.add(loc);
    }
  }

  for (const page of pagesList) {
    const shouldBeExcluded =
      page.layout === 'redirect' ||
      String(page.robots || '').toLowerCase().includes('noindex') ||
      page.output === '404.html' ||
      page.output === 'thank-you.html' ||
      page.output.startsWith('premium-moving-concepts/');

    if (shouldBeExcluded && indexedLocs.has(outputToAbsoluteUrl(page.output))) {
      failuresList.push(`bad sitemap inclusion: ${page.output}`);
    }
  }

  if ([...indexedLocs].some((loc) => loc.includes('/removalists-semore/'))) {
    failuresList.push('bad sitemap inclusion: legacy semore route');
  }

  const imageLocs = extractSitemapLocs(sitemapXmlByName.get('sitemap-images.xml') || '');
  for (const loc of imageLocs) {
    if (!loc.includes('/media/') && !loc.endsWith('.webp') && !loc.endsWith('.png') && !loc.endsWith('.jpg') && !loc.endsWith('.jpeg') && !loc.endsWith('.svg')) {
      continue;
    }
    const assetPath = normalizeAssetHrefToDistPath(loc);
    if (assetPath && !assetExistsOnDisk(assetPath)) {
      failuresList.push(`image sitemap missing asset: ${loc}`);
    }
  }
}

function validateStrictSeoCompletion(pagesList, htmlMap, failuresList) {
  const seenTitles = new Map();
  const seenDescriptions = new Map();
  const seenH1 = new Map();
  const badPages = [];

  for (const page of pagesList) {
    if (!isStrictSeoIndexablePage(page)) continue;

    const html = htmlMap.get(normalizeOutput(page.output)) || '';
    const reasons = [];
    const h1s = extractH1s(html);
    const title = extractFirst(html, /<title>(.*?)<\/title>/i).replace(/\s+/g, ' ').trim();
    const description = extractFirst(html, /<meta name="description" content="([^"]+)"/i).replace(/\s+/g, ' ').trim();

    if (h1s.length !== 1) {
      reasons.push(`h1 count ${h1s.length}`);
    }
    if (!title) {
      reasons.push('missing title');
    } else if (seenTitles.has(title) && seenTitles.get(title) !== page.output) {
      reasons.push(`duplicate title with ${seenTitles.get(title)}`);
    } else {
      seenTitles.set(title, page.output);
    }
    if (!description) {
      reasons.push('missing meta description');
    } else if (seenDescriptions.has(description) && seenDescriptions.get(description) !== page.output) {
      reasons.push(`duplicate meta description with ${seenDescriptions.get(description)}`);
    } else {
      seenDescriptions.set(description, page.output);
    }
    if (h1s[0]) {
      if (seenH1.has(h1s[0]) && seenH1.get(h1s[0]) !== page.output) {
        reasons.push(`duplicate h1 with ${seenH1.get(h1s[0])}`);
      } else {
        seenH1.set(h1s[0], page.output);
      }
    }

    const guidePage = isStrictSeoGuidePage(page);
    const commercialPage = isStrictSeoCommercialPage(page);
    const pageWords = wordCount(stripTags(html));

    if (guidePage && pageWords < 1200) {
      reasons.push(`guide words ${pageWords}`);
    }
    if (commercialPage && pageWords < 800) {
      reasons.push(`commercial words ${pageWords}`);
    }

    if (guidePage || commercialPage) {
      const outboundLinks = extractInternalLinks(html).filter((link) => link.target && link.target !== normalizeOutput(page.output));
      const serviceLinks = new Set(outboundLinks.filter((link) => isStrictSeoServiceTarget(link.target)).map((link) => link.target));
      const suburbLinks = new Set(outboundLinks.filter((link) => isStrictSeoSuburbTarget(link.target)).map((link) => link.target));
      const guideLinks = new Set(outboundLinks.filter((link) => isStrictSeoGuideTarget(link.target)).map((link) => link.target));

      if (serviceLinks.size < 3) {
        reasons.push(`service links ${serviceLinks.size}`);
      }
      if (suburbLinks.size < 4) {
        reasons.push(`suburb links ${suburbLinks.size}`);
      }
      if (guideLinks.size < 2) {
        reasons.push(`guide links ${guideLinks.size}`);
      }
      if (!hasStrictSeoCta(html)) {
        reasons.push('missing CTA');
      }
      if (!hasStrictSeoFaq(html)) {
        reasons.push('missing FAQ');
      }
      if (extractJsonLdBlocks(html).length === 0) {
        reasons.push('missing JSON-LD');
      }
    }

    if (reasons.length > 0) {
      badPages.push(`${page.output}: ${reasons.join('; ')}`);
    }
  }

  if (badPages.length > 0) {
    failuresList.push(`bad pages = ${badPages.length}`);
    failuresList.push(...badPages.map((page) => `strict seo failed: ${page}`));
  }
}

function isStrictSeoIndexablePage(page) {
  if (page.layout === 'redirect') return false;
  if (String(page.robots || '').toLowerCase().includes('noindex')) return false;
  if (['404.html', 'thank-you.html', 'privacy-policy/index.html', 'terms-and-conditions/index.html', 'seo-v4/overview/index.html'].includes(page.output)) {
    return false;
  }
  return !String(page.output || '').startsWith('premium-moving-concepts/');
}

function isStrictSeoGuidePage(page) {
  const output = normalizeOutput(page.output);
  return page.generatedKind === 'guide' || output.startsWith('adelaide-moving-guides/') || output.startsWith('guides/');
}

function isStrictSeoCommercialPage(page) {
  const output = normalizeOutput(page.output);
  return isStrictSeoIndexablePage(page) &&
    !isStrictSeoGuidePage(page) &&
    (
      page.generatedKind === 'commercial' ||
      page.generatedKind === 'suburb' ||
      page.generatedKind === 'interstate-route' ||
      output === 'index.html' ||
      output.startsWith('services/') ||
      output.startsWith('removalists-') ||
      output.includes('removalist') ||
      output.includes('moving-quotes') ||
      output.endsWith('-removals-adelaide/index.html')
    );
}

function isStrictSeoServiceTarget(target = '') {
  return new Set([
    'services/local-removals-adelaide/index.html',
    'services/furniture-removals-adelaide/index.html',
    'services/office-removals-adelaide/index.html',
    'services/interstate-removals-adelaide/index.html',
    'services/house-removals-adelaide/index.html',
    'services/apartment-removals-adelaide/index.html',
    'services/packing-services-adelaide/index.html',
    'local-removals-adelaide/index.html',
    'furniture-removalists-adelaide/index.html',
    'office-removals-adelaide/index.html',
    'interstate-removalists-adelaide/index.html',
    'interstate-removals-adelaide/index.html',
    'packing-services-adelaide/index.html',
    'house-removals-adelaide/index.html',
    'apartment-removalists-adelaide/index.html',
    'cheap-removalists-adelaide/index.html',
    'affordable-removalists-adelaide/index.html',
    'removalist-cost-adelaide/index.html',
    'moving-quotes-adelaide/index.html',
    'same-day-removalists-adelaide/index.html',
    'last-minute-removalists-adelaide/index.html',
    'office-relocation-adelaide/index.html',
    'fixed-price-removalists-adelaide/index.html',
    'budget-removalists-adelaide/index.html',
  ]).has(target);
}

function isStrictSeoSuburbTarget(target = '') {
  return target.startsWith('removalists-') &&
    !target.includes('adelaide-quote') &&
    ![
      'removalists-adelaide/index.html',
      'removalists-northern-adelaide/index.html',
      'removalists-southern-adelaide/index.html',
    ].includes(target);
}

function isStrictSeoGuideTarget(target = '') {
  return target.startsWith('adelaide-moving-guides/') || target.startsWith('guides/');
}

function hasStrictSeoCta(html = '') {
  return html.includes('/contact-us/#quote-form') || html.includes('tel:+61433819989') || /data-generated-cta|data-cta/i.test(html);
}

function hasStrictSeoFaq(html = '') {
  return /class="[^"]*\bfaq-item\b/i.test(html) || /class="[^"]*\bfaq-list\b/i.test(html);
}

function extractH1s(html = '') {
  return [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)]
    .map((match) => stripTags(match[1]).replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

function extractHtmlImageRefs(html = '') {
  return [...html.matchAll(/<img[^>]*src="([^"]+)"/gi)].map((match) => match[1]);
}

function extractMetaImageRefs(html = '') {
  return [...html.matchAll(/<(?:meta|link)[^>]*(?:content|href)="([^"]+\.(?:png|jpg|jpeg|webp|svg))"/gi)].map((match) => match[1]);
}

function extractJsonLdBlocks(html = '') {
  return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)].map((match) => match[1].trim());
}

function collectSchemaIds(node, out) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    for (const item of node) collectSchemaIds(item, out);
    return;
  }

  const keys = Object.keys(node);
  const isReferenceOnly = keys.length === 1 && keys[0] === '@id';

  if (typeof node['@id'] === 'string' && !isReferenceOnly) {
    out.push(node['@id']);
  }

  for (const value of Object.values(node)) {
    collectSchemaIds(value, out);
  }
}

function extractSitemapLocs(xml = '') {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/gi)].map((match) => match[1]);
}

function normalizeAssetHrefToDistPath(href = '') {
  const clean = normalizeAssetHref(href);
  if (!clean || clean === '/' || clean.endsWith('/')) {
    return '';
  }
  return clean.slice(1).replace(/\//g, path.sep);
}

function normalizeAssetHref(href = '') {
  const clean = decodeURIComponent(String(href).split('#')[0].split('?')[0].trim());
  if (!clean) return '';
  if (clean.startsWith(`${seoConfig.siteUrl}/`)) {
    return clean.slice(seoConfig.siteUrl.length);
  }
  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    return '';
  }
  if (!clean.startsWith('/') || clean.startsWith('//')) {
    return '';
  }
  return clean;
}

function assetExistsOnDisk(relativePath) {
  return existsSync(path.join(distRoot, relativePath));
}

function slugify(value = '') {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function outputToAbsoluteUrl(output = '') {
  const normalized = normalizeOutput(output);
  if (normalized === 'index.html') {
    return `${seoConfig.siteUrl}/`;
  }
  if (normalized.endsWith('/index.html')) {
    return `${seoConfig.siteUrl}/${normalized.replace(/\/index\.html$/, '/')}`;
  }
  return `${seoConfig.siteUrl}/${normalized}`;
}
