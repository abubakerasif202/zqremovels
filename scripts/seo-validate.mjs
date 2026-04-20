import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { getGeneratedPages, getRouteCoverageReport, mergePagesByOutput, seoConfig } from '../site-src/data/seo-v4.mjs';

const root = process.cwd();
const distRoot = path.join(root, 'site-dist');
const staticPages = JSON.parse(await readFile(path.join(root, 'site-src', 'pages.json'), 'utf8'));
const generatedPages = getGeneratedPages();
const pages = mergePagesByOutput(staticPages, generatedPages).filter((page) => page.robots !== 'noindex,follow' || page.extra);

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
  if (page.output.startsWith('removalists-') && wordCount(stripTags(html)) < 650) {
    failures.push(`thin suburb page: ${page.output}`);
  }
  if (page.output.startsWith('adelaide-moving-guides/') && wordCount(stripTags(html)) < 450) {
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

const coverage = getRouteCoverageReport();
if (coverage.length !== generatedPages.filter((page) => page.output.startsWith('removalists-')).length) {
  failures.push('route coverage count mismatch');
}

const robots = await readFile(path.join(distRoot, 'robots.txt'), 'utf8').catch(() => '');
if (!robots.includes('/sitemap-index.xml')) failures.push('robots missing sitemap index reference');

const sitemapFiles = ['sitemap-index.xml', 'sitemap-pages.xml', 'sitemap-services.xml', 'sitemap-suburbs.xml', 'sitemap-guides.xml'];
for (const file of sitemapFiles) {
  const xml = await readFile(path.join(distRoot, file), 'utf8').catch(() => '');
  if (!xml) failures.push(`missing sitemap file: ${file}`);
}

const uniqueFailures = [...new Set(failures)];
const uniqueWarnings = [...new Set(warnings)];

assert.equal(uniqueFailures.length, 0, uniqueFailures.join('\n'));
if (uniqueWarnings.length > 0) {
  console.log(`seo validation warnings:\n- ${uniqueWarnings.join('\n- ')}`);
}
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
