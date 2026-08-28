import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { zqServiceAreaMapConfig } from '../site-src/data/maps.mjs';
import { zqPrioritySuburbRoutes } from '../site-src/data/zq-suburbs.mjs';

const root = process.cwd();
const distDir = path.join(root, 'site-dist');
const adelaideHub = readFileSync(path.join(distDir, 'removalists-adelaide', 'index.html'), 'utf8');

test('service-area locator has crawlable fallback content and verified routes', () => {
  assert.match(adelaideHub, /data-service-area-locator/);
  assert.match(adelaideHub, /Find ZQ Removals near you/);
  assert.match(adelaideHub, /Map pins mark general suburb service areas only/);
  assert.match(adelaideHub, /list="service-area-options"/);
  assert.match(adelaideHub, /Interactive map loading/);
  assert.match(adelaideHub, /\/contact-us\/#quote-form/);
  assert.match(adelaideHub, /tel:\+61433819989/);

  for (const location of zqServiceAreaMapConfig.locations) {
    assert.match(adelaideHub, new RegExp(`href="${location.url.replaceAll('/', '\\/')}"`));
    assert.doesNotMatch(JSON.stringify(location), /placeId|office|branch|depot/i);
  }
});

test('locator uses only priority suburb routes with shared geography and no business identifiers', () => {
  const priorityRoutes = new Map(zqPrioritySuburbRoutes.map((route) => [route.slug, route.path]));
  priorityRoutes.set('adelaide-cbd', '/removalists-adelaide-cbd/');
  for (const slug of ['adelaide-cbd', 'glenelg', 'norwood', 'unley', 'mawson-lakes', 'mount-barker', 'salisbury', 'marion', 'prospect', 'burnside', 'magill']) {
    assert.ok(zqServiceAreaMapConfig.locations.some((location) => location.slug === slug));
  }
  for (const location of zqServiceAreaMapConfig.locations) {
    assert.equal(location.url, priorityRoutes.get(location.slug));
    assert.equal(location.label, 'Service Area');
    assert.equal(typeof location.latitude, 'number');
    assert.equal(typeof location.longitude, 'number');
    assert.doesNotMatch(JSON.stringify(location), /placeId|address|office|branch|depot/i);
  }
});

test('locator loads Maps once, lazily, and does not request unused Google APIs', () => {
  const siteScript = readFileSync(path.join(root, 'site.js'), 'utf8');
  assert.equal((siteScript.match(/maps\.googleapis\.com\/maps\/api\/js/g) || []).length, 1);
  assert.match(siteScript, /IntersectionObserver/);
  assert.match(siteScript, /loading=async/);
  assert.doesNotMatch(siteScript, /distanceMatrix|directionsService|places\.Autocomplete|PlaceResult/);
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
