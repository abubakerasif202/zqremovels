import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { businessIdentity as expectedBusinessIdentity } from '../site-src/data/business.mjs';

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
    const relative = path.relative(distDir, htmlFile).replace(/\\/g, '/');
    if (relative === 'removalists-adelaide/index.html') {
      continue;
    }
    const html = readFileSync(htmlFile, 'utf8');
    assert.doesNotMatch(html, /AggregateRating|aggregateRating|reviewCount|ratingValue|ReviewRating/i, `${relative} contains unsupported review schema`);
  }

  const sitemap = readFileSync(path.join(distDir, 'sitemap.xml'), 'utf8');
  assert.doesNotMatch(sitemap, /https:\/\/zqremovals\.au\/guides\//, 'legacy /guides/ URLs should not be in sitemap.xml');
});

test('business identity is centralized without an unverified public ABR link', async () => {
  const businessModule = await import(`${pathToFileURL(path.join(root, 'site-src', 'data', 'business.mjs')).href}?audit=${Date.now()}`);
  const { businessIdentity } = businessModule;

  assert.equal(businessIdentity.name, 'ZQ Removals');
  assert.equal(businessIdentity.phone.display, '0433 819 989');
  assert.equal(businessIdentity.phone.tel, '+61433819989');
  assert.equal(businessIdentity.abn.formatted, expectedBusinessIdentity.abn.formatted);
  assert.equal(businessIdentity.abn.verificationUrl, null);

  const footerSource = readFileSync(path.join(root, 'site-src', 'partials', 'footer.html'), 'utf8');
  assert.doesNotMatch(footerSource, /abr\.business\.gov\.au/i);
});

test('generated output does not leak audit artefacts, object dumps, or nullish placeholders', async () => {
  await buildSite();

  const forbidden = [
    /\[object Object\]/i,
    /SEO V5 intent/i,
    /quote-first certainty/i,
    /Relevant suburbs/i,
    /Suburb routes that often trigger this intent/i,
    /Use this service when your move also needs standard Adelaide planning/i,
    /\bundefined\b/i,
    /\bnull\b/i,
    /localhost|127\.0\.0\.1|zqremovals\.site|vercel\.app/i,
  ];

  for (const outputFile of walkOutputFiles(distDir)) {
    const relative = path.relative(distDir, outputFile).replace(/\\/g, '/');
    const text = readFileSync(outputFile, 'utf8');
    for (const pattern of forbidden) {
      if (pattern.toString().includes('quote-first certainty') && relative === 'fixed-price-removalists-adelaide/index.html') {
        continue;
      }
      assert.doesNotMatch(text, pattern, `${relative} leaks ${pattern}`);
    }
  }
});

test('priority page titles and descriptions are unique, natural, and not abruptly truncated', async () => {
  await buildSite();

  const priorityFiles = [
    'index.html',
    'removalists-adelaide/index.html',
    'house-removals-adelaide/index.html',
    'moving-company-adelaide/index.html',
    'fixed-price-removalists-adelaide/index.html',
    'affordable-removalists-adelaide/index.html',
    'budget-removalists-adelaide/index.html',
    'moving-quotes-adelaide/index.html',
    'removalist-cost-adelaide/index.html',
    'apartment-removalists-adelaide/index.html',
    'furniture-removals-adelaide/index.html',
    'furniture-removalists-adelaide/index.html',
    'office-removals-adelaide/index.html',
    'interstate-removals-adelaide/index.html',
    'removalists-elizabeth/index.html',
    'removalists-marion/index.html',
    'removalists-southern-adelaide/index.html',
    'removalists-northern-adelaide/index.html',
    ...walkHtmlFiles(distDir)
      .map((file) => path.relative(distDir, file).replace(/\\/g, '/'))
      .filter((file) => file.startsWith('moving-from-')),
  ];
  const seenTitles = new Map();
  const seenDescriptions = new Map();

  for (const file of priorityFiles) {
    const html = readFileSync(path.join(distDir, file), 'utf8');
    const title = extractFirst(html, /<title>(.*?)<\/title>/i);
    const description = extractFirst(html, /<meta name="description" content="([^"]+)"/i);

    assert.ok(title, `${file} missing title`);
    assert.ok(description, `${file} missing meta description`);
    assert.ok(title.length <= 68, `${file} title too long: ${title.length}`);
    assert.ok(description.length >= 120 && description.length <= 165, `${file} description length ${description.length}`);
    assert.doesNotMatch(description, /\b(?:and|or|with|for|around|across|before)$/i, `${file} description is abruptly truncated`);
    assert.doesNotMatch(description, /\b(?:Call 0433 819 989|SEO V5|quote-first)\b/i, `${file} description contains noisy template text`);

    assert.ok(!seenTitles.has(title), `${file} duplicates title from ${seenTitles.get(title)}`);
    assert.ok(!seenDescriptions.has(description), `${file} duplicates description from ${seenDescriptions.get(description)}`);
    seenTitles.set(title, file);
    seenDescriptions.set(description, file);
  }
});

function walkOutputFiles(dir, results = []) {
  for (const entry of readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      walkOutputFiles(fullPath, results);
    } else if (/\.(?:html|xml|txt)$/i.test(entry)) {
      results.push(fullPath);
    }
  }
  return results;
}

function extractFirst(text, pattern) {
  return text.match(pattern)?.[1]?.replace(/\s+/g, ' ').trim() || '';
}
