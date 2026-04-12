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
    GA_MEASUREMENT_ID: gaMeasurementId,
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
    new RegExp(`<meta name="google-site-verification" content="${searchConsoleVerification}"`),
  );
  assert.match(
    homepage,
    new RegExp(`https://www\\.googletagmanager\\.com/gtag/js\\?id=${gaMeasurementId}`),
  );
  assert.match(homepage, new RegExp(`gtag\\('config', ["']${gaMeasurementId}["']\\)`));
  assert.match(homepage, /<meta property="og:image" content="https:\/\/zqremovals\.au\/zq-removals-social-share\.webp"/);
  assert.match(aboutPage, /"image": "https:\/\/zqremovals\.au\/zq-removals-social-share\.webp"/);
});

test('homepage hero serves the current WebP asset and dimensions', () => {
  const homepage = readDist('index.html');

  assert.match(homepage, /<picture>[\s\S]*?<source[^>]+srcset="\/media\/home-local-hero-branded\.webp"[^>]+type="image\/webp"/i);
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
  const clientScript = readDist('site.js');

  assert.match(clientScript, /quote_submitted/);
  assert.match(clientScript, /window\.gtag/);
});

test('contact page ships the removals-specific quote form fields', () => {
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
  assert.match(contactPage, /name="full_name"/);
  assert.match(contactPage, /name="email"/);
  assert.match(contactPage, /name="phone"/);
  assert.match(contactPage, /name="move_details"/);
});

test('about page is built and surfaced from shared navigation', () => {
  const homepage = readDist('index.html');
  const aboutPage = readDist(path.join('about', 'index.html'));

  assert.match(homepage, /href="\/about\/"/);
  assert.match(aboutPage, /<h1[^>]*>About ZQ Removals/i);
  assert.match(aboutPage, /Representative move briefs/i);
});
