import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { auditGeneratedContrast } from '../scripts/contrast-audit.mjs';

const root = process.cwd();
const distDir = path.join(root, 'site-dist');
const css = readFileSync(path.join(root, 'premium-site.css'), 'utf8');

function readDist(route) {
  return readFileSync(path.join(distDir, route === '/' ? 'index.html' : route.replace(/^\//, ''), route === '/' ? '' : 'index.html'), 'utf8');
}

test('shared light-surface contrast contracts use dark readable foregrounds', () => {
  assert.match(css, /--color-surface-strong:\s*#10231f/i);
  assert.match(css, /\.lead-machine-cta\s*\{[^}]*background:\s*#f3efe6;[^}]*color:\s*#10231f;/s);
  assert.match(css, /\.lead-machine-cta-shell h2,\s*\n\.lead-machine-cta-shell p\s*\{\s*color:\s*#10231f;\s*\}/s);
  assert.match(css, /\.lead-machine-cta-shell p\s*\{\s*color:\s*#3f534c;\s*\}/s);
  assert.match(css, /\.lead-machine-cta-shell \.eyebrow\s*\{\s*color:\s*#0b5d50;\s*\}/s);
  assert.match(css, /\.button-primary\s*\{\s*color:\s*#fffdf8\s*!important;\s*\}/s);
  assert.match(css, /\.route-card small,\s*\n\.proof-label,\s*\n\.button-link,[^}]*color:\s*#7a4b0c;/s);
  assert.doesNotMatch(css, /\.button-primary,\s*\n\.button-cta\s*\{\s*color:\s*#10231f\s*!important;/s);
});

test('generated urgency banner keeps dark copy on its light premium surface', () => {
  const homepage = readDist('/');
  assert.match(homepage, /data-lead-machine-cta="v7"/);
  assert.match(homepage, /Get a fixed-price quote before your move date disappears\./);
  assert.match(homepage, /<section class="section lead-machine-cta"/);
  assert.doesNotMatch(homepage, /lead-machine-cta[^]*?style="[^"]*color:\s*(?:white|#fff)/i);
});

test('all generated HTML avoids obvious light-surface contrast anti-patterns', () => {
  assert.deepEqual(auditGeneratedContrast(distDir), []);
});

test('priority routes preserve canonical, indexability, and sitemap inclusion', () => {
  const routes = [
    '/', '/removalists-adelaide/', '/removalists-marion/', '/removalists-hyde-park/',
    '/removalists-malvern/', '/removalists-unley/', '/removalists-unley-park/',
    '/removalists-medindie/', '/removalists-elizabeth/', '/adelaide-to-sydney-removalists/',
    '/adelaide-to-brisbane-removals/', '/adelaide-to-melbourne-removalists/',
    '/furniture-removalists-adelaide/', '/packing-services-adelaide/', '/about/',
    '/adelaide-moving-guides/', '/contact-us/'
  ];
  const sitemap = ['sitemap-pages.xml', 'sitemap-services.xml', 'sitemap-suburbs.xml', 'sitemap-guides.xml']
    .map((file) => readFileSync(path.join(distDir, file), 'utf8')).join('\n');

  for (const route of routes) {
    const html = readDist(route);
    const canonical = `https://zqremovals.au${route}`;
    assert.match(html, new RegExp(`<link rel="canonical" href="${canonical.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`), `${route} canonical mismatch`);
    assert.doesNotMatch(html, /<meta name="robots" content="[^"]*noindex/i, `${route} must remain indexable`);
    assert.match(sitemap, new RegExp(canonical.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `${route} missing from sitemap`);
  }
});
