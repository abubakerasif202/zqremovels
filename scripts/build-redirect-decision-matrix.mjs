/**
 * Builds reports/seo-final/redirect-decision-matrix.csv for every legacy URL.
 * Usage: node scripts/build-redirect-decision-matrix.mjs <old-domain GSC pages.csv>
 * Inputs: data/migration/redirect-decisions.json (pre-review state),
 *         data/migration/redirect-overrides.json (reviewed changes).
 */
import { readFileSync, writeFileSync } from 'node:fs';

const gscFile = process.argv[2];
if (!gscFile) throw new Error('Pass the old-domain GSC pages.csv path');
const NEW = 'https://zqremovalsadelaide.com.au';
const decisions = JSON.parse(readFileSync('data/migration/redirect-decisions.json', 'utf8'));
const overrides = new Map(JSON.parse(readFileSync('data/migration/redirect-overrides.json', 'utf8')).map((o) => [o.source, o]));

const gsc = new Map();
for (const line of readFileSync(gscFile, 'utf8').trim().split(/\r?\n/).slice(1)) {
  const c = line.split(',');
  gsc.set(c[3].replace('https://zqremovals.au', ''), { clicks: c[4], impressions: c[5], position: Number(c[7]).toFixed(1) });
}

// Decisions that are not simple KEEP/CHANGE. Nothing here is auto-implemented.
const special = new Map([
  ['/adelaide-moving-guides/how-long-moves-take-adelaide/', ['RESTORE', 'Best-performing redirected guide (2 clicks, 17 impressions, pos 5.6). Dedicated page justified, but needs owner-confirmed job durations; no durations invented. Redirect stays on the guide hub until then.']],
  ['/removalists-croydon/', ['REVIEW', '157 impressions at pos 40 ("business removals croydon"). No live page covers Croydon. Owner decision: differentiated western-suburbs page, or keep the generic hub.']],
  ['/fixed-price-removalists-adelaide/', ['REVIEW', 'Prices page covers hourly rates but not fixed-price quoting. Needs owner-confirmed fixed-price policy before any content or redirect change.']],
  ['/cheap-vs-fixed-price-removalists-adelaide/', ['REVIEW', 'Same fixed-price gap; comparison intent not covered by prices page.']],
  ['/adelaide-moving-guides/cheap-vs-fixed-price-removalists-adelaide/', ['REVIEW', 'Same fixed-price gap; 1 impression only.']],
  ['/fixed-price-vs-hourly-removalists-adelaide/', ['REVIEW', 'Hourly covered, fixed-price not; 88 impressions at pos 56.']],
  ['/adelaide-moving-guides/fixed-price-vs-hourly-removalists-adelaide/', ['REVIEW', 'Same fixed-price gap; 13 impressions.']],
  ['/adelaide-moving-guides/hourly-vs-fixed-price-movers-adelaide/', ['REVIEW', 'Same fixed-price gap; 1 impression.']],
  ['/budget-removalists-adelaide/', ['KEEP', 'Considered cheap-removalists-adelaide (456 impressions), but the merged price-intent consolidation sends budget/cost/quote URLs to the pricing page and its regression test asserts that. Owner may revisit.']],
  ['/removalists-victor-harbor/', ['REVIEW', 'Regional town outside the covered suburbs; confirm whether the business serves it.']],
  ['/removalists-woodville/', ['REVIEW', 'No live page covers Woodville and no confident neighbour; generic hub retained.']],
  ['/removalists-albert-park/', ['REVIEW', 'Currently the southern hub, which is geographically wrong; western-suburb page choice needs owner confirmation.']],
]);

const quote = (v) => `"${String(v ?? '').replaceAll('"', '""')}"`;
const rows = [['old_path', 'class', 'before_target', 'after_target', 'clicks_90d', 'impressions_90d', 'avg_position', 'reason']];
const counts = {};
for (const d of decisions) {
  const stat = gsc.get(d.source) || gsc.get(d.source.replace(/\/$/, '')) || {};
  const before = d.plannedTarget.replace(NEW, '');
  let cls; let after = before; let reason;
  if (overrides.has(d.source)) {
    cls = 'CHANGE'; after = overrides.get(d.source).destination; reason = overrides.get(d.source).reason;
  } else if (special.has(d.source)) {
    [cls, reason] = special.get(d.source);
  } else if (d.equivalent === true) {
    cls = 'KEEP'; reason = 'Same route/topic returns 200 and is self-canonical';
  } else {
    cls = 'KEEP';
    reason = 'No closer live page found; destination serves the parent intent (service, price, regional hub or guide library). Low search volume.';
  }
  counts[cls] = (counts[cls] || 0) + 1;
  rows.push([d.source, cls, before, after, stat.clicks ?? '', stat.impressions ?? '', stat.position ?? '', reason]);
}
writeFileSync('reports/seo-final/redirect-decision-matrix.csv', `${rows.map((r) => r.map(quote).join(',')).join('\n')}\n`);
console.log(counts, 'total', decisions.length);
