import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
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
  assert.match(homepage, /<meta property="og:image" content="https:\/\/zqremovalsadelaide\.com\.au\/zq-removals-social-share\.webp"/);
  assert.match(aboutPage, /"image": "https:\/\/zqremovalsadelaide\.com\.au\/zq-removals-social-share\.webp"/);
});

test('homepage decorative hero serves the current optimized WebP asset', async () => {
  const homepage = readDist('index.html');
  const preload = homepage.match(/<link[^>]+rel="preload"[^>]+href="\/media\/premium-template-hero\.webp"[^>]*>/i)?.[0] || '';
  const stylesheet = readFileSync(path.join(root, 'premium-site.css'), 'utf8');
  const metadata = await sharp(path.join(distDir, 'media', 'premium-template-hero.webp')).metadata();

  assert.match(preload, /as="image"/i);
  assert.match(preload, /type="image\/webp"/i);
  assert.match(preload, /fetchpriority="high"/i);
  assert.match(stylesheet, /url\(['"]?\/media\/premium-template-hero\.webp['"]?\)/);
  assert.equal(metadata.format, 'webp');
  assert.equal(metadata.width, 1440);
  assert.equal(metadata.height, 900);
});

test('minified stylesheet output is smaller than the source stylesheet', () => {
  const sourceCss = readFileSync(path.join(root, 'premium-site.css'), 'utf8');
  const minifiedCss = readDist('premium-home.min.css');

  assert.ok(minifiedCss.length < sourceCss.length, 'expected premium-home.min.css to be shorter than premium-site.css');
});

test('frontend quote flow emits a GA submission event hook', () => {
  const clientScript = readDist('analytics.mjs');

  assert.match(clientScript, /generate_lead/);
  assert.match(clientScript, /gtag\("event"/);
});

test('contact page exposes the shared simple quote form fields', () => {
  const contactPage = readDist(path.join('contact-us', 'index.html'));

  for (const field of ['full_name', 'phone', 'pickup_suburb', 'dropoff_suburb', 'move_date', 'additional_details']) {
    assert.match(contactPage, new RegExp(`name="${field}"`));
  }
  assert.match(contactPage, /name="form_type" value="simple_quote"/);
  assert.doesNotMatch(contactPage, /action="https:\/\/api\.web3forms\.com\/submit"/);
  assert.doesNotMatch(contactPage, /name="access_key"/);
  assert.doesNotMatch(contactPage, /name="move_scope"|name="email"/);
});

test('about page is built and surfaced from shared navigation', () => {
  const homepage = readDist('index.html');
  const aboutPage = readDist(path.join('about', 'index.html'));

  assert.match(homepage, /href="\/about\/"/);
  assert.match(aboutPage, /<h1[^>]*>About ZQ Removals/i);
  assert.match(aboutPage, /Representative move briefs/i);
});
