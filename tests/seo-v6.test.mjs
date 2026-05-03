import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { getGeneratedPages, mergePagesByOutput } from '../site-src/data/seo-v4.mjs';

const root = process.cwd();
const distDir = path.join(root, 'site-dist');
const pages = mergePagesByOutput(JSON.parse(readFileSync(path.join(root, 'site-src', 'pages.json'), 'utf8')), getGeneratedPages());

const docFiles = [
  'docs/google-business-profile-v6-growth-system.md',
  'docs/review-request-v6-system.md',
  'docs/local-citation-v6-plan.md',
  'docs/backlink-outreach-v6-system.md',
  'docs/competitor-outrank-v6-system.md',
  'docs/search-console-v6-action-plan.md',
  'docs/content-refresh-v6-calendar.md',
  'docs/tracking-v6-plan.md',
];

test.before(async () => {
  const buildUrl = pathToFileURL(path.join(root, 'scripts', 'build-site.mjs')).href;
  await import(`${buildUrl}?seoV6=${Date.now()}`);
});

test('seo v6 docs exist and keep the compliance rules explicit', () => {
  for (const file of docFiles) {
    const text = readFileSync(path.join(root, file), 'utf8');
    assert.ok(text.length > 0, file);
    assert.doesNotMatch(text, /fake reviews|fake ratings|fake address/i, file);
  }

  const reviewDoc = readFileSync(path.join(root, 'docs/review-request-v6-system.md'), 'utf8');
  assert.match(reviewDoc, /no review gating/i);
  assert.match(reviewDoc, /no incentivized reviews/i);
  assert.match(reviewDoc, /ask every real customer fairly/i);
});

test('footer and homepage include the price-page links and cost-conscious messaging', () => {
  const footer = readFileSync(path.join(root, 'site-src', 'partials', 'footer.html'), 'utf8');
  const homepage = readFileSync(path.join(root, 'site-src', 'content', 'index.html'), 'utf8');
  const contact = readFileSync(path.join(root, 'site-src', 'content', 'contact-us', 'index.html'), 'utf8');

  for (const slug of ['cheap-removalists-adelaide', 'affordable-removalists-adelaide', 'removalist-cost-adelaide', 'moving-quotes-adelaide', 'fixed-price-removalists-adelaide']) {
    assert.match(footer, new RegExp(`href="/${slug}/"`), `${slug} missing from footer source`);
    assert.match(homepage, new RegExp(`href="/${slug}/"`), `${slug} missing from homepage source`);
  }

  assert.match(homepage, /Fixed-price Adelaide removalists for cost-conscious moves/i);
  assert.match(contact, /Quote Preparation Checklist/i);
});

test('urgent same-day pages include subject to availability wording', () => {
  const sameDay = readDist('same-day-removalists-adelaide/index.html');
  const lastMinute = readDist('last-minute-removalists-adelaide/index.html');

  assert.match(sameDay, /subject to availability/i);
  assert.match(lastMinute, /subject to availability/i);
});

test('build output keeps apex canonical host and excludes unsupported review schema', () => {
  for (const htmlFile of walkHtmlFiles(distDir)) {
    const html = readFileSync(htmlFile, 'utf8');
    assert.doesNotMatch(html, /https:\/\/www\.zqremovals\.au\//i, path.relative(distDir, htmlFile));
    assert.doesNotMatch(html, /aggregateRating|reviewCount|ratingValue|ReviewRating/i, path.relative(distDir, htmlFile));
  }
});

test('sitemap still contains the price pages', () => {
  const sitemap = [
    readFileSync(path.join(distDir, 'sitemap-index.xml'), 'utf8'),
    readFileSync(path.join(distDir, 'sitemap-pages.xml'), 'utf8'),
    readFileSync(path.join(distDir, 'sitemap-services.xml'), 'utf8'),
    readFileSync(path.join(distDir, 'sitemap-suburbs.xml'), 'utf8'),
    readFileSync(path.join(distDir, 'sitemap-guides.xml'), 'utf8'),
  ].join('\n');
  for (const slug of ['cheap-removalists-adelaide', 'affordable-removalists-adelaide', 'removalist-cost-adelaide', 'moving-quotes-adelaide', 'fixed-price-removalists-adelaide']) {
    assert.match(sitemap, new RegExp(`https://zqremovals\\.au/${slug}/`), slug);
  }
});

function readDist(relativePath) {
  return readFileSync(path.join(distDir, relativePath), 'utf8');
}

function walkHtmlFiles(dir, results = []) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stats = statSync(full);
    if (stats.isDirectory()) {
      walkHtmlFiles(full, results);
    } else if (entry.endsWith('.html')) {
      results.push(full);
    }
  }
  return results;
}
