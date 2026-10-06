import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const distArgument = process.argv.indexOf('--dist');
const distRoot = path.resolve(root, distArgument >= 0 ? process.argv[distArgument + 1] : 'site-dist');
const canonicalOrigin = 'https://zqremovalsadelaide.com.au';
const oldOrigin = 'https://zqremovals.au';
const outputArgument = process.argv.indexOf('--output');
const outputPath = path.resolve(root, outputArgument >= 0
  ? process.argv[outputArgument + 1] : 'docs/zq-migration-live-audit.json');
const sitemapUrls = new Set();
const visitedSitemaps = new Set();
async function readSitemap(filename) {
  if (visitedSitemaps.has(filename)) return;
  visitedSitemaps.add(filename);
  const xml = await readFile(path.join(distRoot, filename), 'utf8');
  const locations = [...xml.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/g)].map((match) => match[1].replace(/&amp;/g, '&'));
  if (/<sitemapindex\b/.test(xml)) {
    for (const location of locations) await readSitemap(new URL(location).pathname.slice(1));
  } else {
    for (const location of locations) sitemapUrls.add(location);
  }
}
await readSitemap('sitemap.xml');
const historical = JSON.parse(await readFile(path.join(root, 'data/gsc/page.raw.json'), 'utf8'));
const historicalUrls = new Set();
function collectHistorical(value) {
  if (!value || typeof value !== 'object') return;
  if (typeof value.dimensions?.page === 'string' && /^https?:\/\/(www\.)?zqremovals\.au(?:\/|$)/.test(value.dimensions.page)) historicalUrls.add(value.dimensions.page);
  for (const child of Object.values(value)) collectHistorical(child);
}
collectHistorical(historical);
const priorityPaths = ['/', '/house-removals-adelaide/', '/office-removals-adelaide/', '/services/piano-movers-adelaide/', '/removalists-adelaide-prices/', '/removalists-hyde-park/', '/removalists-unley/', '/removalists-unley-park/', '/removalists-adelaide/', '/removalists-northern-adelaide/', '/removalists-southern-adelaide/', '/removalists-adelaide-hills/', '/removalists-adelaide-cbd/', '/same-day-removalists-adelaide/', '/packing-services-adelaide/', '/adelaide-to-sydney-removalists/', '/adelaide-to-brisbane-removals/', '/adelaide-to-melbourne-removalists/'];
const config = JSON.parse(await readFile(path.join(root, 'vercel.json'), 'utf8'));
const inventory = JSON.parse(await readFile(path.join(root, 'docs/zq-migration-route-inventory.json'), 'utf8'));
const expectedPaths = new Map([...sitemapUrls].map((url) => [new URL(url).pathname, url]));
for (const redirect of config.redirects ?? []) {
  if (!/[:*()]/.test(redirect.source)) expectedPaths.set(redirect.source, new URL(redirect.destination, canonicalOrigin).href);
}
for (const mapping of inventory.priorityMigrationMappings) expectedPaths.set(new URL(mapping.sourceUrl).pathname, mapping.canonicalUrl);
const cases = new Map();
function add(url, kind) {
  if (!cases.has(url)) cases.set(url, new Set());
  cases.get(url).add(kind);
}
for (const url of sitemapUrls) add(url, 'sitemap');
for (const url of historicalUrls) add(url, 'historical');
for (const pathname of priorityPaths) {
  add(oldOrigin + pathname, 'old-priority');
  add(canonicalOrigin + pathname, 'new-priority');
}
for (const redirect of config.redirects ?? []) {
  if (!/[:*()]/.test(redirect.source)) add(oldOrigin + redirect.source, 'old-alias');
}
for (const origin of ['http://zqremovalsadelaide.com.au', 'http://www.zqremovalsadelaide.com.au', 'https://www.zqremovalsadelaide.com.au', 'http://zqremovals.au', 'https://www.zqremovals.au']) {
  for (const pathname of ['/', '/services/piano-movers-adelaide/']) add(origin + pathname, 'host-variant');
}
for (const pathname of ['/robots.txt', '/sitemap.xml', '/sitemap-pages.xml', '/sitemap-services.xml', '/sitemap-suburbs.xml', '/sitemap-guides.xml']) add(canonicalOrigin + pathname, 'technical-endpoint');
add(canonicalOrigin + '/zq-migration-audit-nonexistent-route/', 'expected-404');
function attribute(tag, name) {
  return tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, 'i'))?.[1] ?? null;
}
function inspectHtml(html) {
  const tags = html.match(/<(?:link|meta)\b[^>]*>/gi) ?? [];
  const canonicals = tags.filter((tag) => attribute(tag, 'rel')?.toLowerCase() === 'canonical').map((tag) => attribute(tag, 'href'));
  const robots = tags.filter((tag) => /^(robots|googlebot)$/i.test(attribute(tag, 'name') ?? '')).map((tag) => attribute(tag, 'content'));
  const ogUrls = tags.filter((tag) => attribute(tag, 'property') === 'og:url').map((tag) => attribute(tag, 'content'));
  return { canonicals, robots, ogUrls, h1Count: (html.match(/<h1(?:\s|>)/gi) ?? []).length };
}
async function request(url) {
  let failure;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(15000), headers: { 'user-agent': 'ZQDomainMigrationAudit/1.0' } });
      return { status: response.status, location: response.headers.get('location'), contentType: response.headers.get('content-type'), body: await response.text() };
    } catch (error) { failure = error; }
  }
  throw failure;
}
async function audit(source, kinds) {
  const record = { source, kinds: [...kinds], chain: [], finalUrl: source, redirectHops: 0, failures: [] };
  const sourcePath = new URL(source).pathname;
  record.expectedFinalUrl = expectedPaths.get(sourcePath) ?? null;
  if (kinds.has('historical') && !record.expectedFinalUrl) record.mappingReviewRequired = true;
  const visited = new Set();
  try {
    for (let hop = 0; hop <= 8; hop++) {
      if (visited.has(record.finalUrl)) { record.failures.push('redirect-loop'); break; }
      visited.add(record.finalUrl);
      const response = await request(record.finalUrl);
      record.chain.push({ url: record.finalUrl, status: response.status, location: response.location });
      if (response.status >= 300 && response.status < 400 && response.location) {
        if (![301, 308].includes(response.status)) record.failures.push('temporary-redirect');
        if (hop === 8) { record.failures.push('redirect-limit'); break; }
        record.finalUrl = new URL(response.location, record.finalUrl).href;
        record.redirectHops++;
        continue;
      }
      record.finalStatus = response.status;
      const expectedStatus = kinds.has('expected-404') ? 404 : 200;
      if (response.status !== expectedStatus) record.failures.push(`final-status-${response.status}`);
      if (kinds.has('technical-endpoint')) {
        if (sourcePath === '/robots.txt' && !response.body.includes(`Sitemap: ${canonicalOrigin}/sitemap.xml`)) record.failures.push('robots-sitemap-mismatch');
        if (sourcePath.endsWith('.xml') && /<loc>https?:\/\/(?:www\.)?zqremovals\.au\//.test(response.body)) record.failures.push('sitemap-old-host');
      }
      if (response.contentType?.includes('text/html')) record.html = inspectHtml(response.body);
      break;
    }
    if (record.redirectHops > 1) record.failures.push('redirect-chain');
    if (record.expectedFinalUrl && record.finalUrl !== record.expectedFinalUrl) record.failures.push('unexpected-final-url');
    if (new URL(record.finalUrl).origin !== canonicalOrigin) record.failures.push('noncanonical-final-host');
    if (kinds.has('sitemap')) {
      if (record.redirectHops) record.failures.push('sitemap-redirect');
      if (record.html?.canonicals.length !== 1 || record.html.canonicals[0] !== source) record.failures.push('sitemap-canonical-mismatch');
      if (record.html?.robots.some((value) => /noindex/i.test(value ?? ''))) record.failures.push('sitemap-noindex');
      if (record.html?.h1Count !== 1) record.failures.push('sitemap-h1-count');
      if (record.html?.ogUrls.length !== 1 || record.html.ogUrls[0] !== source) record.failures.push('sitemap-og-url-mismatch');
    }
    if (new URL(source).hostname.endsWith('zqremovals.au') && !record.redirectHops) record.failures.push('old-host-not-redirected');
  } catch (error) { record.failures.push(`request-error: ${error.message}`); }
  return record;
}
const entries = [...cases];
const records = new Array(entries.length);
let cursor = 0;
await Promise.all(Array.from({ length: 5 }, async () => {
  while (cursor < entries.length) {
    const index = cursor++;
    records[index] = await audit(...entries[index]);
    if ((index + 1) % 50 === 0) console.log(`Audited ${index + 1}/${entries.length}`);
  }
}));
const report = { auditedAt: new Date().toISOString(), canonicalOrigin, scope: { sitemapUrls: sitemapUrls.size, historicalUrls: historicalUrls.size, totalCases: records.length, concurrency: 5 }, summary: { failedCases: records.filter((record) => record.failures.length).length, failureCounts: {} }, records };
for (const record of records) for (const failure of record.failures) report.summary.failureCounts[failure] = (report.summary.failureCounts[failure] ?? 0) + 1;
await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report.summary));
console.log(`Report: ${outputPath}`);
