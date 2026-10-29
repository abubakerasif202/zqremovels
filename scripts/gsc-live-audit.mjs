import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { google } from 'googleapis';

// Read-only live Search Console audit: daily series, queries, sitemaps and URL Inspection of every sitemap URL.
// Usage: node scripts/gsc-live-audit.mjs [outFile.json]
const root = process.cwd();
const site = process.env.GSC_SITE || 'sc-domain:zqremovalsadelaide.com.au';
const sitemapUrl = 'https://zqremovalsadelaide.com.au/sitemap.xml';
const clientPath = process.env.GSC_OAUTH_CLIENT_PATH || 'C:\\Users\\abuba\\gsc-private\\credentials.json';
const outFile = process.argv[2] || path.join(root, 'data', 'gsc', 'live-audit.json');
const DATA_START = '2026-08-30';
const INSPECT_CONCURRENCY = 5;

const clientFile = JSON.parse(await readFile(clientPath, 'utf8'));
const creds = clientFile.installed || clientFile.web;
const tokens = JSON.parse(await readFile(path.join(root, '.gsc-token.json'), 'utf8'));
const auth = new google.auth.OAuth2(creds.client_id, creds.client_secret);
auth.setCredentials(tokens);
const sc = google.searchconsole({ version: 'v1', auth });

const today = new Date().toISOString().slice(0, 10);
const query = async (dimensions, rowLimit = 25000, extra = {}) => {
  const res = await sc.searchanalytics.query({
    siteUrl: site,
    requestBody: { startDate: DATA_START, endDate: today, dimensions, rowLimit, dataState: 'all', ...extra },
  });
  return res.data.rows || [];
};

const daily = (await query(['date'])).map((r) => ({ date: r.keys[0], clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position }));
const queries = await query(['query']);
const pages = await query(['page']);

const sitemaps = (await sc.sitemaps.list({ siteUrl: site })).data.sitemap || [];

const locs = async (url) => [...(await (await fetch(url)).text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const children = (await locs(sitemapUrl)).filter((u) => !u.includes('sitemap-images'));
const urls = [...new Set((await Promise.all(children.map((u) => (u.endsWith('.xml') ? locs(u) : [u])))).flat())];
const sitemapDetails = [];
for (const child of [sitemapUrl, ...children]) {
  try {
    const d = (await sc.sitemaps.get({ siteUrl: site, feedpath: child })).data;
    sitemapDetails.push({ path: d.path, errors: d.errors, warnings: d.warnings, lastDownloaded: d.lastDownloaded, contents: d.contents });
  } catch (error) {
    sitemapDetails.push({ path: child, error: error.message });
  }
}
const inspections = [];
for (let i = 0; i < urls.length; i += INSPECT_CONCURRENCY) {
  const batch = urls.slice(i, i + INSPECT_CONCURRENCY);
  const results = await Promise.all(batch.map(async (url) => {
    try {
      const r = (await sc.urlInspection.index.inspect({ requestBody: { inspectionUrl: url, siteUrl: site } })).data.inspectionResult.indexStatusResult || {};
      return { url, verdict: r.verdict, coverage: r.coverageState, lastCrawl: r.lastCrawlTime, userCanonical: r.userCanonical, googleCanonical: r.googleCanonical, robots: r.robotsTxtState, indexing: r.indexingState };
    } catch (error) {
      return { url, error: error.message };
    }
  }));
  inspections.push(...results);
}

const out = { site, generatedAt: new Date().toISOString(), dataStart: DATA_START, endDate: today, daily, queries, pages, sitemaps, sitemapDetails, sitemapUrlCount: urls.length, inspections };
await mkdir(path.dirname(outFile), { recursive: true });
await writeFile(outFile, JSON.stringify(out, null, 2) + '\n', 'utf8');
console.log(`Saved ${outFile}: ${daily.length} days, ${queries.length} queries, ${pages.length} pages, ${sitemaps.length} sitemaps, ${inspections.length} inspections`);
