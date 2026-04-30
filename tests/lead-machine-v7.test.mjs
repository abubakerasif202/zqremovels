import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const distDir = path.join(root, 'site-dist');

function readDist(relativePath) {
  return readFileSync(path.join(distDir, relativePath), 'utf8');
}

function walkHtml(dir, results = []) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stats = statSync(full);
    if (stats.isDirectory()) {
      walkHtml(full, results);
    } else if (entry.endsWith('.html')) {
      results.push(full);
    }
  }
  return results;
}

test('build succeeds before v7 lead machine assertions run', async () => {
  const buildUrl = pathToFileURL(path.join(root, 'scripts', 'build-site.mjs')).href;
  await import(`${buildUrl}?leadMachineV7=${Date.now()}${Math.random()}`);
});

test('v7 conversion pages exist with forms, call CTAs, and canonical tags', () => {
  const thankYou = readDist(path.join('thank-you', 'index.html'));
  const facebook = readDist(path.join('adelaide-removalists-facebook-offer', 'index.html'));
  const google = readDist(path.join('removalists-adelaide-quote', 'index.html'));

  assert.match(thankYou, /data-conversion-success="quote_form_success"/);
  assert.match(thankYou, /<link rel="canonical" href="https:\/\/zqremovals\.au\/thank-you\/"/);
  assert.match(thankYou, /noindex,follow/);

  for (const html of [facebook, google]) {
    assert.match(html, /id="quote-form"/);
    assert.match(html, /data-quote-form="quote"/);
    assert.match(html, /href="tel:\+61433819989"/);
    assert.match(html, /FAQPage/);
    assert.match(html, /<link rel="canonical" href="https:\/\/zqremovals\.au\//);
  }

  assert.match(facebook, /Moving in Adelaide\? Get a Fast Quote Today/);
  assert.match(google, /Premium Removalists Adelaide/);
});

test('v7 quote forms expose required lead fields and attribution hidden fields', () => {
  const pages = [
    readDist('index.html'),
    readDist(path.join('contact-us', 'index.html')),
    readDist(path.join('adelaide-removalists-facebook-offer', 'index.html')),
    readDist(path.join('removalists-adelaide-quote', 'index.html')),
  ];
  const requiredFields = ['name', 'phone', 'pickup_suburb', 'dropoff_suburb', 'move_date', 'move_scope', 'message'];
  const attributionFields = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'fbclid'];

  for (const html of pages) {
    for (const name of requiredFields) {
      assert.match(html, new RegExp(`name="${name}"`), `missing ${name}`);
    }
    for (const name of attributionFields) {
      assert.match(html, new RegExp(`name="${name}"[^>]+data-attribution-field="${name}"`), `missing ${name}`);
    }
  }
});

test('v7 tracking helper supports ad platforms, attribution, and lead events without hardcoded ad secrets', () => {
  const analytics = readFileSync(path.join(root, 'analytics.mjs'), 'utf8');
  const site = readFileSync(path.join(root, 'site.js'), 'utf8');
  const build = readFileSync(path.join(root, 'scripts', 'build-site.mjs'), 'utf8');

  for (const token of [
    'phone_click',
    'quote_form_start',
    'quote_form_submit',
    'quote_form_success',
    'email_click',
    'facebook_ad_landing',
    'google_ad_landing',
    'service_cta_click',
    'suburb_cta_click',
    'price_page_cta_click',
  ]) {
    assert.match(`${analytics}\n${site}`, new RegExp(token));
  }

  assert.match(analytics, /googleAdsConversionId/);
  assert.match(analytics, /googleAdsLeadLabel/);
  assert.match(analytics, /sendMetaTrack\("Lead"/);
  assert.match(build, /VITE_GOOGLE_ADS_CONVERSION_ID/);
  assert.match(build, /VITE_GOOGLE_ADS_LEAD_LABEL/);
  assert.doesNotMatch(`${analytics}\n${build}`, /AW-\d{6,}/);
});

test('v7 lead hooks decorate tel and quote links across generated pages', () => {
  const samplePages = [
    readDist('index.html'),
    readDist(path.join('house-removals-adelaide', 'index.html')),
    readDist(path.join('removalists-andrews-farm', 'index.html')),
    readDist(path.join('adelaide-moving-guides', 'moving-heavy-furniture-adelaide', 'index.html')),
  ];

  for (const html of samplePages) {
    assert.match(html, /data-lead-event="phone_click"/);
    assert.match(html, /data-lead-location="[^"]+"/);
    assert.match(html, /data-lead-event="quote_cta_click"/);
  }

  assert.match(readDist('index.html'), /class="sticky-mobile-cta"/);
});

test('v7 lead machine CTA is injected into service, suburb, and guide pages with readable contrast classes', () => {
  const service = readDist(path.join('furniture-removalists-adelaide', 'index.html'));
  const suburb = readDist(path.join('removalists-andrews-farm', 'index.html'));
  const guide = readDist(path.join('adelaide-moving-guides', 'moving-heavy-furniture-adelaide', 'index.html'));
  const css = readFileSync(path.join(root, 'premium-site.css'), 'utf8');

  for (const html of [service, suburb, guide]) {
    assert.match(html, /data-lead-machine-cta="v7"/);
    assert.match(html, /Need movers today\?/);
    assert.match(html, /Call ZQ Removals now/);
  }

  assert.match(css, /\.lead-machine-cta\s*\{/);
  assert.match(css, /\.lead-machine-cta-shell h2,\s*\n\.lead-machine-cta-shell p\s*\{/);
});

test('v7 generated output avoids duplicate canonical conflicts and real ad account secrets', () => {
  const htmlFiles = walkHtml(distDir);
  for (const file of htmlFiles) {
    const html = readFileSync(file, 'utf8');
    assert.equal((html.match(/rel="canonical"/g) || []).length, 1, file);
    assert.doesNotMatch(html, /https:\/\/www\.zqremovals\.au/);
    assert.doesNotMatch(html, /AW-\d{6,}/);
  }
});
