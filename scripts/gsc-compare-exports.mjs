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


const DAY_MS = 24 * 60 * 60 * 1000;
const toDay = (value) => Date.parse(`${value}T00:00:00Z`);

// Inclusive number of calendar days between two YYYY-MM-DD dates.
export function inclusiveDays(start, end) {
  if (!start || !end) return null;
  const days = Math.round((toDay(end) - toDay(start)) / DAY_MS) + 1;
  return Number.isFinite(days) && days > 0 ? days : null;
}

// Days that actually carry data. A property may not have had impressions for the whole nominal window, so the
// nominal range (for example 90 days) can be much longer than the data (for example 54 days).
export function effectiveWindow(exportData) {
  const dates = (exportData.daily || []).map((row) => row.date).filter(Boolean).sort();
  const end = exportData.manifest.end_date || dates.at(-1) || null;
  const start = dates[0] || exportData.manifest.start_date || null;
  return {
    nominalDays: inclusiveDays(exportData.manifest.start_date, exportData.manifest.end_date),
    dataDays: inclusiveDays(start, end),
    firstDataDay: start,
    lastDay: end,
  };
}

// Totals for the final `days` calendar days of an export, from daily.csv. This is the like-for-like baseline for a
// shorter current window. Returns null when daily data is not available.
export function lastDaysTotals(exportData, days) {
  const rows = exportData.daily || [];
  const end = exportData.manifest.end_date || rows.map((row) => row.date).sort().at(-1);
  if (rows.length === 0 || !end || !days) return null;
  const cutoff = new Date(toDay(end) - (days - 1) * DAY_MS).toISOString().slice(0, 10);
  const window = rows.filter((row) => row.date >= cutoff && row.date <= end);
  return {
    clicks: window.reduce((sum, row) => sum + num(row.clicks), 0),
    impressions: window.reduce((sum, row) => sum + num(row.impressions), 0),
    position: weightedPosition(window),
    days,
  };
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
  const [summaryRows, pages, queries, pageQueries, manifest, daily] = await Promise.all([
    readRows(dir, 'summary.csv'),
    readRows(dir, 'pages.csv'),
    readRows(dir, 'queries.csv'),
    readRows(dir, 'page_queries.csv').catch(() => []),
    readFile(path.join(dir, 'manifest.json'), 'utf8').then(JSON.parse).catch(() => ({})),
    readRows(dir, 'daily.csv').catch(() => []),
  ]);
  return { dir, manifest, summary: summaryRows[0] || {}, pages, queries, pageQueries, daily };
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

  const baselineWindow = effectiveWindow(baseline);
  const currentWindow = effectiveWindow(current);
  const comparableDays = currentWindow.dataDays || currentWindow.nominalDays;
  const windows = {
    baseline: baselineWindow,
    current: currentWindow,
    // Raw totals are only comparable when both windows cover the same number of days.
    mismatch: Boolean(baselineWindow.dataDays && currentWindow.dataDays && baselineWindow.dataDays !== currentWindow.dataDays),
    matchedBaseline: lastDaysTotals(baseline, comparableDays),
  };
  const perDay = (stats, days) => (stats && days ? { clicks: stats.clicks / days, impressions: stats.impressions / days } : null);

  return {
    windows,
    perDayTotals: {
      baseline: perDay(summarise(baseline.summary), baselineWindow.dataDays),
      current: perDay(summarise(current.summary), currentWindow.dataDays),
      baselineNonBranded: perDay(baseQueries.nonBranded, baselineWindow.dataDays),
      currentNonBranded: perDay(currentQueries.nonBranded, currentWindow.dataDays),
    },
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

function summarise(summary) {
  return { clicks: num(summary.clicks), impressions: num(summary.impressions), position: num(summary.position) };
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
  const { windows, perDayTotals } = result;
  lines.push('## Window check');
  lines.push('');
  lines.push(`- Baseline: ${windows.baseline.nominalDays ?? '?'} nominal days, data on ${windows.baseline.dataDays ?? '?'} days (first data ${windows.baseline.firstDataDay ?? 'unknown'}).`);
  lines.push(`- Current: ${windows.current.nominalDays ?? '?'} nominal days, data on ${windows.current.dataDays ?? '?'} days (first data ${windows.current.firstDataDay ?? 'unknown'}).`);
  if (windows.mismatch) {
    lines.push('- WARNING: the windows have different lengths. Do not compare raw totals. Use the matched baseline and per-day rates below.');
  } else {
    lines.push('- Windows have the same number of data days; raw totals are comparable.');
  }
  lines.push('');
  if (windows.matchedBaseline) {
    lines.push(`Matched baseline (last ${windows.matchedBaseline.days} days of the baseline export, from daily data):`);
    lines.push('');
    lines.push('| Segment | Matched baseline | Current |');
    lines.push('| --- | --- | --- |');
    lines.push(`| All traffic (clicks / impressions / position) | ${cell(windows.matchedBaseline)} | ${cell(result.totals.after)} |`);
    lines.push('');
  }
  const rate = (stats) => (stats ? `${fmt(stats.clicks, 2)} clicks/day, ${fmt(stats.impressions, 0)} impressions/day` : 'n/a');
  lines.push('| Per-day rate | Baseline | Current |');
  lines.push('| --- | --- | --- |');
  lines.push(`| All traffic | ${rate(perDayTotals.baseline)} | ${rate(perDayTotals.current)} |`);
  lines.push(`| Non-branded queries | ${rate(perDayTotals.baselineNonBranded)} | ${rate(perDayTotals.currentNonBranded)} |`);
  lines.push('');
  lines.push('## Totals (raw, only comparable when the windows match)');
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
