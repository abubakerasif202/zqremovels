import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const distDir = path.join(root, 'site-dist');
const pages = JSON.parse(readFileSync(path.join(root, 'site-src', 'pages.json'), 'utf8'));

function readDist(relativePath) {
  return readFileSync(path.join(distDir, relativePath), 'utf8');
}

function walkHtmlFiles(dir, results = []) {
  for (const entry of readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      walkHtmlFiles(fullPath, results);
      continue;
    }

    if (entry.endsWith('.html')) {
      results.push(fullPath);
    }
  }

  return results;
}

function outputToRoute(output) {
  if (output === 'index.html') {
    return '/';
  }

  if (output.endsWith('/index.html')) {
    return `/${output.replace(/\/index\.html$/, '/')}`;
  }

  return `/${output}`;
}

function isNoindexPage(page) {
  return (page.robots || '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .includes('noindex');
}

function isRedirectPage(page) {
  return page.layout === 'redirect';
}

function isUtilityPage(page) {
  return page.output === '404.html' || page.output === 'thank-you.html';
}

function isPreviewPage(page) {
  return page.output === 'premium-moving-concepts/index.html' || page.output.startsWith('premium-moving-concepts/');
}

function shouldIncludeInSitemap(page) {
  return !isRedirectPage(page) &&
    !isNoindexPage(page) &&
    !isUtilityPage(page) &&
    !isPreviewPage(page) &&
    page.output !== 'privacy-policy/index.html' &&
    page.output !== 'terms-and-conditions/index.html';
}

async function buildSite() {
  const buildUrl = pathToFileURL(path.join(root, 'scripts', 'build-site.mjs')).href;
  await import(`${buildUrl}?searchConsoleFixes=${Date.now()}`);
}

test.before(async () => {
  await buildSite();
});

test('generated sitemap and canonicals stay on the apex host', () => {
  const sitemap = readDist('sitemap.xml');
  const homepage = readDist('index.html');
  const interstateHub = readDist(path.join('interstate-removals-adelaide', 'index.html'));
  const robots = readDist('robots.txt');

  assert.doesNotMatch(sitemap, /https:\/\/www\.zqremovals\.au\//);
  assert.match(sitemap, /<loc>https:\/\/zqremovals\.au\/<\/loc>/);
  assert.match(homepage, /<link rel="canonical" href="https:\/\/zqremovals\.au\/" \/>/);
  assert.match(
    interstateHub,
    /<link rel="canonical" href="https:\/\/zqremovals\.au\/interstate-removals-adelaide\/" \/>/,
  );
  assert.match(robots, /Sitemap: https:\/\/zqremovals\.au\/sitemap\.xml/);
});

test('generated html does not leak mixed-host seo output', () => {
  for (const htmlFile of walkHtmlFiles(distDir)) {
    const html = readFileSync(htmlFile, 'utf8');
    assert.doesNotMatch(
      html,
      /https:\/\/www\.zqremovals\.au\//,
      `mixed host output found in ${path.relative(distDir, htmlFile)}`,
    );
  }
});

test('sitemap contains only intended indexable routes', () => {
  const sitemap = readDist('sitemap.xml');
  const locations = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
  const expected = pages
    .filter((page) => shouldIncludeInSitemap(page))
    .map((page) => `https://zqremovals.au${outputToRoute(page.output)}`);

  assert.deepEqual(new Set(locations), new Set(expected));

  for (const page of pages.filter((page) => !shouldIncludeInSitemap(page))) {
    assert.ok(
      !locations.includes(`https://zqremovals.au${outputToRoute(page.output)}`),
      `unexpected sitemap inclusion for ${page.output}`,
    );
  }
});

test('vercel redirects cover legacy html aliases for crawlable pages and route families', () => {
  const vercelConfig = JSON.parse(readFileSync(path.join(root, 'vercel.json'), 'utf8'));
  const redirects = new Map(
    vercelConfig.redirects.map(({ source, destination }) => [source, destination]),
  );

  for (const [source, destination] of [
    ['/about.html', '/about/'],
    ['/contact-us.html', '/contact-us/'],
    ['/house-removals-adelaide.html', '/house-removals-adelaide/'],
    ['/interstate-removals-adelaide.html', '/interstate-removals-adelaide/'],
    ['/office-removals-adelaide.html', '/office-removals-adelaide/'],
    ['/packing-services-adelaide.html', '/packing-services-adelaide/'],
    ['/furniture-removalists-adelaide.html', '/furniture-removalists-adelaide/'],
    ['/removalists-adelaide.html', '/removalists-adelaide/'],
  ]) {
    assert.equal(redirects.get(source), destination);
  }

  assert.equal(
    redirects.get('/adelaide-moving-guides/:slug.html'),
    '/adelaide-moving-guides/:slug/',
  );
  assert.equal(redirects.get('/adelaide-to-:slug.html'), '/adelaide-to-:slug/');
  assert.equal(redirects.get('/removalists-:slug.html'), '/removalists-:slug/');
});

test('critical generated pages do not contain broken internal links', () => {
  const criticalPages = [
    'index.html',
    path.join('removalists-adelaide', 'index.html'),
    path.join('interstate-removals-adelaide', 'index.html'),
    path.join('office-removals-adelaide', 'index.html'),
    path.join('packing-services-adelaide', 'index.html'),
    path.join('furniture-removalists-adelaide', 'index.html'),
    path.join('house-removals-adelaide', 'index.html'),
    path.join('adelaide-moving-guides', 'index.html'),
  ];

  for (const relativePath of criticalPages) {
    const html = readDist(relativePath);
    for (const match of html.matchAll(/href="([^"]+)"/g)) {
      const href = match[1];
      if (!href.startsWith('/') || href.startsWith('//')) {
        continue;
      }

      const cleanHref = href.split('#')[0].split('?')[0];
      if (!cleanHref || cleanHref.startsWith('/api/')) {
        continue;
      }

      let targetPath;
      if (cleanHref === '/') {
        targetPath = path.join(distDir, 'index.html');
      } else if (cleanHref.endsWith('/')) {
        targetPath = path.join(distDir, cleanHref.slice(1), 'index.html');
      } else {
        targetPath = path.join(distDir, cleanHref.slice(1));
      }

      assert.ok(
        statSync(targetPath, { throwIfNoEntry: false }),
        `broken internal link in ${relativePath}: ${href}`,
      );
    }
  }
});
