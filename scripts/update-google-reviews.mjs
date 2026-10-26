import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Refreshes site-src/data/google-reviews.json from the Google Places API (New).
//
// Usage:
//   GOOGLE_PLACES_API_KEY=... node scripts/update-google-reviews.mjs [--dry-run]
//   node scripts/update-google-reviews.mjs --key-file "places api.env" [--dry-run]
//
// Flags used by the npm "prebuild" step on Vercel:
//   --on-vercel  do nothing unless running inside a Vercel build (VERCEL=1), so local and CI builds never call the API
//   --soft       never fail the build: API errors and refused updates are logged and the committed data is used
//
// The key is read from the environment (or a local, git-ignored key file) and is never printed or written.
// Without a key the script exits 0 without changes, so scheduled runs stay green until the secret is configured.

export const DATA_FILE = fileURLToPath(new URL('../site-src/data/google-reviews.json', import.meta.url));
const PLACES_ENDPOINT = 'https://places.googleapis.com/v1/places';
const MAX_DROP_RATIO = 0.1;

// Validates the Places API response and returns the fields the site uses.
export function parsePlace(payload) {
  const rating = Number(payload?.rating);
  const reviewCount = Number(payload?.userRatingCount);
  if (!(rating >= 1 && rating <= 5)) throw new Error(`Places API returned an invalid rating: ${payload?.rating}`);
  if (!Number.isInteger(reviewCount) || reviewCount <= 0) throw new Error(`Places API returned an invalid review count: ${payload?.userRatingCount}`);
  return { rating: Math.round(rating * 10) / 10, reviewCount };
}

// Refuses implausible changes (for example a large drop) so a bad API response cannot silently rewrite the site.
export function decideUpdate(current, next) {
  if (next.reviewCount < current.reviewCount * (1 - MAX_DROP_RATIO)) {
    return { update: false, reason: `review count fell from ${current.reviewCount} to ${next.reviewCount}; refusing to apply automatically` };
  }
  if (next.rating === current.rating && next.reviewCount === current.reviewCount) {
    return { update: false, reason: 'no change' };
  }
  return { update: true, reason: `${current.reviewCount} -> ${next.reviewCount} reviews, rating ${current.rating} -> ${next.rating}` };
}

export async function fetchPlace(placeId, apiKey, fetchImpl = fetch) {
  const response = await fetchImpl(`${PLACES_ENDPOINT}/${encodeURIComponent(placeId)}`, {
    headers: { 'X-Goog-Api-Key': apiKey, 'X-Goog-FieldMask': 'rating,userRatingCount' },
  });
  if (!response.ok) {
    // Report only the status, never the response body or the request headers, which may echo the key.
    throw new Error(`Places API request failed with HTTP ${response.status}`);
  }
  return response.json();
}

async function readKey(argv, env) {
  if (env.GOOGLE_PLACES_API_KEY) return env.GOOGLE_PLACES_API_KEY.trim();
  const index = argv.indexOf('--key-file');
  if (index === -1 || !argv[index + 1]) return '';
  const contents = (await readFile(path.resolve(argv[index + 1]), 'utf8')).trim().split(/\r?\n/)[0] || '';
  return contents.replace(/^[A-Z_]+=/, '').trim();
}

export async function run({ argv = process.argv.slice(2), env = process.env, fetchImpl = fetch, now = () => new Date() } = {}) {
  const dryRun = argv.includes('--dry-run');
  if (argv.includes('--on-vercel') && env.VERCEL !== '1') {
    return { status: 'skipped', message: 'Not a Vercel build; leaving google-reviews.json unchanged.' };
  }
  const apiKey = await readKey(argv, env);
  if (!apiKey) {
    return { status: 'skipped', message: 'No Places API key configured; leaving google-reviews.json unchanged.' };
  }

  const current = JSON.parse(await readFile(DATA_FILE, 'utf8'));
  const next = parsePlace(await fetchPlace(current.placeId, apiKey, fetchImpl));
  const decision = decideUpdate(current, next);
  if (!decision.update) {
    return { status: decision.reason === 'no change' ? 'unchanged' : 'refused', message: decision.reason };
  }

  const updated = { ...current, ...next, fetchedAt: now().toISOString(), source: 'google-places-api' };
  if (!dryRun) await writeFile(DATA_FILE, `${JSON.stringify(updated, null, 2)}\n`, 'utf8');
  return { status: dryRun ? 'would-update' : 'updated', message: decision.reason };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const soft = process.argv.includes('--soft');
  try {
    const result = await run();
    console.log(`${result.status}: ${result.message}`);
    if (result.status === 'refused' && !soft) process.exitCode = 1;
  } catch (error) {
    console.error(`update-google-reviews failed: ${error.message}`);
    if (!soft) process.exitCode = 1;
  }
}
