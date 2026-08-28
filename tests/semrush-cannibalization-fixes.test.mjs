import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const distDir = path.join(root, 'site-dist');

test.before(async () => {
  const buildUrl = pathToFileURL(path.join(root, 'scripts', 'build-site.mjs')).href;
  await import(`${buildUrl}?semrushCannibalization=${Date.now()}`);
});

test('Semrush overlap URLs redirect to one canonical page per intent', () => {
  const redirects = [
    ['office-relocation-adelaide/index.html', '/office-removals-adelaide/'],
    ['services/office-removals-adelaide/index.html', '/office-removals-adelaide/'],
    ['services/house-removals-adelaide/index.html', '/house-removals-adelaide/'],
    ['services/packing-services-adelaide/index.html', '/packing-services-adelaide/'],
    ['services/interstate-removals-adelaide/index.html', '/interstate-removals-adelaide/'],
    ['services/interstate-removalists-adelaide/index.html', '/interstate-removals-adelaide/'],
    ['services/apartment-removals-adelaide/index.html', '/apartment-removals-adelaide/'],
    ['services/furniture-removals-adelaide/index.html', '/furniture-removalists-adelaide/'],
    ['furniture-removals-adelaide/index.html', '/furniture-removalists-adelaide/'],
    ['movers-and-packers-adelaide/index.html', '/adelaide-movers-and-packers/'],
    ['affordable-removalists-adelaide/index.html', '/cheap-removalists-adelaide/'],
  ];

  for (const [output, destination] of redirects) {
    const html = readFileSync(path.join(distDir, output), 'utf8');
    assert.match(html, /<meta name="robots" content="noindex,nofollow"/i, output);
    assert.match(
      html,
      new RegExp(`<link rel="canonical" href="https://zqremovals\\.au${escapeRegex(destination)}"`),
      output,
    );
    assert.match(
      html,
      new RegExp(`<meta http-equiv="refresh" content="0; url=${escapeRegex(destination)}"`),
      output,
    );
  }
});

test('canonical winners remain indexable and ranking URLs stay unchanged', () => {
  for (const [output, canonical] of [
    ['office-removals-adelaide/index.html', '/office-removals-adelaide/'],
    ['house-removals-adelaide/index.html', '/house-removals-adelaide/'],
    ['packing-services-adelaide/index.html', '/packing-services-adelaide/'],
    ['interstate-removals-adelaide/index.html', '/interstate-removals-adelaide/'],
    ['apartment-removals-adelaide/index.html', '/apartment-removals-adelaide/'],
    ['furniture-removalists-adelaide/index.html', '/furniture-removalists-adelaide/'],
    ['adelaide-movers-and-packers/index.html', '/adelaide-movers-and-packers/'],
    ['cheap-removalists-adelaide/index.html', '/cheap-removalists-adelaide/'],
    ['removalists-queens-park/index.html', '/removalists-queens-park/'],
  ]) {
    const html = readFileSync(path.join(distDir, output), 'utf8');
    assert.match(html, /<meta name="robots" content="index,follow,max-image-preview:large"/i, output);
    assert.match(
      html,
      new RegExp(`<link rel="canonical" href="https://zqremovals\\.au${escapeRegex(canonical)}"`),
      output,
    );
  }
});

test('sitemaps and indexable HTML do not advertise consolidated aliases', () => {
  const aliasPatterns = [
    '/office-relocation-adelaide/',
    '/services/office-removals-adelaide/',
    '/services/house-removals-adelaide/',
    '/services/packing-services-adelaide/',
    '/services/interstate-removals-adelaide/',
    '/services/interstate-removalists-adelaide/',
    '/services/apartment-removals-adelaide/',
    '/services/furniture-removals-adelaide/',
    '/furniture-removals-adelaide/',
    '/movers-and-packers-adelaide/',
    '/affordable-removalists-adelaide/',
  ];
  const sitemap = readdirSync(distDir)
    .filter((name) => /^sitemap.*\.xml$/.test(name))
    .map((name) => readFileSync(path.join(distDir, name), 'utf8'))
    .join('\n');

  for (const alias of aliasPatterns) {
    assert.doesNotMatch(sitemap, new RegExp(`https://zqremovals\\.au${escapeRegex(alias)}`), alias);
  }

  for (const htmlFile of walkHtmlFiles(distDir)) {
    const html = readFileSync(htmlFile, 'utf8');
    if (/<meta name="robots" content="noindex,nofollow"/i.test(html)) continue;
    for (const alias of aliasPatterns) {
      assert.doesNotMatch(html, new RegExp(`href="${escapeRegex(alias)}"`), `${htmlFile}: ${alias}`);
    }
  }
});

test('Vercel serves permanent redirects for every consolidated GSC alias', () => {
  const config = JSON.parse(readFileSync(path.join(root, 'vercel.json'), 'utf8'));
  const redirects = new Map(config.redirects.map(({ source, destination, permanent }) => [source, { destination, permanent }]));
  const aliases = [
    ['/services/house-removals-adelaide', '/house-removals-adelaide/'],
    ['/services/packing-services-adelaide', '/packing-services-adelaide/'],
    ['/services/interstate-removals-adelaide', '/interstate-removals-adelaide/'],
    ['/services/interstate-removalists-adelaide', '/interstate-removals-adelaide/'],
    ['/services/apartment-removals-adelaide', '/apartment-removals-adelaide/'],
    ['/services/furniture-removals-adelaide', '/furniture-removalists-adelaide/'],
    ['/furniture-removals-adelaide', '/furniture-removalists-adelaide/'],
    ['/movers-and-packers-adelaide', '/adelaide-movers-and-packers/'],
  ];

  for (const [source, destination] of aliases) {
    for (const variant of [source, `${source}/`, `${source}/index.html`]) {
      assert.deepEqual(redirects.get(variant), { destination, permanent: true }, variant);
    }
  }
});

test('high-impression top-ten pages use intent-matched search snippets', () => {
  const snippets = [
    ['removalists-adelaide-cbd/index.html', /Removalists Adelaide CBD \| Apartment &amp; Office Movers/i, /lift bookings, loading zones, parking and access/i],
    ['removalists-unley-park/index.html', /Removalists Unley Park \| Home &amp; Furniture Movers/i, /homes, townhouses and furniture moves/i],
    ['same-day-removalists-adelaide/index.html', /Same Day Removalists Adelaide \| Check Availability/i, /current crew availability/i],
    ['door-2-door-movers-alternative-adelaide/index.html', /Door 2 Door Movers Adelaide Alternative \| Compare ZQ/i, /local planning, furniture care, transparent rates/i],
  ];

  for (const [output, title, description] of snippets) {
    const html = readFileSync(path.join(distDir, output), 'utf8');
    assert.match(html, title, `${output} title`);
    assert.match(html, description, `${output} description`);
  }
});

test('commercial copy does not expose internal SEO drafting labels', () => {
  const cheap = readFileSync(path.join(distDir, 'cheap-removalists-adelaide/index.html'), 'utf8');
  assert.doesNotMatch(
    cheap,
    /Adelaide money page|Unique angle|Conversion path|Future video proof|owner-confirmed/i,
  );
});

function walkHtmlFiles(directory) {
  const files = [];
  for (const entry of readdirSync(directory)) {
    const full = path.join(directory, entry);
    const stats = statSync(full);
    if (stats.isDirectory()) files.push(...walkHtmlFiles(full));
    else if (entry.endsWith('.html')) files.push(full);
  }
  return files;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
