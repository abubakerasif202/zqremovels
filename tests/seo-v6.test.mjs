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

test('footer and homepage include clean price-path links and cost-conscious messaging', () => {
  const footer = readFileSync(path.join(root, 'site-src', 'partials', 'footer.html'), 'utf8');
  const homepage = readFileSync(path.join(root, 'site-src', 'content', 'index.html'), 'utf8');
  const contact = readFileSync(path.join(root, 'site-src', 'content', 'contact-us', 'index.html'), 'utf8');

  for (const slug of ['cheap-removalists-adelaide', 'affordable-removalists-adelaide', 'removalist-cost-adelaide', 'moving-quotes-adelaide', 'fixed-price-removalists-adelaide']) {
    assert.match(homepage, new RegExp(`href="/${slug}/"`), `${slug} missing from homepage source`);
  }

  assert.match(footer, /href="\/adelaide-moving-guides\/removalists-cost-adelaide\/"/, 'pricing guide missing from footer source');
  assert.match(footer, /href="\/removalists-adelaide-quote\/"/, 'quote form missing from footer source');
  assert.match(footer, /href="\/fixed-price-removalists-adelaide\/"/, 'fixed-price service missing from footer source');
  assert.match(footer, /href="\/cheap-removalists-adelaide\/"/, 'footer should include lower-cost planning path');
  assert.match(footer, /href="\/affordable-removalists-adelaide\/"/, 'footer should include affordable planning path');
  assert.doesNotMatch(footer, /cheap-removalists-adelaide[\s\S]{0,220}affordable-removalists-adelaide[\s\S]{0,220}budget-removalists-adelaide/i, 'footer should not include a dense exact-match price grid');

  assert.match(homepage, /fixed-price quotes/i);
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
    const relative = path.relative(distDir, htmlFile).replace(/\\/g, '/');
    assert.doesNotMatch(html, /https:\/\/www\.zqremovals\.au\//i, relative);
    if (relative !== 'removalists-adelaide/index.html') {
      assert.doesNotMatch(html, /aggregateRating|reviewCount|ratingValue|ReviewRating/i, relative);
    }
  }
});

test('sitemap still contains the price pages', () => {
  const sitemapFiles = ['sitemap-index.xml', 'sitemap-pages.xml', 'sitemap-services.xml', 'sitemap-suburbs.xml', 'sitemap-guides.xml'];
  const sitemap = sitemapFiles
    .map((file) => readFileSync(path.join(distDir, file), 'utf8'))
    .join('\n');
  for (const slug of ['cheap-removalists-adelaide', 'affordable-removalists-adelaide', 'removalist-cost-adelaide', 'moving-quotes-adelaide', 'fixed-price-removalists-adelaide']) {
    assert.match(sitemap, new RegExp(`https://zqremovals\\.au/${slug}/`), slug);
  }
});

test('No Limits competitor alternative page stays honest and discoverable', () => {
  const output = 'no-limits-removalists-alternative-adelaide/index.html';
  const html = readDist(output);
  const guideHub = readDist('adelaide-moving-guides/index.html');
  const sitemapGuides = readDist('sitemap-guides.xml');
  const sourcePage = pages.find((page) => page.output === output);

  assert.ok(sourcePage, 'missing generated competitor alternative metadata');
  assert.equal(sourcePage.generatedKind, 'comparison');
  assert.match(html, /<title>No Limits Removalists Alternative Adelaide \| ZQ Removals<\/title>/);
  assert.match(html, /<link rel="canonical" href="https:\/\/zqremovals\.au\/no-limits-removalists-alternative-adelaide\/" \/>/);
  assert.match(html, /No Limits Removalists/i);
  assert.match(html, /ZQ Removals/i);
  assert.match(html, /fixed-price/i);
  assert.match(html, /data-generated-module="competitor-source-note"/);
  assert.match(html, /rel="nofollow noopener noreferrer"/);
  assert.match(html, /"@type": "FAQPage"/);
  assert.ok((html.match(/class="faq-item/g) || []).length >= 4, 'competitor page should include visible FAQ support');
  assert.doesNotMatch(html, /scam|rip[- ]?off|avoid No Limits|bad removalist/i);
  assert.match(guideHub, /href="\/no-limits-removalists-alternative-adelaide\/"/);
  assert.match(sitemapGuides, /https:\/\/zqremovals\.au\/no-limits-removalists-alternative-adelaide\//);
});

function readDist(relativePath) {
  const normalized = relativePath.replace(/\\/g, '/');
  const candidates = [
    path.join(distDir, relativePath),
  ];
  if (normalized.endsWith('/index.html') && normalized !== 'index.html') {
    const prefix = normalized.slice(0, -11);
    candidates.unshift(path.join(distDir, `${prefix}/index/index.html`));
  } else if (normalized.endsWith('.html') && !normalized.endsWith('/index.html') && normalized !== 'index.html' && normalized !== '404.html') {
    const prefix = normalized.slice(0, -5);
    candidates.unshift(path.join(distDir, `${prefix}/index.html`));
  }
  for (const c of candidates) {
    try {
      return readFileSync(c, 'utf8');
    } catch {
      // ignore
    }
  }
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
