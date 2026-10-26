import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Compares two Search Console CSV export folders (same layout as the 25 Oct 2026 baseline export:
// summary.csv, pages.csv, queries.csv, page_queries.csv). Read-only: it never calls Google.
// Usage: node scripts/gsc-compare-exports.mjs <baselineDir> <currentDir> [outFile.md]

export const BRAND_PATTERN = /\bzq\b|zq removals|zqremovals/i;

export const TARGET_PAGES = [
  '/removalists-medindie/',
  '/removalists-unley-park/',
  '/removalists-hyde-park/',
  '/removalists-adelaide/',
  '/furniture-removalists-adelaide/',
  '/same-day-removalists-adelaide/',
  '/removalists-adelaide-prices/',
  '/office-removals-adelaide/',
];

export const TARGET_QUERIES = [
  'hyde park removalists',
  'unley park removalist',
  'medindie removalist',
  'removalists adelaide prices',
  'office removalists adelaide',
  'same day removalists',
  'furniture movers adelaide',
];

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  const source = text.replace(/^﻿/, '');
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (quoted) {
      if (char === '"' && source[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && source[index + 1] === '\n') index += 1;
      row.push(field);
      field = '';
      if (row.some((cell) => cell !== '')) rows.push(row);
      row = [];
    } else {
      field += char;
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  const [header = [], ...body] = rows;
  return body.map((cells) => Object.fromEntries(header.map((name, i) => [name, cells[i] ?? ''])));
}

const num = (value) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

async function readRows(dir, file) {
  return parseCsv(await readFile(path.join(dir, file), 'utf8'));
}

const toPath = (url) => url.replace(/^https?:\/\/[^/]+/i, '') || '/';

// Impression-weighted average position across rows.
function weightedPosition(rows) {
  const impressions = rows.reduce((sum, row) => sum + num(row.impressions), 0);
  if (impressions === 0) return 0;
  return rows.reduce((sum, row) => sum + num(row.position) * num(row.impressions), 0) / impressions;
}

export function summariseQueries(queryRows) {
  const split = (rows) => ({
    clicks: rows.reduce((sum, row) => sum + num(row.clicks), 0),
    impressions: rows.reduce((sum, row) => sum + num(row.impressions), 0),
    position: weightedPosition(rows),
  });
  const branded = queryRows.filter((row) => BRAND_PATTERN.test(row.query));
  const nonBranded = queryRows.filter((row) => !BRAND_PATTERN.test(row.query));
  return { branded: split(branded), nonBranded: split(nonBranded), all: split(queryRows) };
}

export async function loadExport(dir) {
  const [summaryRows, pages, queries, pageQueries, manifest] = await Promise.all([
    readRows(dir, 'summary.csv'),
    readRows(dir, 'pages.csv'),
    readRows(dir, 'queries.csv'),
    readRows(dir, 'page_queries.csv').catch(() => []),
    readFile(path.join(dir, 'manifest.json'), 'utf8').then(JSON.parse).catch(() => ({})),
  ]);
  return { dir, manifest, summary: summaryRows[0] || {}, pages, queries, pageQueries };
}

function pageMap(pages) {
  return new Map(pages.map((row) => [toPath(row.page), row]));
}

function queryMap(queries) {
  return new Map(queries.map((row) => [row.query.toLowerCase(), row]));
}

export function compareExports(baseline, current) {
  const baseQueries = summariseQueries(baseline.queries);
  const currentQueries = summariseQueries(current.queries);
  const basePages = pageMap(baseline.pages);
  const currentPages = pageMap(current.pages);
  const baseQueryRows = queryMap(baseline.queries);
  const currentQueryRows = queryMap(current.queries);

  const pageDeltas = TARGET_PAGES.map((pagePath) => {
    const before = basePages.get(pagePath);
    const after = currentPages.get(pagePath);
    return {
      page: pagePath,
      before: before ? { clicks: num(before.clicks), impressions: num(before.impressions), position: num(before.position) } : null,
      after: after ? { clicks: num(after.clicks), impressions: num(after.impressions), position: num(after.position) } : null,
    };
  });

  const queryDeltas = TARGET_QUERIES.map((query) => {
    const before = baseQueryRows.get(query);
    const after = currentQueryRows.get(query);
    return {
      query,
      before: before ? { clicks: num(before.clicks), impressions: num(before.impressions), position: num(before.position) } : null,
      after: after ? { clicks: num(after.clicks), impressions: num(after.impressions), position: num(after.position) } : null,
    };
  });

  // Pages that reached page one (average position <= 10) in the current export but not the baseline.
  const newPageOne = [...currentPages.entries()]
    .filter(([pagePath, row]) => num(row.position) > 0 && num(row.position) <= 10 && num(row.impressions) >= 10)
    .filter(([pagePath]) => {
      const before = basePages.get(pagePath);
      return !before || num(before.position) > 10;
    })
    .map(([pagePath, row]) => ({ page: pagePath, position: num(row.position), impressions: num(row.impressions) }));

  return {
    baselineRange: [baseline.manifest.start_date, baseline.manifest.end_date],
    currentRange: [current.manifest.start_date, current.manifest.end_date],
    totals: {
      before: { clicks: num(baseline.summary.clicks), impressions: num(baseline.summary.impressions), position: num(baseline.summary.position) },
      after: { clicks: num(current.summary.clicks), impressions: num(current.summary.impressions), position: num(current.summary.position) },
    },
    baseQueries,
    currentQueries,
    pageDeltas,
    queryDeltas,
    newPageOne,
  };
}

const fmt = (value, digits = 1) => (value === null || value === undefined ? 'n/a' : Number(value).toFixed(digits));
const cell = (stats) => (stats ? `${fmt(stats.clicks, 0)} / ${fmt(stats.impressions, 0)} / ${fmt(stats.position)}` : 'not in export');

export function renderReport(result) {
  const lines = [];
  lines.push('# Search Console comparison');
  lines.push('');
  lines.push(`Baseline range: ${result.baselineRange.join(' to ') || 'unknown'}`);
  lines.push(`Current range: ${result.currentRange.join(' to ') || 'unknown'}`);
  lines.push('');
  lines.push('Cells are clicks / impressions / average position.');
  lines.push('');
  lines.push('## Totals');
  lines.push('');
  lines.push('| Segment | Baseline | Current |');
  lines.push('| --- | --- | --- |');
  lines.push(`| All traffic | ${cell(result.totals.before)} | ${cell(result.totals.after)} |`);
  lines.push(`| Branded queries | ${cell(result.baseQueries.branded)} | ${cell(result.currentQueries.branded)} |`);
  lines.push(`| Non-branded queries | ${cell(result.baseQueries.nonBranded)} | ${cell(result.currentQueries.nonBranded)} |`);
  lines.push('');
  lines.push('## Target pages');
  lines.push('');
  lines.push('| Page | Baseline | Current |');
  lines.push('| --- | --- | --- |');
  for (const row of result.pageDeltas) lines.push(`| ${row.page} | ${cell(row.before)} | ${cell(row.after)} |`);
  lines.push('');
  lines.push('## Target queries');
  lines.push('');
  lines.push('| Query | Baseline | Current |');
  lines.push('| --- | --- | --- |');
  for (const row of result.queryDeltas) lines.push(`| ${row.query} | ${cell(row.before)} | ${cell(row.after)} |`);
  lines.push('');
  lines.push('## Pages newly on page one (average position 10 or better, 10+ impressions)');
  lines.push('');
  if (result.newPageOne.length === 0) {
    lines.push('None.');
  } else {
    for (const row of result.newPageOne) lines.push(`- ${row.page}: position ${fmt(row.position)}, ${fmt(row.impressions, 0)} impressions`);
  }
  lines.push('');
  lines.push('Caveats: Search Console average position is impression-weighted and shifts with query mix; compare equal-length date ranges and treat changes under a few clicks as noise.');
  return `${lines.join('\n')}\n`;
}

async function main() {
  const [baselineDir, currentDir, outFile] = process.argv.slice(2);
  if (!baselineDir || !currentDir) {
    console.error('Usage: node scripts/gsc-compare-exports.mjs <baselineDir> <currentDir> [outFile.md]');
    process.exit(1);
  }
  const report = renderReport(compareExports(await loadExport(baselineDir), await loadExport(currentDir)));
  if (outFile) {
    await mkdir(path.dirname(path.resolve(outFile)), { recursive: true });
    await writeFile(outFile, report, 'utf8');
    console.log(`Wrote ${outFile}`);
  } else {
    process.stdout.write(report);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
