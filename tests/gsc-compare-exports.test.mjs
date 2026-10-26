import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { compareExports, loadExport, parseCsv, renderReport, summariseQueries } from '../scripts/gsc-compare-exports.mjs';

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
