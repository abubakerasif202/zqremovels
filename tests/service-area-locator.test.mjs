import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { zqServiceAreaMapConfig } from '../site-src/data/maps.mjs';

const root = process.cwd();
const distDir = path.join(root, 'site-dist');
const adelaideHub = readFileSync(path.join(distDir, 'removalists-adelaide', 'index.html'), 'utf8');

test('service-area locator has crawlable fallback content and verified routes', () => {
  assert.match(adelaideHub, /data-service-area-locator/);
  assert.match(adelaideHub, /Find ZQ Removals near you/);
  assert.match(adelaideHub, /Map pins mark general suburb service areas only/);
  assert.match(adelaideHub, /\/contact-us\/#quote-form/);
  assert.match(adelaideHub, /tel:\+61433819989/);

  for (const location of zqServiceAreaMapConfig.locations) {
    assert.match(adelaideHub, new RegExp(`href="${location.url.replaceAll('/', '\\/')}"`));
    assert.doesNotMatch(JSON.stringify(location), /placeId|office|branch|depot/i);
  }
});

test('locator removes all supplied Google demo content and fake business entities', () => {
  const htmlFiles = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.html')) htmlFiles.push(full);
    }
  };
  walk(distDir);
  const output = htmlFiles.map((file) => readFileSync(file, 'utf8')).join('\n');
  for (const sample of ['Escondido Grill', 'San Francisco', '601 Geary', '747 3rd', '1512 Stockton', '3755 Noriega', '2619 Mission', '4935 Mission', '6202 3rd', 'Reserve a table', 'DEMO_MAP_ID']) {
    assert.doesNotMatch(output, new RegExp(sample.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
  }
  assert.doesNotMatch(output, /data-service-area-locator[^>]*>[^]*?LocalBusiness/i);
});

test('published pricing statements retain both verified hourly rates', () => {
  const htmlFiles = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.html')) htmlFiles.push(full);
    }
  };
  walk(distDir);
  for (const file of htmlFiles) {
    const html = readFileSync(file, 'utf8');
    if (/for 2 men and a truck/i.test(html)) assert.match(html, /\$75/);
    if (/for 3 men and a truck/i.test(html)) assert.match(html, /\$89/);
  }
});
