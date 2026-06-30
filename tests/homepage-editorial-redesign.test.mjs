import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();

test('editorial homepage direction stays generator-native and production-safe', async () => {
  const source = await readFile(path.join(root, 'site-src', 'content', 'index.html'), 'utf8');
  const built = await readFile(path.join(root, 'site-dist', 'index.html'), 'utf8');

  for (const html of [source, built]) {
    assert.match(html, /class="home-redesign-hero home-editorial-hero"/);
    assert.match(html, /class="home-quote-planner"/);
    assert.match(html, /class="home-editorial-bento"/);
    assert.match(html, /class="home-editorial-process-grid"/);
    assert.match(html, /class="home-premium-stats-grid"/);
    assert.match(html, /data-count="54"/);
    assert.match(html, /class="home-premium-feature-grid"/);
    assert.match(html, /class="home-premium-comparison-card"/);
    assert.match(html, /src="\/media\/home-local-hero-branded\.webp"/);
    assert.match(html, /href="\/services\/house-removals-adelaide\/"/);
    assert.match(html, /href="\/services\/interstate-removals-adelaide\/"/);
    assert.doesNotMatch(html, /cdn\.tailwindcss\.com|lh3\.googleusercontent\.com|href="#"/i);
    assert.doesNotMatch(html, /500\+|zero damage|no hidden fees/i);
  }
});

test('built homepage receives its page-specific body class', async () => {
  const built = await readFile(path.join(root, 'site-dist', 'index.html'), 'utf8');
  assert.match(built, /<body class="[^"]*\bpage-home\b[^"]*">/);
});

test('premium design layer uses performance-safe reveal and counter hooks', async () => {
  const css = await readFile(path.join(root, 'premium-site.css'), 'utf8');
  const js = await readFile(path.join(root, 'site.js'), 'utf8');

  assert.match(css, /2026 PREMIUM SERVICE BRAND SYSTEM/);
  assert.match(css, /cubic-bezier\(0\.32,\s*0\.72,\s*0,\s*1\)/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(js, /function setupAnimatedCounters\(\)/);
  assert.match(js, /IntersectionObserver/);
});
