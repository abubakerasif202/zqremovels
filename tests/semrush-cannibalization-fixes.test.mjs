import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const distDir = path.join(root, 'site-dist');

test.before(async () => {
  const buildUrl = pathToFileURL(path.join(root, 'scripts', 'build-site.mjs')).href;
  await import(`${buildUrl}?semrushCannibalization=${Date.now()}`);
});

test('Semrush overlap URLs redirect to one canonical page per intent', () => {
  const redirects = [
    ['office-relocation-adelaide/index.html', '/office-removals-adelaide/'],
    ['services/office-removals-adelaide/index.html', '/office-removals-adelaide/'],
    ['affordable-removalists-adelaide/index.html', '/cheap-removalists-adelaide/'],
  ];

  for (const [output, destination] of redirects) {
    const html = readFileSync(path.join(distDir, output), 'utf8');
    assert.match(html, /<meta name="robots" content="noindex,nofollow"/i, output);
    assert.match(
      html,
      new RegExp(`<link rel="canonical" href="https://zqremovals\\.au${escapeRegex(destination)}"`),
      output,
    );
    assert.match(
      html,
      new RegExp(`<meta http-equiv="refresh" content="0; url=${escapeRegex(destination)}"`),
      output,
    );
  }
});

test('canonical winners remain indexable and ranking URLs stay unchanged', () => {
  for (const [output, canonical] of [
    ['office-removals-adelaide/index.html', '/office-removals-adelaide/'],
    ['cheap-removalists-adelaide/index.html', '/cheap-removalists-adelaide/'],
    ['removalists-queens-park/index.html', '/removalists-queens-park/'],
  ]) {
    const html = readFileSync(path.join(distDir, output), 'utf8');
    assert.match(html, /<meta name="robots" content="index,follow,max-image-preview:large"/i, output);
    assert.match(
      html,
      new RegExp(`<link rel="canonical" href="https://zqremovals\\.au${escapeRegex(canonical)}"`),
      output,
    );
  }
});

test('sitemaps and indexable HTML do not advertise consolidated aliases', () => {
  const aliasPatterns = [
    '/office-relocation-adelaide/',
    '/services/office-removals-adelaide/',
    '/affordable-removalists-adelaide/',
  ];
  const sitemap = readdirSync(distDir)
    .filter((name) => /^sitemap.*\.xml$/.test(name))
    .map((name) => readFileSync(path.join(distDir, name), 'utf8'))
    .join('\n');

  for (const alias of aliasPatterns) {
    assert.doesNotMatch(sitemap, new RegExp(`https://zqremovals\\.au${escapeRegex(alias)}`), alias);
  }

  for (const htmlFile of walkHtmlFiles(distDir)) {
    const html = readFileSync(htmlFile, 'utf8');
    if (/<meta name="robots" content="noindex,nofollow"/i.test(html)) continue;
    for (const alias of aliasPatterns) {
      assert.doesNotMatch(html, new RegExp(`href="${escapeRegex(alias)}"`), `${htmlFile}: ${alias}`);
    }
  }
});

test('commercial copy does not expose internal SEO drafting labels', () => {
  const cheap = readFileSync(path.join(distDir, 'cheap-removalists-adelaide/index.html'), 'utf8');
  assert.doesNotMatch(
    cheap,
    /Adelaide money page|Unique angle|Conversion path|Future video proof|owner-confirmed/i,
  );
});

function walkHtmlFiles(directory) {
  const files = [];
  for (const entry of readdirSync(directory)) {
    const full = path.join(directory, entry);
    const stats = statSync(full);
    if (stats.isDirectory()) files.push(...walkHtmlFiles(full));
    else if (entry.endsWith('.html')) files.push(full);
  }
  return files;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
