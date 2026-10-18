import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

// Read-only public crawl. Never submits forms or invokes customer APIs.
const origin = 'https://zqremovalsadelaide.com.au';
const output = process.env.PRODUCTION_AUDIT_OUTPUT || 'tmp/production-audit.json';
const failures = [];
const pages = [];
const sitemaps = [];
const assets = new Set();
const urls = new Set();
const fetchPublic = url => fetch(url, { signal: AbortSignal.timeout(25000), redirect: 'manual' });
async function sitemap(url) {
  const response = await fetchPublic(url);
  const xml = await response.text();
  sitemaps.push({ url, status: response.status });
  if (response.status !== 200) failures.push(`Sitemap HTTP ${response.status}: ${url}`);
  const locations = [...xml.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/g)].map(m => m[1]);
  if (!locations.length) failures.push(`Empty sitemap: ${url}`);
  if (xml.includes('<sitemapindex')) {
    for (const location of locations) await sitemap(location);
  } else {
    for (const location of locations) {
      if (new URL(location).origin !== origin) failures.push(`Noncanonical sitemap host: ${location}`);
      urls.add(location);
    }
  }
}
async function parallel(items, work) {
  let index = 0;
  await Promise.all(Array.from({ length: 5 }, async () => {
    while (index < items.length) await work(items[index++]);
  }));
}
await sitemap(`${origin}/sitemap.xml`);
await parallel([...urls], async url => {
  try {
    const response = await fetchPublic(url);
    const html = await response.text();
    const canonical = html.match(/<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"/i)?.[1];
    const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1];
    const h1Count = [...html.matchAll(/<h1\b/gi)].length;
    const jsonLd = [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)];
    for (const match of jsonLd) JSON.parse(match[1]);
    for (const match of html.matchAll(/<(?:img|script)\b[^>]*src="([^"]+)"|<link\b[^>]*href="([^"]+\.(?:css|woff2)(?:\?[^"]*)?)"/gi)) {
      const asset = new URL(match[1] || match[2], url);
      if (asset.origin === origin) assets.add(asset.href);
    }
    const problems = [];
    if (response.status !== 200) problems.push(`HTTP ${response.status}`);
    if (canonical !== url) problems.push(`canonical ${canonical}`);
    if (!title) problems.push('missing title');
    if (h1Count !== 1) problems.push(`${h1Count} H1s`);
    if (/<meta\b[^>]*name="robots"[^>]*content="[^"]*noindex/i.test(html)) problems.push('noindex in sitemap');
    failures.push(...problems.map(problem => `${url}: ${problem}`));
    pages.push({ url, status: response.status, canonical, title, h1Count, schemas: jsonLd.length });
  } catch (error) { failures.push(`${url}: ${error.message}`); }
});
const assetResults = [];
await parallel([...assets], async url => {
  try {
    const response = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(25000), redirect: 'manual' });
    assetResults.push({ url, status: response.status });
    if (response.status !== 200) failures.push(`Asset HTTP ${response.status}: ${url}`);
  } catch (error) { failures.push(`Asset ${url}: ${error.message}`); }
});
const redirects = [];
for (const path of ['/', '/contact-us/', '/house-removals-adelaide/', '/removalists-adelaide.html']) {
  for (const host of ['zqremovals.au', 'www.zqremovals.au', 'www.zqremovalsadelaide.com.au']) {
    const url = `https://${host}${path}`;
    const response = await fetchPublic(url);
    const location = response.headers.get('location');
    redirects.push({ url, status: response.status, location });
    if (![301, 308].includes(response.status) || !location?.startsWith(origin)) failures.push(`Legacy redirect: ${url} -> ${response.status} ${location}`);
    if (location) {
      const destination = await fetchPublic(new URL(location, url));
      if (destination.status !== 200) failures.push(`Redirect chain or invalid target: ${url} -> ${location} -> ${destination.status}`);
    }
  }
}
const robotsResponse = await fetchPublic(`${origin}/robots.txt`);
const robots = await robotsResponse.text();
if (robotsResponse.status !== 200 || !robots.includes(`${origin}/sitemap.xml`) || /Disallow:\s*\/\s*(?:\r?\n|$)/i.test(robots)) failures.push('Invalid production robots');
const notFound = await fetchPublic(`${origin}/zq-audit-nonexistent-route-20261018/`);
if (notFound.status !== 404) failures.push(`Missing route returns ${notFound.status}`);
await mkdir(dirname(output), { recursive: true });
await writeFile(output, JSON.stringify({ checkedAt: new Date().toISOString(), sitemaps, pages, assets: assetResults, redirects, robots: { status: robotsResponse.status, text: robots }, notFoundStatus: notFound.status, failures }, null, 2));
console.log(JSON.stringify({ pages: pages.length, assets: assets.size, redirects: redirects.length, failures }, null, 2));
if (failures.length) process.exitCode = 1;
