import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { auditGeneratedContrast } from '../scripts/contrast-audit.mjs';

const root = process.cwd();
const distDir = path.join(root, 'site-dist');
const css = readFileSync(path.join(root, 'premium-site.css'), 'utf8');

function hexToRgb(hex) {
  const normalized = hex.replace('#', '');
  const full = normalized.length === 3
    ? normalized.split('').map((char) => char + char).join('')
    : normalized;
  return [
    Number.parseInt(full.slice(0, 2), 16) / 255,
    Number.parseInt(full.slice(2, 4), 16) / 255,
    Number.parseInt(full.slice(4, 6), 16) / 255,
  ];
}

function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map((channel) => (
    channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  ));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(foreground, background) {
  const lighter = Math.max(luminance(foreground), luminance(background));
  const darker = Math.min(luminance(foreground), luminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

function lastTokenValue(name) {
  const matches = [...css.matchAll(new RegExp(`${name}:\\s*([^;]+);`, 'g'))];
  assert.ok(matches.length > 0, `${name} token is missing`);
  return matches.at(-1)[1].trim();
}

function assertContrast(foreground, background, minimum, label) {
  assert.ok(
    contrastRatio(foreground, background) >= minimum,
    `${label} contrast ${contrastRatio(foreground, background).toFixed(2)} is below ${minimum}`,
  );
}

function readDist(route) {
  return readFileSync(path.join(distDir, route === '/' ? 'index.html' : route.replace(/^\//, ''), route === '/' ? '' : 'index.html'), 'utf8');
}

test('shared light-surface contrast contracts use dark readable foregrounds', () => {
  assert.match(css, /--color-surface-strong:\s*#10231f/i);
  assert.equal(lastTokenValue('--surface-dark'), '#071713');
  assert.equal(lastTokenValue('--surface-dark-elevated'), '#10231f');
  assert.equal(lastTokenValue('--surface-light'), '#fffdf8');
  assert.equal(lastTokenValue('--surface-light-muted'), '#f3efe6');
  assert.equal(lastTokenValue('--text-on-dark'), '#fffdf8');
  assert.equal(lastTokenValue('--heading-on-dark'), '#fffdf8');
  assert.equal(lastTokenValue('--text-on-light'), '#10231f');
  assert.equal(lastTokenValue('--heading-on-light'), '#071713');
  assert.notEqual(lastTokenValue('--text-on-light'), lastTokenValue('--text-on-dark'));
  assert.notEqual(lastTokenValue('--bg-light'), lastTokenValue('--bg-dark'));
  assertContrast('#fffdf8', '#071713', 4.5, 'dark surface body text');
  assertContrast('#e4ded2', '#10231f', 4.5, 'dark elevated muted text');
  assertContrast('#10231f', '#fffdf8', 4.5, 'light surface body text');
  assertContrast('#3f534c', '#f3efe6', 4.5, 'light muted body text');
  assertContrast('#10231f', '#c9a86a', 4.5, 'gold CTA text');
  assert.match(css, /--input-bg:\s*#fffdf8/i);
  assert.match(css, /--input-text:\s*#10231f/i);
  assert.match(css, /\.lead-machine-cta\s*\{[^}]*background:\s*#f3efe6;[^}]*color:\s*#10231f;/s);
  assert.match(css, /\.lead-machine-cta-shell h2,\s*\n\.lead-machine-cta-shell p\s*\{\s*color:\s*#10231f;\s*\}/s);
  assert.match(css, /\.lead-machine-cta-shell p\s*\{\s*color:\s*#3f534c;\s*\}/s);
  assert.match(css, /\.lead-machine-cta-shell \.eyebrow\s*\{\s*color:\s*#0b5d50;\s*\}/s);
  assert.match(css, /\.button-primary\s*\{\s*color:\s*#fffdf8\s*!important;\s*\}/s);
  assert.match(css, /\.route-card small,\s*\n\.proof-label,\s*\n\.button-link,[^}]*color:\s*#7a4b0c;/s);
  assert.doesNotMatch(css, /\.button-primary,\s*\n\.button-cta\s*\{\s*color:\s*#10231f\s*!important;/s);
});

test('dark-surface interaction states keep readable accent text', () => {
  assert.match(css, /body\.page-home \.od-band \.od-kicker\s*\{\s*color:\s*var\(--zq-gold-light\);/s);
  assert.match(
    css,
    /main a:not\([^)]*\):hover,\s*\nmain a:not\([^)]*\):focus-visible\s*\{[\s\S]*color:\s*var\(--zq-gold-light\);/s,
  );
  assert.match(css, /\.sticky-mobile-cta \.button-secondary\s*\{[\s\S]*color:\s*#071713;/s);
});

test('generated urgency banner keeps dark copy on its light premium surface', () => {
  const servicePage = readDist('/house-removals-adelaide/');
  assert.match(servicePage, /data-lead-machine-cta="v7"/);
  assert.match(servicePage, /Get a moving quote before your move date disappears\./);
  assert.match(servicePage, /<section class="section lead-machine-cta"/);
  assert.doesNotMatch(servicePage, /lead-machine-cta[^]*?style="[^"]*color:\s*(?:white|#fff)/i);
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
