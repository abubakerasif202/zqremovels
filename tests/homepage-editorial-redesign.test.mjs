import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();

test('editorial homepage direction stays generator-native and production-safe', async () => {
  const source = await readFile(path.join(root, 'site-src', 'content', 'index.html'), 'utf8');
  const built = await readFile(path.join(root, 'site-dist', 'index.html'), 'utf8');

  for (const html of [source, built]) {
    assert.match(html, /class="home-redesign-hero od-hero"/);
    assert.match(html, /class="od-hero-assurance"/);
    assert.match(html, /class="od-service-grid"/);
    assert.match(html, /class="od-process-list"/);
    assert.match(html, /class="od-review-summary home-redesign-rating-box"/);
    assert.match(html, /class="od-quote-card-heading"/);
    assert.match(html, /54 Google reviews/i);
    assert.match(html, /src="\/media\/home-local-hero-branded\.webp"/);
    assert.match(html, /href="\/services\/house-removals-adelaide\/"/);
    assert.match(html, /href="\/services\/interstate-removals-adelaide\/"/);
    assert.doesNotMatch(html, /od-hero-3d|od-3d-|@keyframes od/i);
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
  assert.match(css, /Premium homepage finish: scoped to the active OD homepage system/);
  assert.match(css, /Fast premium finish: removes decorative 3D motion/);
  assert.doesNotMatch(css, /@keyframes odSceneFloat|@keyframes odTruckDrive|@keyframes odNodePulse/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(js, /function setupAnimatedCounters\(\)/);
  assert.match(js, /IntersectionObserver/);
});

test('full-site premium rebuild keeps the new brand promise and accessible design contract', async () => {
  const source = await readFile(path.join(root, 'site-src', 'content', 'index.html'), 'utf8');
  const generatorCss = await readFile(path.join(root, 'premium-site.css'), 'utf8');
  const astroCss = await readFile(path.join(root, 'src', 'styles', 'premium-site.css'), 'utf8');

  assert.match(source, /class="od-hero-statement">Move day, handled\.<\/p>/);
  assert.match(source, />Get Free Quote<\/a>/);

  for (const css of [generatorCss, astroCss]) {
    assert.match(css, /2026 FULL-SITE PREMIUM REBUILD/);
    assert.match(css, /--premium-ink:\s*#071713/);
    assert.match(css, /--premium-orange:\s*#ff6426/);
    assert.match(css, /--font-heading:\s*"Fraunces"/);
    assert.match(css, /body\.page-home \.od-hero-statement/);
    assert.match(css, /@media \(max-width: 759px\)/);
    assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  }
});
