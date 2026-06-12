import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const distDir = path.join(root, 'site-dist');
const gaMeasurementId = 'G-TESTMEASURE1';
const searchConsoleVerification = 'test-search-console-token';

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

async function buildSite(extraEnv = {}) {
  const previousValues = new Map();
  for (const [key, value] of Object.entries(extraEnv)) {
    previousValues.set(key, process.env[key]);
    process.env[key] = value;
  }

  try {
    const buildUrl = pathToFileURL(path.join(root, 'scripts', 'build-site.mjs')).href;
    await import(`${buildUrl}?cacheBust=${Date.now()}`);
  } finally {
    for (const [key, value] of previousValues.entries()) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

test.before(async () => {
  await buildSite({
    VITE_GA_MEASUREMENT_ID: gaMeasurementId,
    GOOGLE_SITE_VERIFICATION: searchConsoleVerification,
  });
});

test('build succeeds before audit assertions run', () => {
  assert.ok(readDist('index.html').length > 0);
});

test('homepage schema does not publish an unsupported aggregate rating', () => {
  const homepage = readDist('index.html');
  assert.doesNotMatch(homepage, /AggregateRating|aggregateRating|reviewCount|ratingValue/);
});

test('homepage and contact page avoid Gemini-labelled imagery and expose the current logo markup', () => {
  const homepage = readDist('index.html');
  const contactPage = readDist(path.join('contact-us', 'index.html'));

  assert.doesNotMatch(homepage, /Gemini_Generated_Image/i);
  assert.doesNotMatch(contactPage, /Gemini_Generated_Image/i);
  assert.match(
    homepage,
    /<img[^>]+src="\/brand-logo-96\.webp"[^>]+alt="ZQ Removals logo"/i,
  );
});

test('build injects env-driven analytics tags and uses the social share image fallback', () => {
  const homepage = readDist('index.html');
  const aboutPage = readDist(path.join('about', 'index.html'));

  assert.match(
    homepage,
    new RegExp(`<meta\\s+name="google-site-verification"\\s+content="${searchConsoleVerification}"`),
  );
  assert.match(
    homepage,
    new RegExp(`https://www\\.googletagmanager\\.com/gtag/js\\?id=${gaMeasurementId}`),
  );
  assert.match(homepage, new RegExp(`gtag\\('config',\\s*['"]${gaMeasurementId}['"]\\)`));
  assert.match(homepage, /<meta property="og:image" content="https:\/\/zqremovals\.au\/zq-removals-social-share\.webp"/);
  assert.match(aboutPage, /"image": "https:\/\/zqremovals\.au\/zq-removals-social-share\.webp"/);
});

test('homepage hero serves the current WebP asset and dimensions', () => {
  const homepage = readDist('index.html');
  const heroSource = homepage.match(/<picture>[\s\S]*?(<source\b[^>]+>)/i)?.[1] || '';

  assert.match(heroSource, /\bsrcset="[^"]*\/media\/home-local-hero-branded[^"]*"/i);
  assert.match(heroSource, /\btype="image\/webp"/i);
  assert.match(homepage, /<img[^>]+src="\/media\/home-local-hero-branded\.webp"/i);
  assert.match(homepage, /<img[^>]+width="768"/i);
  assert.match(homepage, /<img[^>]+height="406"/i);
});

test('minified stylesheet output is smaller than the source stylesheet', () => {
  const sourceCss = readFileSync(path.join(root, 'premium-site.css'), 'utf8');
  const minifiedCss = readDist('premium-site.min.css');

  assert.ok(minifiedCss.length < sourceCss.length, 'expected premium-site.min.css to be shorter than premium-site.css');
});

test('frontend quote flow emits a GA submission event hook', () => {
  const clientScript = readDist('analytics.mjs');

  assert.match(clientScript, /generate_lead/);
  assert.match(clientScript, /gtag\("event"/);
});

test('contact page keeps the quote layout while exposing Web3Forms-compatible contact fields', () => {
  const contactPage = readDist(path.join('contact-us', 'index.html'));

  assert.match(contactPage, /name="move_date"/);
  assert.match(contactPage, /name="pickup_suburb"/);
  assert.match(contactPage, /name="dropoff_suburb"/);
  assert.match(contactPage, /name="move_scope"/);
  assert.match(contactPage, /name="property_type"/);
  assert.match(contactPage, /name="move_size"/);
  assert.match(contactPage, /name="pickup_access"/);
  assert.match(contactPage, /name="dropoff_access"/);
  assert.match(contactPage, /name="packing_required"/);
  assert.match(contactPage, /name="name"/);
  assert.match(contactPage, /name="email"/);
  assert.match(contactPage, /name="phone"/);
  assert.match(contactPage, /name="message"/);
  assert.match(contactPage, /action="https:\/\/api\.web3forms\.com\/submit"/);
  assert.match(contactPage, /name="access_key" value="80c3ff0c-7ae6-4aa7-bb66-567612739824"/);
  assert.doesNotMatch(contactPage, /name="full_name"/);
  assert.doesNotMatch(contactPage, /name="move_details"/);
});

test('about page is built and surfaced from shared navigation', () => {
  const homepage = readDist('index.html');
  const aboutPage = readDist(path.join('about', 'index.html'));

  assert.match(homepage, /href="\/about\/"/);
  assert.match(aboutPage, /<h1[^>]*>About ZQ Removals/i);
  assert.match(aboutPage, /Representative move briefs/i);
});
