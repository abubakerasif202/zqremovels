import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const distDir = path.join(root, 'site-dist');

function readDist(relativePath) {
  return readFileSync(path.join(distDir, relativePath), 'utf8');
}

async function buildSite(extraEnv = {}) {
  const previous = new Map();
  for (const [key, value] of Object.entries(extraEnv)) {
    previous.set(key, process.env[key]);
    process.env[key] = value;
  }

  try {
    const buildUrl = pathToFileURL(path.join(root, 'scripts', 'build-site.mjs')).href;
    await import(`${buildUrl}?domination=${Date.now()}${Math.random()}`);
  } finally {
    for (const [key, value] of previous.entries()) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

test('homepage metadata, schema, and crawl directives match v4 targets', async () => {
  await buildSite();
  const homepage = readDist('index.html');
  const robots = readDist('robots.txt');
  const sitemapIndex = readDist('sitemap-index.xml');
  const llms = readDist('llms.txt');
  const servicesSitemap = readDist('sitemap-services.xml');

  const title = homepage.match(/<title>(.*?)<\/title>/)?.[1] || '';
  const description = homepage.match(/<meta name="description" content="([^"]+)"/)?.[1] || '';
  const h1Count = (homepage.match(/<h1\b/gi) || []).length;

  assert.ok(title.length >= 50 && title.length <= 60, `title length out of range: ${title.length}`);
  assert.ok(description.length >= 120 && description.length <= 160, `description length out of range: ${description.length}`);
  assert.equal(h1Count, 1);
  assert.match(homepage, /<link rel="canonical" href="https:\/\/zqremovals\.au\/" \/>/);
  assert.match(homepage, /<html lang="en-AU">/);
  assert.match(homepage, /"@type": "MovingCompany"/);
  assert.match(homepage, /"@type": "Organization"/);
  assert.match(homepage, /"@type": "WebSite"/);
  assert.match(homepage, /<meta property="og:title"/);
  assert.match(homepage, /<meta name="twitter:card"/);
  assert.doesNotMatch(homepage, /<meta name="robots" content="noindex/i);

  assert.ok(llms.includes('ZQ Removals'));
  assert.match(robots, /Sitemap: https:\/\/zqremovals\.au\/sitemap-index\.xml/);
  assert.match(robots, /LLM: https:\/\/zqremovals\.au\/llms\.txt/);
  assert.match(sitemapIndex, /<sitemapindex/);
  assert.match(servicesSitemap, /https:\/\/zqremovals\.au\/services\/local-removals-adelaide\//);
});

test('analytics tags are injected only when v4 env vars exist', async () => {
  await buildSite();
  let homepage = readDist('index.html');
  assert.doesNotMatch(homepage, /googletagmanager\.com\/gtag\/js\?id=/);
  assert.doesNotMatch(homepage, /googletagmanager\.com\/gtm\.js\?id=/);
  assert.doesNotMatch(homepage, /fbevents\.js/);

  await buildSite({
    VITE_GA_MEASUREMENT_ID: 'G-SEO4TEST1',
    VITE_GTM_ID: 'GTM-SEO4TST',
    VITE_META_PIXEL_ID: '1234567890',
  });
  homepage = readDist('index.html');
  assert.match(homepage, /googletagmanager\.com\/gtag\/js\?id=G-SEO4TEST1/);
  assert.match(homepage, /gtm\.js/);
  assert.match(homepage, /GTM-SEO4TST/);
  assert.match(homepage, /googletagmanager\.com\/ns\.html\?id=GTM-SEO4TST/);
  assert.match(homepage, /fbevents\.js/);
});

test('mobile nav contrast classes remain explicit after css cleanup', async () => {
  await buildSite();
  const css = readDist('premium-site.min.css');
  assert.match(css, /\.mobile-nav-link\{/i);
  assert.match(css, /#fff/i);
  assert.match(css, /\.sticky-mobile-cta.*button-secondary\{/i);
});
