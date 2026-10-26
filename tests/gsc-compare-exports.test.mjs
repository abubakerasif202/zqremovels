import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { compareExports, effectiveWindow, inclusiveDays, lastDaysTotals, loadExport, parseCsv, renderReport, summariseQueries } from '../scripts/gsc-compare-exports.mjs';

const HOST = 'https://zqremovalsadelaide.com.au';

async function writeExport(files, manifest = {}) {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'gsc-export-'));
  await writeFile(path.join(dir, 'manifest.json'), JSON.stringify(manifest));
  for (const [name, content] of Object.entries(files)) {
    await writeFile(path.join(dir, name), `﻿${content}`);
  }
  return dir;
}

test('parseCsv strips the BOM and handles quoted commas and quotes', () => {
  const rows = parseCsv('﻿query,clicks\n"a, ""b""",2\nplain,1\n');
  assert.deepEqual(rows, [{ query: 'a, "b"', clicks: '2' }, { query: 'plain', clicks: '1' }]);
});

test('summariseQueries separates branded from non-branded and weights position by impressions', () => {
  const summary = summariseQueries([
    { query: 'zq removals', clicks: '13', impressions: '94', position: '2' },
    { query: 'hyde park removalists', clicks: '0', impressions: '100', position: '10' },
    { query: 'unley park removalist', clicks: '1', impressions: '300', position: '20' },
  ]);
  assert.equal(summary.branded.clicks, 13);
  assert.equal(summary.nonBranded.clicks, 1);
  assert.equal(summary.nonBranded.impressions, 400);
  assert.equal(summary.nonBranded.position, 17.5);
});

test('compareExports reports target page and query movement and newly page-one pages', async () => {
  const header = 'clicks,impressions,ctr_percent,position';
  const baseline = await writeExport({
    'summary.csv': `${header}\n41,7729,0.53,37.2\n`,
    'pages.csv': `page,${header}\n${HOST}/removalists-medindie/,0,126,0,11.9\n`,
    'queries.csv': `query,${header}\nmedindie removalist,0,29,0,11.1\nzq removals,13,94,13.8,2\n`,
    'page_queries.csv': 'page,query,clicks,impressions,ctr_percent,position\n',
  }, { start_date: '2026-07-25', end_date: '2026-10-22' });
  const current = await writeExport({
    'summary.csv': `${header}\n60,9000,0.67,30\n`,
    'pages.csv': `page,${header}\n${HOST}/removalists-medindie/,3,150,2,8.5\n${HOST}/removalists-hyde-park/,0,300,0,9.2\n`,
    'queries.csv': `query,${header}\nmedindie removalist,3,40,7.5,8.4\nzq removals,15,100,15,1.9\n`,
    'page_queries.csv': 'page,query,clicks,impressions,ctr_percent,position\n',
  }, { start_date: '2026-10-23', end_date: '2026-11-20' });

  try {
    const result = compareExports(await loadExport(baseline), await loadExport(current));
    const medindie = result.pageDeltas.find((row) => row.page === '/removalists-medindie/');
    assert.equal(medindie.before.position, 11.9);
    assert.equal(medindie.after.position, 8.5);
    assert.equal(result.pageDeltas.find((row) => row.page === '/removalists-hyde-park/').before, null);
    assert.equal(result.queryDeltas.find((row) => row.query === 'medindie removalist').after.clicks, 3);
    assert.deepEqual(result.newPageOne.map((row) => row.page).sort(), ['/removalists-hyde-park/', '/removalists-medindie/']);
    assert.equal(result.currentQueries.nonBranded.clicks, 3);

    const report = renderReport(result);
    assert.match(report, /Non-branded queries/);
    assert.match(report, /\/removalists-medindie\/ \| 0 \/ 126 \/ 11\.9 \| 3 \/ 150 \/ 8\.5/);
    assert.match(report, /2026-10-23 to 2026-11-20/);
  } finally {
    await rm(baseline, { recursive: true, force: true });
    await rm(current, { recursive: true, force: true });
  }
});

test('inclusiveDays counts both end dates', () => {
  assert.equal(inclusiveDays('2026-10-09', '2026-10-22'), 14);
  assert.equal(inclusiveDays('2026-07-25', '2026-10-22'), 90);
  assert.equal(inclusiveDays(undefined, '2026-10-22'), null);
});

test('a 90-day baseline is not compared raw against a 14-day window', async () => {
  const header = 'clicks,impressions,ctr_percent,position';
  const dailyRows = [];
  // Data only exists for the last 20 days of the nominal 90-day range, as in the real baseline export.
  for (let day = 3; day <= 22; day += 1) {
    dailyRows.push(`2026-10-${String(day).padStart(2, '0')},${day >= 9 ? 1 : 0},${100 + day},0,30`);
  }
  const currentRows = Array.from({ length: 14 }, (_, i) => `2026-11-${String(i + 1).padStart(2, '0')},0,120,0,28`);
  const baseline = await writeExport({
    'summary.csv': `${header}\n14,2520,0.5,30\n`,
    'pages.csv': `page,${header}\n`,
    'queries.csv': `query,${header}\nmedindie removalist,2,200,1,12\n`,
    'daily.csv': `date,${header}\n${dailyRows.join('\n')}\n`,
  }, { start_date: '2026-07-25', end_date: '2026-10-22' });
  const current = await writeExport({
    'summary.csv': `${header}\n6,1700,0.4,28\n`,
    'pages.csv': `page,${header}\n`,
    'queries.csv': `query,${header}\nmedindie removalist,1,120,0.8,11\n`,
    'daily.csv': `date,${header}\n${currentRows.join('\n')}\n`,
  }, { start_date: '2026-11-01', end_date: '2026-11-14' });

  try {
    const loadedBaseline = await loadExport(baseline);
    const loadedCurrent = await loadExport(current);
    const window = effectiveWindow(loadedBaseline);
    assert.deepEqual([window.nominalDays, window.dataDays], [90, 20]);

    const matched = lastDaysTotals(loadedBaseline, 14);
    assert.equal(matched.days, 14);
    assert.equal(matched.clicks, 14);
    assert.equal(matched.impressions, Array.from({ length: 14 }, (_, i) => 100 + 9 + i).reduce((a, b) => a + b, 0));

    const result = compareExports(loadedBaseline, loadedCurrent);
    assert.equal(result.windows.mismatch, true);
    assert.equal(result.windows.matchedBaseline.days, 14);
    assert.equal(result.perDayTotals.baseline.clicks, 14 / 20);
    assert.equal(result.perDayTotals.current.clicks, 6 / 14);

    const report = renderReport(result);
    assert.match(report, /WARNING: the windows have different lengths/);
    assert.match(report, /Matched baseline \(last 14 days/);
    assert.match(report, /Per-day rate/);
  } finally {
    await rm(baseline, { recursive: true, force: true });
    await rm(current, { recursive: true, force: true });
  }
});

test('matching windows report that raw totals are comparable', async () => {
  const header = 'clicks,impressions,ctr_percent,position';
  const files = {
    'summary.csv': `${header}\n2,200,1,10\n`,
    'pages.csv': `page,${header}\n`,
    'queries.csv': `query,${header}\n`,
    'daily.csv': `date,${header}\n2026-10-01,1,100,1,10\n2026-10-02,1,100,1,10\n`,
  };
  const manifest = { start_date: '2026-10-01', end_date: '2026-10-02' };
  const first = await writeExport(files, manifest);
  const second = await writeExport(files, manifest);
  try {
    const report = renderReport(compareExports(await loadExport(first), await loadExport(second)));
    assert.match(report, /raw totals are comparable/);
    assert.doesNotMatch(report, /WARNING/);
  } finally {
    await rm(first, { recursive: true, force: true });
    await rm(second, { recursive: true, force: true });
  }
});
