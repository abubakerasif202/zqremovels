import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { google } from 'googleapis';

const root = process.cwd();
const outDir = path.join(root, 'data', 'gsc');
const tokenPath = path.join(root, '.gsc-token.json');
const defaultSite = 'sc-domain:zqremovals.au';
const fallbackSite = 'https://zqremovals.au/';
const preferredSites = normalizeSites(process.env.GSC_SITE || defaultSite);
const startDate = daysAgo(28);
const endDate = todayIso();
const compareStartDate = daysAgo(56);
const compareEndDate = daysAgo(29);
const reportConfig = [
  { name: 'page', dimensions: ['page'] },
  { name: 'query', dimensions: ['query'] },
  { name: 'page-query', dimensions: ['page', 'query'] },
  { name: 'page-device', dimensions: ['page', 'device'] },
];

const tokens = JSON.parse(await readFile(tokenPath, 'utf8'));
const creds = await loadClient();
const oauth2Client = new google.auth.OAuth2(creds.client_id, creds.client_secret, creds.redirect_uris?.[0] || 'http://127.0.0.1:8085/oauth2callback');
oauth2Client.setCredentials(tokens);

const searchconsole = google.searchconsole({ version: 'v1', auth: oauth2Client });
await mkdir(outDir, { recursive: true });

const site = await resolveSite(searchconsole, preferredSites);
const reports = {};
for (const config of reportConfig) {
  const current = await fetchRows(searchconsole, site, config.dimensions, startDate, endDate);
  const previous = await fetchRows(searchconsole, site, config.dimensions, compareStartDate, compareEndDate);
  reports[config.name] = { current, previous, dimensions: config.dimensions };
  await writeFile(path.join(outDir, `${config.name}.raw.json`), JSON.stringify({ current, previous }, null, 2) + '\n', 'utf8');
}

const pageRows = reports.page.current;
const queryRows = reports.query.current;
const pageQueryRows = reports['page-query'].current;
const pageDeviceRows = reports['page-device'].current;

const summary = buildSummary({ site, startDate, endDate, compareStartDate, compareEndDate, reports });
const opportunities = {
  pages: rankPageOpportunities(pageRows),
  queries: rankQueryOpportunities(queryRows),
  cannibalization: findCannibalization(pageQueryRows),
  pageDevice: pageDeviceRows,
  generatedAt: new Date().toISOString(),
  site,
  dateRange: { startDate, endDate, compareStartDate, compareEndDate },
};

await writeFile(path.join(outDir, 'latest-search-analytics.json'), JSON.stringify({ site, dateRange: { startDate, endDate, compareStartDate, compareEndDate }, reports }, null, 2) + '\n', 'utf8');
await writeFile(path.join(outDir, 'latest-page-opportunities.json'), JSON.stringify(opportunities.pages, null, 2) + '\n', 'utf8');
await writeFile(path.join(outDir, 'latest-query-opportunities.json'), JSON.stringify(opportunities.queries, null, 2) + '\n', 'utf8');
await writeFile(path.join(outDir, 'latest-cannibalization.json'), JSON.stringify(opportunities.cannibalization, null, 2) + '\n', 'utf8');
await writeFile(path.join(outDir, 'latest-summary.md'), summary, 'utf8');

console.log(`Fetched Search Console data for ${site} from ${startDate} to ${endDate}`);
console.log(`Saved outputs to ${outDir}`);

async function loadClient() {
  const client = JSON.parse(await readFile(path.join(root, 'secrets', 'gsc-oauth-client.json'), 'utf8'));
  return client.installed || client.web || client;
}

async function resolveSite(searchconsole, sites) {
  let lastError;
  for (const candidate of sites) {
    try {
      await searchconsole.searchanalytics.query({
        siteUrl: candidate,
        requestBody: {
          startDate,
          endDate,
          dimensions: ['page'],
          rowLimit: 1,
        },
      });
      return candidate;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error('Unable to resolve a Search Console property');
}

async function fetchRows(searchconsole, siteUrl, dimensions, startDateValue, endDateValue) {
  const rows = [];
  let startRow = 0;
  while (true) {
    const response = await searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: startDateValue,
        endDate: endDateValue,
        dimensions,
        rowLimit: 25000,
        startRow,
      },
    });
    const batch = response.data.rows || [];
    rows.push(...batch.map((row) => normalizeRow(row, dimensions, startDateValue, endDateValue)));
    if (batch.length < 25000) break;
    startRow += batch.length;
  }
  return rows.sort((a, b) => b.impressions - a.impressions || b.clicks - a.clicks);
}

function normalizeRow(row, dimensions, startDateValue, endDateValue) {
  const keys = row.keys || [];
  return {
    dimensions: Object.fromEntries(dimensions.map((dimension, index) => [dimension, keys[index] || ''])),
    clicks: row.clicks || 0,
    impressions: row.impressions || 0,
    ctr: row.ctr || 0,
    position: row.position || 0,
    startDate: startDateValue,
    endDate: endDateValue,
  };
}

function rankPageOpportunities(rows) {
  return rows
    .filter((row) => row.impressions > 0)
    .map((row) => ({
      page: row.dimensions.page,
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position,
      priority:
        row.clicks === 0 ? 1000 + row.impressions :
        row.position >= 4 && row.position <= 20 ? 500 + row.impressions :
        row.ctr < 0.03 ? 250 + row.impressions :
        row.impressions,
    }))
    .sort((a, b) => b.priority - a.priority || b.impressions - a.impressions)
    .slice(0, 200);
}

function rankQueryOpportunities(rows) {
  return rows
    .filter((row) => row.impressions > 0)
    .map((row) => ({
      query: row.dimensions.query,
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position,
      priority:
        row.clicks === 0 ? 1000 + row.impressions :
        row.position >= 4 && row.position <= 20 ? 500 + row.impressions :
        row.ctr < 0.03 ? 250 + row.impressions :
        row.impressions,
    }))
    .sort((a, b) => b.priority - a.priority || b.impressions - a.impressions)
    .slice(0, 200);
}

function findCannibalization(rows) {
  const byQuery = new Map();
  for (const row of rows) {
    const query = row.dimensions.query || '';
    if (!query) continue;
    if (!byQuery.has(query)) byQuery.set(query, []);
    byQuery.get(query).push(row);
  }

  return [...byQuery.entries()]
    .map(([query, queryRows]) => ({
      query,
      pages: queryRows
        .filter((row) => row.dimensions.page)
        .sort((a, b) => b.impressions - a.impressions || a.position - b.position)
        .slice(0, 10)
        .map((row) => ({
          page: row.dimensions.page,
          clicks: row.clicks,
          impressions: row.impressions,
          ctr: row.ctr,
          position: row.position,
        })),
    }))
    .filter((entry) => entry.pages.length > 1)
    .sort((a, b) => b.pages.reduce((sum, row) => sum + row.impressions, 0) - a.pages.reduce((sum, row) => sum + row.impressions, 0))
    .slice(0, 200);
}

function buildSummary({ site, startDate, endDate, compareStartDate, compareEndDate, reports }) {
  const pageTotal = aggregate(reports.page.current);
  const queryTotal = aggregate(reports.query.current);
  return [
    `# Google Search Console Summary`,
    ``,
    `- Site property: \`${site}\``,
    `- Current range: ${startDate} to ${endDate}`,
    `- Comparison range: ${compareStartDate} to ${compareEndDate}`,
    `- Page clicks: ${pageTotal.clicks}`,
    `- Page impressions: ${pageTotal.impressions}`,
    `- Query clicks: ${queryTotal.clicks}`,
    `- Query impressions: ${queryTotal.impressions}`,
    ``,
    `## Top Pages`,
    ...reports.page.current.slice(0, 20).map((row) => `- ${row.dimensions.page} | clicks ${row.clicks} | impressions ${row.impressions} | ctr ${formatPercent(row.ctr)} | pos ${row.position.toFixed(1)}`),
  ].join('\n');
}

function aggregate(rows) {
  return rows.reduce((acc, row) => {
    acc.clicks += row.clicks;
    acc.impressions += row.impressions;
    return acc;
  }, { clicks: 0, impressions: 0 });
}

function formatPercent(value) {
  return `${(value * 100).toFixed(2)}%`;
}

function daysAgo(days) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

function normalizeSites(value) {
  return String(value)
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .flatMap((entry) => (entry === defaultSite ? [defaultSite, fallbackSite] : [entry]));
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}
