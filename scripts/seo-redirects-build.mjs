/**
 * SEO route-consolidation redirect builder.
 *
 * Source of truth: the Google Search Console audit outputs in the repo root
 * (zq-redirects.json + zq-manual-review.csv + zq-keep-list.csv).
 *
 * Produces two artefacts consumed by the build + deploy:
 *   - site-src/data/zq-redirects-verified.json  -> 301s that are safe to ship now
 *   - site-src/data/zq-redirects-deferred.json  -> 301s held back for human review
 *
 * "Verified" = confidence is not VERIFY-GEO / CHECK-BACKLINKS AND the source URL
 * does not collide with a canonical route the codebase still contracts to build
 * (zq-suburbs / zq-blog-guides / zq-services / zq-seo-pages manifests). Those
 * collisions are real consolidations but need matching manifest + test updates,
 * so they are deferred rather than shipped blind.
 *
 * Run: node scripts/seo-redirects-build.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = (p) => readFileSync(path.join(ROOT, p), 'utf8');

const normPath = (u) => {
  let c = u;
  try { c = new URL(u).pathname; } catch { /* already a path */ }
  if (!c.startsWith('/')) c = `/${c}`;
  if (!c.endsWith('/') && !/\.[a-z0-9]+$/i.test(c)) c += '/';
  return c;
};

const allRedirects = JSON.parse(rd('zq-redirects.json')).map((r) => ({
  source: normPath(r.source),
  destination: normPath(r.destination),
  permanent: true,
}));

const csvCol0 = (file) => rd(file).trim().split(/\r?\n/).slice(1)
  .map((line) => normPath(line.split(',')[0]));

const manualReview = new Set(csvCol0('zq-manual-review.csv'));
const keepList = new Set(csvCol0('zq-keep-list.csv'));

// URLs whose consolidation fate was already decided by the merged Semrush
// cannibalization work (commit 4ddef9e / PR #55). Where that decision and this
// GSC audit disagree, the merged decision wins — hold these for reconciliation.
const pr55Owned = new Set([
  '/adelaide-movers-and-packers/',
  '/services/local-removals-adelaide/',
  '/movers-and-packers-adelaide/',
]);

// Canonical routes the codebase still asserts. Redirecting these needs a
// matching manifest/test change, so hold them for the second pass.
async function loadManifestRoutes() {
  const mods = await Promise.all([
    import('../site-src/data/zq-suburbs.mjs'),
    import('../site-src/data/zq-blog-guides.mjs'),
    import('../site-src/data/zq-services.mjs'),
    import('../site-src/data/zq-seo-pages.mjs'),
  ]);
  const paths = new Set();
  const add = (v) => {
    if (!v) return;
    const arr = Array.isArray(v) ? v : Object.values(v).flat();
    for (const x of arr) {
      const raw = typeof x === 'string' ? x : (x.path || x.route || x.canonical || x.output || x.href || '');
      if (raw) paths.add(normPath(String(raw).replace(/index\.html$/, '')));
    }
  };
  add(mods[0].zqPrioritySuburbRoutes);
  add(mods[1].zqGuideRoutes);
  add(mods[2].zqServiceSitemapOutputs);
  add(mods[3].zqExpectedGeneratedOutputs);
  add(mods[3].zqSeoRouteManifest);
  return paths;
}

const manifestRoutes = await loadManifestRoutes();

const verified = [];
const deferred = [];
for (const r of allRedirects) {
  if (keepList.has(r.source)) {
    throw new Error(`Redirect source is on the KEEP list: ${r.source}`);
  }
  if (r.source === r.destination) {
    throw new Error(`Self-redirect: ${r.source}`);
  }
  if (manualReview.has(r.source)) {
    deferred.push({ ...r, hold: 'manual-review' });
  } else if (pr55Owned.has(r.source)) {
    deferred.push({ ...r, hold: 'pr55-conflict' });
  } else if (manifestRoutes.has(r.source)) {
    deferred.push({ ...r, hold: 'manifest-route-conflict' });
  } else {
    verified.push(r);
  }
}

// Integrity checks on the verified set.
const vSources = new Set(verified.map((r) => r.source));
const vDentnations = verified.map((r) => r.destination);
for (const r of verified) {
  if (vSources.has(r.destination)) {
    throw new Error(`Verified redirect chain: ${r.source} -> ${r.destination} (destination is also redirected)`);
  }
}
const dupes = verified.map((r) => r.source).filter((s, i, a) => a.indexOf(s) !== i);
if (dupes.length) throw new Error(`Duplicate verified sources: ${dupes.join(', ')}`);

writeFileSync(
  path.join(ROOT, 'site-src/data/zq-redirects-verified.json'),
  `${JSON.stringify(verified, null, 2)}\n`,
);
writeFileSync(
  path.join(ROOT, 'site-src/data/zq-redirects-deferred.json'),
  `${JSON.stringify(deferred, null, 2)}\n`,
);

console.log(`verified (ship now): ${verified.length}`);
console.log(`deferred (hold):     ${deferred.length}`);
console.log(`  manual-review:        ${deferred.filter((r) => r.hold === 'manual-review').length}`);
console.log(`  manifest-conflict:    ${deferred.filter((r) => r.hold === 'manifest-route-conflict').length}`);
