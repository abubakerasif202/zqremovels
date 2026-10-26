import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';
import { googleReviews } from '../site-src/data/business.mjs';
import { DATA_FILE, decideUpdate, fetchPlace, parsePlace, run } from '../scripts/update-google-reviews.mjs';

const SECRET = 'AIza-test-secret-value';
const okFetch = (payload) => async () => ({ ok: true, status: 200, json: async () => payload });

test('the site reads rating and review count from google-reviews.json', () => {
  const data = JSON.parse(readFileSync(DATA_FILE, 'utf8'));
  assert.equal(googleReviews.rating, data.rating);
  assert.equal(googleReviews.reviewCount, data.reviewCount);
  assert.match(data.placeId, /^ChIJ[\w-]+$/);
  assert.ok(Number.isInteger(data.reviewCount) && data.reviewCount > 0);
});

test('parsePlace accepts a valid response and rounds the rating to one decimal', () => {
  assert.deepEqual(parsePlace({ rating: 4.96, userRatingCount: 120 }), { rating: 5, reviewCount: 120 });
});

test('parsePlace rejects missing, zero and out-of-range values', () => {
  assert.throws(() => parsePlace({}), /invalid rating/);
  assert.throws(() => parsePlace({ rating: 6, userRatingCount: 10 }), /invalid rating/);
  assert.throws(() => parsePlace({ rating: 5, userRatingCount: 0 }), /invalid review count/);
  assert.throws(() => parsePlace({ rating: 5, userRatingCount: 'many' }), /invalid review count/);
});

test('decideUpdate applies growth, ignores no change and refuses large drops', () => {
  const current = { rating: 5, reviewCount: 94 };
  assert.equal(decideUpdate(current, { rating: 5, reviewCount: 95 }).update, true);
  assert.equal(decideUpdate(current, { rating: 4.9, reviewCount: 94 }).update, true);
  assert.deepEqual(decideUpdate(current, { rating: 5, reviewCount: 94 }), { update: false, reason: 'no change' });
  const drop = decideUpdate(current, { rating: 5, reviewCount: 60 });
  assert.equal(drop.update, false);
  assert.match(drop.reason, /refusing/);
});

test('run skips without a key and makes no request', async () => {
  let requests = 0;
  const result = await run({ argv: [], env: {}, fetchImpl: async () => { requests += 1; } });
  assert.equal(result.status, 'skipped');
  assert.equal(requests, 0);
});

test('run in dry-run mode reports an update without writing the data file', async () => {
  const before = readFileSync(DATA_FILE, 'utf8');
  const current = JSON.parse(before);
  const result = await run({
    argv: ['--dry-run'],
    env: { GOOGLE_PLACES_API_KEY: SECRET },
    fetchImpl: okFetch({ rating: 5, userRatingCount: current.reviewCount + 1 }),
  });
  assert.equal(result.status, 'would-update');
  assert.equal(readFileSync(DATA_FILE, 'utf8'), before);
});

test('run refuses an implausible drop instead of rewriting the site', async () => {
  const current = JSON.parse(readFileSync(DATA_FILE, 'utf8'));
  const result = await run({
    argv: ['--dry-run'],
    env: { GOOGLE_PLACES_API_KEY: SECRET },
    fetchImpl: okFetch({ rating: 5, userRatingCount: Math.floor(current.reviewCount / 2) }),
  });
  assert.equal(result.status, 'refused');
});

test('a failed request reports only the HTTP status and never the key', async () => {
  const failing = async () => ({ ok: false, status: 403, json: async () => ({ error: { message: `bad key ${SECRET}` } }) });
  await assert.rejects(
    () => fetchPlace('ChIJexample', SECRET, failing),
    (error) => {
      assert.match(error.message, /HTTP 403/);
      assert.ok(!error.message.includes(SECRET));
      return true;
    },
  );
});

test('the request sends the key in a header with a minimal field mask', async () => {
  let seen;
  await fetchPlace('ChIJexample', SECRET, async (url, init) => {
    seen = { url, headers: init.headers };
    return { ok: true, status: 200, json: async () => ({}) };
  });
  assert.ok(!seen.url.includes(SECRET), 'the key must not be placed in the URL');
  assert.equal(seen.headers['X-Goog-Api-Key'], SECRET);
  assert.equal(seen.headers['X-Goog-FieldMask'], 'rating,userRatingCount');
});

test('no committed file contains a Google API key', () => {
  for (const file of [DATA_FILE, new URL('../scripts/update-google-reviews.mjs', import.meta.url), new URL('../site-src/data/business.mjs', import.meta.url)]) {
    assert.doesNotMatch(readFileSync(file, 'utf8'), /AIza[0-9A-Za-z_-]{30,}/, `${file} must not contain an API key`);
  }
});

test('--on-vercel skips outside a Vercel build even when a key is present', async () => {
  let requests = 0;
  const result = await run({
    argv: ['--on-vercel', '--dry-run'],
    env: { GOOGLE_PLACES_API_KEY: SECRET },
    fetchImpl: async () => { requests += 1; },
  });
  assert.equal(result.status, 'skipped');
  assert.equal(requests, 0);
});

test('--on-vercel refreshes inside a Vercel build', async () => {
  const current = JSON.parse(readFileSync(DATA_FILE, 'utf8'));
  const result = await run({
    argv: ['--on-vercel', '--dry-run'],
    env: { VERCEL: '1', GOOGLE_PLACES_API_KEY: SECRET },
    fetchImpl: okFetch({ rating: 5, userRatingCount: current.reviewCount + 2 }),
  });
  assert.equal(result.status, 'would-update');
});

test('the npm prebuild step is wired to the soft Vercel-only mode', () => {
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  assert.equal(pkg.scripts.prebuild, 'node scripts/update-google-reviews.mjs --on-vercel --soft');
});

test('the CLI exits 0 and changes nothing on a local run with --on-vercel --soft', () => {
  const before = readFileSync(DATA_FILE, 'utf8');
  const env = { ...process.env, GOOGLE_PLACES_API_KEY: SECRET };
  delete env.VERCEL;
  const result = spawnSync(process.execPath, ['scripts/update-google-reviews.mjs', '--on-vercel', '--soft'], { env, encoding: 'utf8' });
  assert.equal(result.status, 0);
  assert.match(result.stdout, /skipped/);
  assert.ok(!result.stdout.includes(SECRET) && !result.stderr.includes(SECRET));
  assert.equal(readFileSync(DATA_FILE, 'utf8'), before);
});
