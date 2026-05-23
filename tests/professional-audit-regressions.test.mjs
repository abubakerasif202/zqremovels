import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const distDir = path.join(root, 'site-dist');

async function buildSite() {
  if (buildSite.promise) {
    return buildSite.promise;
  }

  const buildUrl = pathToFileURL(path.join(root, 'scripts', 'build-site.mjs')).href;
  buildSite.promise = import(`${buildUrl}?professionalAudit=${Date.now()}`);
  await buildSite.promise;
}

function walkHtmlFiles(dir, results = []) {
  for (const entry of readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      walkHtmlFiles(fullPath, results);
    } else if (entry.endsWith('.html')) {
      results.push(fullPath);
    }
  }
  return results;
}

test('public HTML does not leak internal SEO strategy language', async () => {
  await buildSite();

  const leakedPhrases = [
    /service cluster/i,
    /search intent/i,
    /Use this service page/i,
    /prepare the move brief/i,
    /forcing them back to the homepage/i,
    /Pricing Logic/i,
  ];

  for (const htmlFile of walkHtmlFiles(distDir)) {
    const relative = path.relative(distDir, htmlFile);
    const html = readFileSync(htmlFile, 'utf8');
    for (const phrase of leakedPhrases) {
      assert.doesNotMatch(html, phrase, `${relative} leaks ${phrase}`);
    }
  }
});

test('visible h1-h3 headings do not contain SEO title pipe separators', async () => {
  await buildSite();

  const headingPattern = /<h[1-3]\b[^>]*>([\s\S]*?)<\/h[1-3]>/gi;
  for (const htmlFile of walkHtmlFiles(distDir)) {
    const relative = path.relative(distDir, htmlFile);
    const html = readFileSync(htmlFile, 'utf8');
    for (const match of html.matchAll(headingPattern)) {
      const text = match[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      assert.doesNotMatch(text, /\|/, `${relative} heading contains a pipe: ${text}`);
    }
  }
});

test('unsupported AggregateRating schema and legacy guide sitemap URLs stay out of output', async () => {
  await buildSite();

  for (const htmlFile of walkHtmlFiles(distDir)) {
    const relative = path.relative(distDir, htmlFile);
    const html = readFileSync(htmlFile, 'utf8');
    assert.doesNotMatch(html, /AggregateRating|aggregateRating|reviewCount|ratingValue|ReviewRating/i, `${relative} contains unsupported review schema`);
  }

  const sitemap = readFileSync(path.join(distDir, 'sitemap.xml'), 'utf8');
  assert.doesNotMatch(sitemap, /https:\/\/zqremovals\.au\/guides\//, 'legacy /guides/ URLs should not be in sitemap.xml');
});
