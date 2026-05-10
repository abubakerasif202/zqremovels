import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const dataDir = path.join(root, 'data', 'gsc');
const routeMap = await loadRouteMap();

const analytics = JSON.parse(await readFile(path.join(dataDir, 'latest-search-analytics.json'), 'utf8'));
const pages = JSON.parse(await readFile(path.join(dataDir, 'latest-page-opportunities.json'), 'utf8'));
const queries = JSON.parse(await readFile(path.join(dataDir, 'latest-query-opportunities.json'), 'utf8'));
const cannibalization = JSON.parse(await readFile(path.join(dataDir, 'latest-cannibalization.json'), 'utf8'));

const actions = [];

for (const page of pages.slice(0, 50)) {
  const route = resolveRoute(page.page, routeMap);
  actions.push(renderPageAction(page, route));
}

for (const query of queries.slice(0, 50)) {
  const route = resolveRoute(query.query, routeMap);
  actions.push(renderQueryAction(query, route));
}

for (const cluster of cannibalization.slice(0, 25)) {
  actions.push(renderCannibalizationAction(cluster, routeMap));
}

const output = [
  `# Codex SEO Actions`,
  ``,
  `- Source property: \`${analytics.site}\``,
  `- Date range: ${analytics.dateRange.startDate} to ${analytics.dateRange.endDate}`,
  ``,
  ...actions.filter(Boolean).map((entry) => entry.trimEnd()),
].join('\n');

await mkdir(dataDir, { recursive: true });
await writeFile(path.join(dataDir, 'codex-seo-actions.md'), output + '\n', 'utf8');

console.log(`Wrote ${path.join(dataDir, 'codex-seo-actions.md')}`);

async function loadRouteMap() {
  const pages = JSON.parse(await readFile(path.join(root, 'site-src', 'pages.json'), 'utf8'));
  const map = new Map();
  for (const page of pages) {
    if (!page.output || !page.canonical) continue;
    map.set(normalizeUrl(page.canonical), page);
    map.set(normalizePath(page.output), page);
  }
  return map;
}

function renderPageAction(page, route) {
  const actions = [];
  if (page.ctr < 0.03 && page.impressions > 100) actions.push('title rewrite');
  if (page.position >= 4 && page.position <= 20) actions.push('meta description rewrite');
  if (page.clicks === 0 && page.impressions > 100) actions.push('H1 shortening');
  if (route?.robots?.includes('noindex')) actions.push('cannibalization canonical/redirect review');
  if (route?.output?.startsWith('adelaide-moving-guides/') || route?.output?.startsWith('guides/')) actions.push('FAQ addition');
  if (route?.output?.startsWith('removalists-') || route?.output?.includes('removalist')) actions.push('internal link addition');
  if (route?.output?.startsWith('removalists-') || route?.output === 'index.html') actions.push('hub page link addition');
  return formatActionBlock('Page', page.page, route, actions);
}

function renderQueryAction(query, route) {
  const actions = [];
  if (query.ctr < 0.03 && query.impressions > 100) actions.push('title rewrite');
  if (query.position >= 4 && query.position <= 20) actions.push('meta description rewrite');
  if (query.clicks === 0 && query.impressions > 100) actions.push('H1 shortening');
  if (route?.output?.startsWith('adelaide-moving-guides/')) actions.push('FAQ addition');
  if (route?.output?.startsWith('removalists-') || route?.output?.startsWith('services/')) actions.push('internal link addition');
  return formatActionBlock('Query', query.query, route, actions);
}

function renderCannibalizationAction(cluster) {
  const topPages = cluster.pages.slice(0, 3).map((row) => row.page).join(', ');
  return [
    `## Cannibalization Review`,
    `- Query: ${cluster.query}`,
    `- Candidate pages: ${topPages}`,
    `- Action: cannibalization canonical/redirect review`,
  ].join('\n');
}

function formatActionBlock(kind, value, route, actions) {
  if (!actions.length) return '';
  const unique = [...new Set(actions)];
  const routeLabel = route ? `${route.output} -> ${route.canonical || ''}` : 'unmapped';
  return [
    `## ${kind}`,
    `- Value: ${value}`,
    `- Route: ${routeLabel}`,
    `- Recommended actions: ${unique.join(', ')}`,
  ].join('\n');
}

function resolveRoute(value, routeMap) {
  return routeMap.get(normalizeUrl(value)) || routeMap.get(normalizePath(value)) || null;
}

function normalizeUrl(value = '') {
  try {
    const url = new URL(value);
    return `${url.origin}${url.pathname}`;
  } catch {
    return '';
  }
}

function normalizePath(value = '') {
  return String(value).replace(/\\/g, '/');
}
