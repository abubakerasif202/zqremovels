import assert from 'node:assert/strict';

const originArgument = process.argv.indexOf('--origin');
function parseOrigin(value, option) {
  const parsed = new URL(value);
  if (!['https:', 'http:'].includes(parsed.protocol) || parsed.pathname !== '/' || parsed.search || parsed.hash) {
    throw new Error(`${option} must be an HTTP(S) origin without a path, query or fragment`);
  }
  return parsed;
}
const deploymentOrigin = parseOrigin(
  originArgument >= 0 ? process.argv[originArgument + 1] : 'https://zqremovalsadelaide.com.au',
  '--origin',
);
const legacyArgument = process.argv.indexOf('--legacy-origin');
const legacyOrigin = legacyArgument >= 0 ? parseOrigin(process.argv[legacyArgument + 1], '--legacy-origin') : null;

const canonicalOrigin = 'https://zqremovalsadelaide.com.au';
const routes = [
  ['/guides/moving-house-adelaide-checklist/', '/adelaide-moving-guides/moving-house-checklist-adelaide/'],
  ['/guides/best-time-to-book-removalists-adelaide/', '/adelaide-moving-guides/best-time-to-book-removalists-adelaide/'],
  ['/guides/apartment-moving-tips-adelaide/', '/adelaide-moving-guides/apartment-moving-tips-adelaide/'],
];

async function get(url, redirect = 'manual') {
  return fetch(url, { redirect, signal: AbortSignal.timeout(15000), headers: { 'user-agent': 'ZQ-Migrated-Guide-Release-Check/1.0' } });
}

const sitemapResponse = await get(new URL('/sitemap-guides.xml', deploymentOrigin), 'follow');
assert.equal(sitemapResponse.status, 200, 'guide sitemap must return HTTP 200');
const sitemap = await sitemapResponse.text();
assert.match(sitemapResponse.headers.get('content-type') ?? '', /xml/i, 'guide sitemap must be XML');

for (const [sourcePath, destinationPath] of routes) {
  const expectedLocation = new URL(destinationPath, canonicalOrigin).href;
  const sourceUrl = new URL(sourcePath, deploymentOrigin);
  const redirect = await get(sourceUrl);
  assert.ok([301, 308].includes(redirect.status), `${sourceUrl} must return a permanent 301/308; got ${redirect.status}`);
  const location = new URL(redirect.headers.get('location') ?? '', sourceUrl).href;
  assert.equal(location, expectedLocation, `${sourceUrl} must redirect directly to ${expectedLocation}`);

  // Check the deployed site's copy at the target path even on a Vercel Preview,
  // whose redirect destination intentionally names the canonical production host.
  const destinationUrl = new URL(destinationPath, deploymentOrigin);
  const destination = await get(destinationUrl);
  assert.equal(destination.status, 200, `${destinationUrl} must return HTTP 200`);
  assert.match(destination.headers.get('content-type') ?? '', /text\/html/i, 'destination must be HTML');
  const html = await destination.text();
  const canonicalMatches = [...html.matchAll(/<link\b[^>]*rel=["']canonical["'][^>]*>/gi)];
  assert.equal(canonicalMatches.length, 1, `${destinationUrl} must have exactly one canonical`);
  assert.match(canonicalMatches[0][0], new RegExp(`href=["']${expectedLocation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`, 'i'), 'canonical must match the intended destination');
  assert.match(sitemap, new RegExp(`<loc>\\s*${expectedLocation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*<\\/loc>`), 'canonical destination must appear in guide sitemap');
  assert.doesNotMatch(html, /<meta\b[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i, 'destination must be indexable');
  console.log(`PASS ${sourcePath} -> ${location}; target 200, self-canonical, sitemap-listed`);

  if (legacyOrigin) {
    const legacyUrl = new URL(sourcePath, legacyOrigin);
    const legacyRedirect = await get(legacyUrl);
    assert.ok([301, 308].includes(legacyRedirect.status), `${legacyUrl} must return a permanent 301/308; got ${legacyRedirect.status}`);
    const legacyLocation = new URL(legacyRedirect.headers.get('location') ?? '', legacyUrl).href;
    assert.equal(legacyLocation, expectedLocation, `${legacyUrl} must redirect directly to ${expectedLocation} without a host/path chain`);
    console.log(`PASS ${legacyUrl} -> ${legacyLocation}; single permanent hop`);
  }
}
