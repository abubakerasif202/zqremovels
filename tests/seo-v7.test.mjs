import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const distDir = path.join(root, 'site-dist');
const canonicalHost = 'https://zqremovals.au';

const v7Docs = [
  'docs/trust-signals-v7-implementation-plan.md',
  'docs/seo-v7-roadmap-from-audit.md',
  'docs/hyperlocal-suburb-framework-v7.md',
  'docs/interstate-route-expansion-v7.md',
  'docs/aeo-ai-overview-formatting-v7.md',
  'docs/office-removals-b2b-v7.md',
];

const routeSlugs = [
  'adelaide-to-sydney-removalists',
  'adelaide-to-melbourne-removalists',
  'adelaide-to-western-sydney-removalists',
  'adelaide-to-smithfield-nsw-removalists',
];

test.before(async () => {
  const buildUrl = pathToFileURL(path.join(root, 'scripts', 'build-site.mjs')).href;
  await import(`${buildUrl}?seoV7=${Date.now()}`);
});

test('seo v7 docs exist and encode the unsafe-claim rules', () => {
  for (const file of v7Docs) {
    assert.ok(existsSync(path.join(root, file)), `${file} missing`);
    assert.ok(readFileSync(path.join(root, file), 'utf8').length > 100, `${file} too thin`);
  }

  const trustDoc = readFileSync(path.join(root, 'docs/trust-signals-v7-implementation-plan.md'), 'utf8');
  assert.match(trustDoc, /Do not invent an ABN/i);
  assert.match(trustDoc, /Do not invent insurance provider/i);
  assert.match(trustDoc, /Do not invent AFRA accreditation/i);

  const hyperlocalDoc = readFileSync(path.join(root, 'docs/hyperlocal-suburb-framework-v7.md'), 'utf8');
  assert.match(hyperlocalDoc, /council/i);
  assert.match(hyperlocalDoc, /road/i);
  assert.match(hyperlocalDoc, /access/i);
  assert.match(hyperlocalDoc, /parking/i);
});

test('confirmed ABN is visible in footer, contact, about, and MovingCompany schema', () => {
  const footerSource = readFileSync(path.join(root, 'site-src', 'partials', 'footer.html'), 'utf8');
  const about = readDist(path.join('about', 'index.html'));
  const contact = readDist(path.join('contact-us', 'index.html'));
  const homepage = readDist('index.html');

  for (const html of [footerSource, about, contact, homepage]) {
    assert.match(html, /ABN 97 954 095 119/);
  }

  const movingCompanyNodes = extractJsonLd(homepage)
    .flatMap(flattenJsonLdNodes)
    .filter((node) => nodeTypes(node).includes('MovingCompany'));
  assert.ok(movingCompanyNodes.length > 0, 'homepage missing MovingCompany schema');
  assert.ok(
    movingCompanyNodes.some((node) =>
      node.taxID === '97954095119' ||
      node.identifier?.value === '97954095119' ||
      JSON.stringify(node.identifier || '').includes('97954095119'),
    ),
    'MovingCompany schema missing confirmed ABN value',
  );
});

test('seo v7 interstate route pages exist, are canonical, indexed, and avoid destination-office claims', () => {
  const sitemap = [
    readDist('sitemap-pages.xml'),
    readDist('sitemap-services.xml'),
    readDist('sitemap-suburbs.xml'),
    readDist('sitemap-guides.xml'),
  ].join('\n');

  for (const slug of routeSlugs) {
    const html = readDist(path.join(slug, 'index.html'));
    const main = extractMain(html);
    const types = schemaTypes(html);

    assert.match(html, new RegExp(`<link rel="canonical" href="${canonicalHost}/${slug}/"`), slug);
    assert.match(sitemap, new RegExp(`${canonicalHost}/${slug}/`), `${slug} missing from sitemap`);
    assert.equal((html.match(/<h1\b/gi) || []).length, 1, `${slug} h1 count`);
    assert.match(main, /class="[^"]*\bfaq-item\b/i, `${slug} missing visible FAQ`);
    assert.match(main, /href="\/contact-us\/#quote-form"/, `${slug} missing quote CTA`);
    assert.ok(types.has('Service'), `${slug} missing Service schema`);
    assert.ok(types.has('BreadcrumbList'), `${slug} missing Breadcrumb schema`);
    assert.ok(types.has('FAQPage'), `${slug} missing FAQ schema`);
    assert.doesNotMatch(main, /\b(?:our|the|a)\s+(?:Sydney|NSW|Melbourne|VIC)\s+office\b/i, `${slug} destination office claim`);
    assert.doesNotMatch(main, /\bbased in\s+(?:Sydney|NSW|Melbourne|VIC)\b/i, `${slug} destination base claim`);
  }

  const smithfield = readDist(path.join('adelaide-to-smithfield-nsw-removalists', 'index.html'));
  assert.match(smithfield, /Smithfield NSW/);
  assert.match(smithfield, /not a Smithfield SA or Smithfield Plains/i);
});

test('route pages include the required service, quote, price, guide, and contact links', () => {
  for (const slug of routeSlugs) {
    const html = readDist(path.join(slug, 'index.html'));
    for (const href of [
      '/services/interstate-removals-adelaide/',
      '/moving-quotes-adelaide/',
      '/fixed-price-removalists-adelaide/',
      '/adelaide-moving-guides/interstate-moving-checklist-adelaide/',
      '/contact-us/#quote-form',
    ]) {
      assert.match(html, new RegExp(`href="${escapeRegex(href)}"`), `${slug} missing ${href}`);
    }
  }
});

test('office removals page includes b2b planning terms without unsupported credentials', () => {
  const office = readDist(path.join('office-removals-adelaide', 'index.html'));
  for (const pattern of [
    /downtime/i,
    /after-hours[^.]+subject to availability/i,
    /IT equipment/i,
    /workstation/i,
    /archive|document/i,
    /lift booking|lift bookings/i,
    /labelled unload/i,
    /quote preparation checklist/i,
    /href="\/office-relocation-adelaide\/"/,
    /href="\/moving-quotes-adelaide\/"/,
    /href="\/fixed-price-removalists-adelaide\/"/,
    /href="\/contact-us\/#quote-form"/,
  ]) {
    assert.match(office, pattern);
  }
  assert.doesNotMatch(office, /AFRA accredited|AFRA member|public liability \$|goods-in-transit cover \$|enterprise clients/i);
});

test('priority pages use AEO answer formatting and FAQ schema only follows visible FAQ', () => {
  for (const output of [
    'removalist-cost-adelaide/index.html',
    'moving-quotes-adelaide/index.html',
    'fixed-price-removalists-adelaide/index.html',
    'adelaide-moving-guides/interstate-moving-checklist-adelaide/index.html',
    'adelaide-to-sydney-removalists/index.html',
    'office-removals-adelaide/index.html',
  ]) {
    const html = readDist(output);
    assert.ok(hasQuestionHeadingWithImmediateAnswer(html), `${output} missing AEO answer pattern`);
  }

  for (const htmlFile of walkHtmlFiles(distDir)) {
    const relative = path.relative(distDir, htmlFile).replace(/\\/g, '/');
    const html = readFileSync(htmlFile, 'utf8');
    const hasFaqSchema = schemaTypes(html).has('FAQPage');
    if (hasFaqSchema) {
      assert.match(html, /class="[^"]*\bfaq-item\b/i, `${relative} has FAQ schema without visible FAQ`);
    }
  }
});

test('schema parses and keeps review, taxID, insurance, and AFRA guardrails safe', () => {
  for (const htmlFile of walkHtmlFiles(distDir)) {
    const relative = path.relative(distDir, htmlFile).replace(/\\/g, '/');
    const html = readFileSync(htmlFile, 'utf8');
    const jsonLd = extractJsonLd(html);

    for (const block of jsonLd) {
      const serialized = JSON.stringify(block);
      assert.doesNotMatch(serialized, /AggregateRating|aggregateRating|reviewCount|ratingValue|ReviewRating/i, `unsupported review schema in ${relative}`);
      assert.doesNotMatch(serialized, /public liability\s*\$|goods-in-transit\s*\$|AFRA accredited|AFRA member/i, `unsafe credential schema in ${relative}`);

      for (const node of flattenJsonLdNodes(block)) {
        if (node.taxID) {
          assert.equal(node.taxID, '97954095119', `${relative} contains unexpected taxID`);
        }
        if (node.identifier) {
          assert.doesNotMatch(JSON.stringify(node.identifier), /97\s?954\s?095\s?(?!119)\d+/, `${relative} contains unexpected identifier`);
        }
      }
    }

    assert.doesNotMatch(html, /fully insured|full insurance|AFRA accredited|AFRA member|public liability \$|goods-in-transit cover \$/i, `unsafe visible trust claim in ${relative}`);
  }
});

test('existing SEO validator passes after v7 changes', () => {
  const output = execFileSync(process.execPath, [path.join(root, 'scripts', 'seo-validate.mjs')], {
    cwd: root,
    encoding: 'utf8',
  });
  assert.match(output, /bad pages = 0/);
  assert.match(output, /seo validation passed for \d+ pages/);
});

function readDist(relativePath) {
  return readFileSync(path.join(distDir, relativePath), 'utf8');
}

function extractMain(html = '') {
  return html.match(/<main[\s\S]*?<\/main>/i)?.[0] || html;
}

function hasQuestionHeadingWithImmediateAnswer(html = '') {
  return /<h[23]\b[^>]*>[^<]*\?<\/h[23]>\s*<p\b[^>]*>[^<]+\./i.test(html);
}

function extractJsonLd(html = '') {
  return [...html.matchAll(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/gi)]
    .map((match) => JSON.parse(match[1]));
}

function flattenJsonLdNodes(value) {
  if (!value || typeof value !== 'object') return [];
  if (Array.isArray(value)) return value.flatMap(flattenJsonLdNodes);
  const own = Object.keys(value).length === 1 && value['@id'] ? [] : [value];
  const graph = Array.isArray(value['@graph']) ? value['@graph'].flatMap(flattenJsonLdNodes) : [];
  return [...own, ...graph];
}

function nodeTypes(node) {
  const value = node?.['@type'];
  return Array.isArray(value) ? value : value ? [value] : [];
}

function schemaTypes(html) {
  return new Set(extractJsonLd(html).flatMap(flattenJsonLdNodes).flatMap(nodeTypes));
}

function walkHtmlFiles(dir, results = []) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stats = statSync(full);
    if (stats.isDirectory()) {
      walkHtmlFiles(full, results);
    } else if (entry.endsWith('.html')) {
      results.push(full);
    }
  }
  return results;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
