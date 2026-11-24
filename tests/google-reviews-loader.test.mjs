import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';

// Regression coverage for the Astro bundling bug: the Astro prerender bundles business.mjs, so
// `new URL('./google-reviews.json', import.meta.url)` points into the bundle where the data file does not exist.
// The loader then silently used the 100-review fallback on every Astro-rendered page. These tests relocate a copy
// of business.mjs away from its data file and use fixture values that differ from the fallback (100 reviews, 5.0).

const businessSource = new URL('../site-src/data/business.mjs', import.meta.url);

function makeSandbox() {
  const root = mkdtempSync(path.join(os.tmpdir(), 'zq-reviews-loader-'));
  // The relocated copy has no google-reviews.json next to it, like the bundled module.
  const bundleDir = path.join(root, 'bundle');
  mkdirSync(bundleDir, { recursive: true });
  copyFileSync(businessSource, path.join(bundleDir, 'business.mjs'));
  return {
    root,
    bundleModule: pathToFileURL(path.join(bundleDir, 'business.mjs')).href,
    writeProjectData(json) {
      const dir = path.join(root, 'site-src', 'data');
      mkdirSync(dir, { recursive: true });
      writeFileSync(path.join(dir, 'google-reviews.json'), typeof json === 'string' ? json : JSON.stringify(json));
    },
    load(cwd = root) {
      const script = `import(${JSON.stringify(this.bundleModule)}).then((m) => console.log(JSON.stringify(m.googleReviews)))`;
      const result = spawnSync(process.execPath, ['--input-type=module', '-e', script], { cwd, encoding: 'utf8' });
      assert.equal(result.status, 0, result.stderr);
      return JSON.parse(result.stdout);
    },
    cleanup() { rmSync(root, { recursive: true, force: true }); },
  };
}

test('a bundled copy of business.mjs reads the project data file instead of the 100-review fallback', () => {
  const sandbox = makeSandbox();
  try {
    sandbox.writeProjectData({ placeId: 'ChIJfixture', rating: 4.8, reviewCount: 137, fetchedAt: '2026-01-02T03:04:05.000Z', source: 'google-places-api' });
    const reviews = sandbox.load();
    assert.equal(reviews.reviewCount, 137);
    assert.equal(reviews.rating, 4.8);
    assert.match(reviews.lastVerifiedSource, /google-places-api 2026-01-02/);
    assert.doesNotMatch(reviews.lastVerifiedSource, /fallback/);
  } finally {
    sandbox.cleanup();
  }
});

test('a changed review count flows through to the loader each time (no stale or hard-coded value)', () => {
  const sandbox = makeSandbox();
  try {
    for (const count of [125, 150, 200]) {
      sandbox.writeProjectData({ rating: 5, reviewCount: count, source: 'google-places-api' });
      assert.equal(sandbox.load().reviewCount, count);
    }
  } finally {
    sandbox.cleanup();
  }
});

test('an invalid or missing data file falls back to the documented fallback and says so', () => {
  const sandbox = makeSandbox();
  try {
    for (const bad of ['{ not json', { rating: 5, reviewCount: 0 }, { rating: 9, reviewCount: 50 }, { rating: 5, reviewCount: 'many' }]) {
      sandbox.writeProjectData(bad);
      const reviews = sandbox.load();
      assert.equal(reviews.reviewCount, 100);
      assert.equal(reviews.lastVerifiedSource, 'fallback');
    }
    rmSync(path.join(sandbox.root, 'site-src'), { recursive: true, force: true });
    assert.equal(sandbox.load().lastVerifiedSource, 'fallback');
  } finally {
    sandbox.cleanup();
  }
});

test('built pages show the review count stored in google-reviews.json (read directly, not through the loader)', () => {
  const data = JSON.parse(readFileSync(new URL('../site-src/data/google-reviews.json', import.meta.url), 'utf8'));
  const count = `${data.reviewCount} Google reviews`;
  for (const page of ['index.html', 'removalists-adelaide/index.html', 'removalists-unley-park/index.html', 'removalists-hyde-park/index.html']) {
    const html = readFileSync(new URL(`../site-dist/${page}`, import.meta.url), 'utf8');
    assert.ok(html.includes(count), `${page} should show "${count}"`);
    if (data.reviewCount !== 100) {
      assert.ok(!/\b100 Google reviews\b/.test(html), `${page} still shows the 100-review fallback`);
    }
  }
});
