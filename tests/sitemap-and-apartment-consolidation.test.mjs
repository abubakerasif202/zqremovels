import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { readVercelConfig } from './helpers/vercel-config.mjs';

const root = process.cwd();
const distDir = path.join(root, 'site-dist');
const HOST = 'https://zqremovalsadelaide.com.au';
const OLD = '/apartment-removals-adelaide/';
const KEEPER = '/apartment-removalists-adelaide/';

test.before(async () => {
  const buildUrl = pathToFileURL(path.join(root, 'scripts', 'build-site.mjs')).href;
  await import(`${buildUrl}?sitemapApartment=${Date.now()}`);
});

const readDist = (file) => readFileSync(path.join(distDir, file), 'utf8');

test('sitemap.xml is the single sitemap index and sitemap-index.xml is not emitted', () => {
  assert.equal(existsSync(path.join(distDir, 'sitemap-index.xml')), false);
  const index = readDist('sitemap.xml');
  assert.match(index, /<sitemapindex /);
  for (const child of ['sitemap-pages.xml', 'sitemap-services.xml', 'sitemap-suburbs.xml', 'sitemap-guides.xml', 'sitemap-images.xml']) {
    assert.match(index, new RegExp(`<loc>${HOST}/${child}</loc>`), `${child} listed in index`);
    assert.ok(existsSync(path.join(distDir, child)), `${child} exists`);
  }
  assert.doesNotMatch(index, /sitemap-index\.xml/);
  const robots = readDist('robots.txt');
  assert.match(robots, new RegExp(`Sitemap: ${HOST}/sitemap\.xml`));
  assert.doesNotMatch(robots, /sitemap-index\.xml/);
});

test('vercel.json permanently redirects /sitemap-index.xml to /sitemap.xml', () => {
  const rule = readVercelConfig(root).redirects.find((r) => r.source === '/sitemap-index.xml');
  assert.ok(rule, 'redirect rule exists');
  assert.equal(rule.destination, '/sitemap.xml');
  assert.equal(rule.permanent, true);
});

test('retired apartment-removals URL is absent from sitemaps and not built', () => {
  for (const name of readdirSync(distDir).filter((n) => /^sitemap.*\.xml$/.test(n))) {
    assert.doesNotMatch(readDist(name), new RegExp(`${HOST}${OLD}`), name);
  }
  assert.match(readDist('sitemap-services.xml'), new RegExp(`<loc>${HOST}${KEEPER}</loc>`));
  assert.equal(existsSync(path.join(distDir, 'apartment-removals-adelaide', 'index.html')), false);
});

test('apartment-removals redirects permanently to the keeper on every URL variant', () => {
  const redirects = new Map(readVercelConfig(root).redirects.map((r) => [r.source, r]));
  for (const variant of [OLD, OLD.slice(0, -1), `${OLD}index.html`]) {
    assert.equal(redirects.get(variant)?.destination, KEEPER, variant);
    assert.equal(redirects.get(variant)?.permanent, true, variant);
  }
});

test('no vercel redirect targets a URL that is itself redirected', () => {
  const redirects = readVercelConfig(root).redirects.filter((r) => !r.has);
  // Vercel matches sources exactly (trailingSlash handles the slash/no-slash pair), so compare exact strings.
  const sources = new Set(redirects.map((r) => r.source));
  const chains = redirects
    .filter((r) => r.destination.startsWith('/') && sources.has(r.destination))
    .map((r) => `${r.source} -> ${r.destination}`);
  assert.deepEqual(chains, []);
  assert.equal(redirects.filter((r) => r.destination.endsWith(OLD)).length, 0, `nothing may target ${OLD}`);
});

test('generated HTML never links to the retired apartment-removals URL', () => {
  const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : entry.name.endsWith('.html') ? [full] : [];
  });
  const offenders = walk(distDir).filter((file) => {
    const html = readFileSync(file, 'utf8');
    if (/<meta name="robots" content="noindex,nofollow"/i.test(html)) return false;
    return html.includes(`href="${OLD}"`) || html.includes(`href="${HOST}${OLD}"`);
  });
  assert.deepEqual(offenders, []);
});
