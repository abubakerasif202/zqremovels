import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { getGeneratedPages, mergePagesByOutput } from '../site-src/data/seo-v4.mjs';

const root = process.cwd();
const distDir = path.join(root, 'site-dist');
const pages = mergePagesByOutput(
  JSON.parse(readFileSync(path.join(root, 'site-src', 'pages.json'), 'utf8')),
  getGeneratedPages(),
);

function readDist(relativePath) {
  return readFileSync(path.join(distDir, relativePath), 'utf8');
}

function walkHtmlFiles(dir, results = []) {
  for (const entry of readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      walkHtmlFiles(fullPath, results);
      continue;
    }

    if (entry.endsWith('.html')) {
      results.push(fullPath);
    }
  }

  return results;
}

function outputToRoute(output) {
  if (output === 'index.html') {
    return '/';
  }

  if (output.endsWith('/index.html')) {
    return `/${output.replace(/\/index\.html$/, '/')}`;
  }

  return `/${output}`;
}

function isNoindexPage(page) {
  return (page.robots || '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .includes('noindex');
}

function isRedirectPage(page) {
  return page.layout === 'redirect';
}

function isUtilityPage(page) {
  return page.output === '404.html' || page.output === 'thank-you.html';
}

function isPreviewPage(page) {
  return page.output === 'premium-moving-concepts/index.html' || page.output.startsWith('premium-moving-concepts/');
}

function isLegacyGuidePage(page) {
  return page.output.startsWith('guides/');
}

function shouldIncludeInSitemap(page) {
  return !isRedirectPage(page) &&
    !isNoindexPage(page) &&
    !isUtilityPage(page) &&
    !isPreviewPage(page) &&
    !isLegacyGuidePage(page) &&
    page.output !== 'privacy-policy/index.html' &&
    page.output !== 'terms-and-conditions/index.html';
}

async function buildSite() {
  const buildUrl = pathToFileURL(path.join(root, 'scripts', 'build-site.mjs')).href;
  await import(`${buildUrl}?searchConsoleFixes=${Date.now()}`);
}

test.before(async () => {
  await buildSite();
});

test('generated sitemap and canonicals stay on the apex host', () => {
  const sitemap = readDist('sitemap-index.xml');
  const homepage = readDist('index.html');
  const interstateHub = readDist(path.join('interstate-removals-adelaide', 'index.html'));
  const robots = readDist('robots.txt');
  const llms = readDist('llms.txt');
  const ai = readDist('ai.txt');

  assert.doesNotMatch(sitemap, /https:\/\/www\.zqremovals\.au\//);
  assert.match(sitemap, /<sitemapindex/);
  assert.match(homepage, /<link rel="canonical" href="https:\/\/zqremovals\.au\/" \/>/);
  assert.match(homepage, /<title>Adelaide Removalists \| Fixed-Price Movers \| ZQ Removals<\/title>/);
  assert.match(
    homepage,
    /<meta name="description" content="Need Adelaide removalists\? ZQ Removals covers Andrews Farm and metro Adelaide with fixed-price quotes and careful furniture handling\." \/>/,
  );
  assert.match(
    interstateHub,
    /<link rel="canonical" href="https:\/\/zqremovals\.au\/interstate-removals-adelaide\/" \/>/,
  );
  assert.match(robots, /Sitemap: https:\/\/zqremovals\.au\/sitemap-index\.xml/);
  assert.match(llms, /Website: https:\/\/zqremovals\.au/);
  assert.match(llms, /Priority money pages:/);
  assert.match(llms, /\[Adelaide Removalists \| 5-Star Local Movers \| ZQ Removals\]\(https:\/\/zqremovals\.au\/removalists-adelaide\/\)/);
  assert.match(llms, /Best pages by task:/);
  assert.match(llms, /\[Quote request: Adelaide Removalists \| 5-Star Local Movers \| ZQ Removals\]\(https:\/\/zqremovals\.au\/removalists-adelaide\/\)/);
  assert.match(llms, /\[Packing help: Packing Services Adelaide \| Professional Packing Help\]\(https:\/\/zqremovals\.au\/packing-services-adelaide\/\)/);
  assert.match(llms, /Best entry pages:/);
  assert.match(ai, /Entity: ZQ Removals/);
  assert.match(ai, /No www host variants\./);
  assert.equal((homepage.match(/<h1\b/gi) || []).length, 1, 'homepage must have exactly one h1');
});

test('sitemap xml files start with a clean xml declaration', () => {
  for (const file of [
    'sitemap.xml',
    'sitemap-index.xml',
    'sitemap-pages.xml',
    'sitemap-services.xml',
    'sitemap-suburbs.xml',
    'sitemap-guides.xml',
    'sitemap-images.xml',
  ]) {
    const xml = readDist(file);
    assert.match(
      xml,
      /^\u003c\?xml version="1\.0" encoding="UTF-8"\?>\n/,
      `missing or malformed XML declaration in ${file}`,
    );
    assert.doesNotMatch(xml, /^\s+\u003c\?xml/, `leading whitespace found in ${file}`);
  }
});

test('generated html does not leak mixed-host seo output', () => {
  for (const htmlFile of walkHtmlFiles(distDir)) {
    const html = readFileSync(htmlFile, 'utf8');
    assert.doesNotMatch(
      html,
      /https:\/\/www\.zqremovals\.au\//,
      `mixed host output found in ${path.relative(distDir, htmlFile)}`,
    );
  }
});

test('sitemap contains only intended indexable routes', () => {
  const sitemapFiles = ['sitemap-pages.xml', 'sitemap-services.xml', 'sitemap-suburbs.xml', 'sitemap-guides.xml'];
  const locations = sitemapFiles
    .flatMap((file) => [...readDist(file).matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]));
  const expected = pages
    .filter((page) => shouldIncludeInSitemap(page))
    .map((page) => `https://zqremovals.au${outputToRoute(page.output)}`);

  assert.deepEqual(new Set(locations), new Set(expected));

  for (const page of pages.filter((page) => !shouldIncludeInSitemap(page))) {
    assert.ok(
      !locations.includes(`https://zqremovals.au${outputToRoute(page.output)}`),
      `unexpected sitemap inclusion for ${page.output}`,
    );
  }
});

test('visible breadcrumbs are rendered on key page types and align with JSON-LD', () => {
  const pagesToCheck = [
    ['index.html', ['aria-label="Breadcrumb"', 'li aria-current="page">Home']],
    [path.join('removalists-adelaide', 'index.html'), ['aria-label="Breadcrumb"', '/">Home</a>', 'Removalists Adelaide']],
    [path.join('removalists-salisbury', 'index.html'), ['aria-label="Breadcrumb"', '/">Home</a>', 'Salisbury']],
    [path.join('adelaide-moving-guides', 'removalists-cost-adelaide', 'index.html'), ['aria-label="Breadcrumb"', 'Adelaide Moving Guides', 'Removalist Cost Adelaide']],
    [path.join('adelaide-to-sydney-removals', 'index.html'), ['aria-label="Breadcrumb"', 'Interstate Removals', 'Adelaide to Sydney Removals']],
  ];

  for (const [output, needles] of pagesToCheck) {
    const html = readDist(output);
    for (const needle of needles) {
      assert.match(html, new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `missing breadcrumb text ${needle} in ${output}`);
    }
  }

  const breadcrumbJsonLdCount = [...walkHtmlFiles(distDir)].reduce((count, htmlFile) => {
    const html = readFileSync(htmlFile, 'utf8');
    return count + (html.match(/"@type": "BreadcrumbList"/g) || []).length;
  }, 0);
  assert.ok(breadcrumbJsonLdCount > 0, 'expected BreadcrumbList JSON-LD to remain present');
});

test('breadcrumb and faq schema do not duplicate within a single page', () => {
  for (const htmlFile of walkHtmlFiles(distDir)) {
    const html = readFileSync(htmlFile, 'utf8');
    const breadcrumbCount = (html.match(/"@type": "BreadcrumbList"/g) || []).length;
    const faqCount = (html.match(/"@type": "FAQPage"/g) || []).length;

    assert.ok(breadcrumbCount <= 1, `duplicate BreadcrumbList schema found in ${path.relative(distDir, htmlFile)}`);
    assert.ok(faqCount <= 1, `duplicate FAQPage schema found in ${path.relative(distDir, htmlFile)}`);
  }
});

test('key titles and descriptions stay within safe SEO length guardrails', () => {
  const keyPages = [
    ['index.html', 60, 160],
    ['removalists-adelaide/index.html', 60, 160],
    ['adelaide-moving-guides/removalists-cost-adelaide/index.html', 60, 160],
    ['removalists-salisbury/index.html', 60, 160],
    ['removalists-glenelg/index.html', 60, 160],
    ['removalists-adelaide-cbd/index.html', 60, 160],
  ];

  for (const [output, maxTitle, maxDescription] of keyPages) {
    const page = pages.find((entry) => entry.output === output);
    assert.ok(page, `missing page metadata for ${output}`);
    assert.ok(page.title.length <= maxTitle, `${output} title is too long: ${page.title.length}`);
    assert.ok(page.description.length <= maxDescription, `${output} description is too long: ${page.description.length}`);
  }
});

test('robots and AI crawler files stay standards-compliant', () => {
  const robots = readDist('robots.txt');
  const llms = readDist('llms.txt');
  const llmsFull = readDist('llms-full.txt');

  assert.match(robots, /^User-agent: \*\r?\nAllow: \/\r?\nSitemap: https:\/\/zqremovals\.au\/sitemap-index\.xml/m);
  assert.doesNotMatch(robots, /^LLM:/m);
  assert.match(llms, /Website: https:\/\/zqremovals\.au/);
  assert.match(llmsFull, /Entity: ZQ Removals/);
});

test('responsive image handling keeps hero images sized and prioritized correctly', () => {
  const homepage = readDist('index.html');
  const heroImg = homepage.match(/<picture>[\s\S]*?<img[\s\S]*?<\/picture>/i)?.[0] || '';

  assert.match(heroImg, /srcset="[^"]*\/media\/responsive\/home-local-hero-branded-480w\.webp 480w/i);
  assert.match(heroImg, /sizes="[^"]*"/i);
  assert.match(heroImg, /width="768"/i);
  assert.match(heroImg, /height="406"/i);
  assert.match(heroImg, /loading="eager"/i);
  assert.match(heroImg, /fetchpriority="high"/i);
  assert.match(homepage, /<img[^>]+loading="lazy"[^>]+src="\/media\/zq-service-premium\.webp"/i);
});

test('vercel redirects cover legacy html aliases for crawlable pages and route families', () => {
  const vercelConfig = JSON.parse(readFileSync(path.join(root, 'vercel.json'), 'utf8'));
  const redirects = new Map(
    vercelConfig.redirects.map(({ source, destination }) => [source, destination]),
  );

  for (const [source, destination] of [
    ['/about.html', '/about/'],
    ['/contact-us.html', '/contact-us/'],
    ['/house-removals-adelaide.html', '/house-removals-adelaide/'],
    ['/interstate-removals-adelaide.html', '/interstate-removals-adelaide/'],
    ['/office-removals-adelaide.html', '/office-removals-adelaide/'],
    ['/packing-services-adelaide.html', '/packing-services-adelaide/'],
    ['/furniture-removalists-adelaide.html', '/furniture-removalists-adelaide/'],
    ['/removalists-adelaide.html', '/removalists-adelaide/'],
  ]) {
    assert.equal(redirects.get(source), destination);
  }

  assert.equal(
    redirects.get('/adelaide-moving-guides/:slug.html'),
    '/adelaide-moving-guides/:slug/',
  );
  assert.equal(redirects.get('/adelaide-to-:slug.html'), '/adelaide-to-:slug/');
  assert.equal(redirects.get('/removalists-:slug.html'), '/removalists-:slug/');
});

test('search console not-found validation URLs have direct legacy redirects', () => {
  const vercelConfig = JSON.parse(readFileSync(path.join(root, 'vercel.json'), 'utf8'));
  const redirects = new Map(
    vercelConfig.redirects.map(({ source, destination }) => [source, destination]),
  );

  for (const [source, destination] of [
    ['/adelaide-cbd', '/removalists-adelaide-cbd/'],
    ['/adelaide-cbd/', '/removalists-adelaide-cbd/'],
    ['/adelaide-cbd.html', '/removalists-adelaide-cbd/'],
    ['/adelaide-cbd/index.html', '/removalists-adelaide-cbd/'],
    ['/privacy', '/privacy-policy/'],
    ['/privacy/', '/privacy-policy/'],
    ['/privacy.html', '/privacy-policy/'],
    ['/privacy/index.html', '/privacy-policy/'],
    ['/privacy-policy.html', '/privacy-policy/'],
    ['/terms', '/terms-and-conditions/'],
    ['/terms/', '/terms-and-conditions/'],
    ['/terms.html', '/terms-and-conditions/'],
    ['/terms/index.html', '/terms-and-conditions/'],
    ['/terms-and-conditions.html', '/terms-and-conditions/'],
  ]) {
    assert.equal(redirects.get(source), destination, `${source} should redirect directly`);
  }

  const catchAllIndexPosition = vercelConfig.redirects.findIndex(({ source }) => source === '/:path*/index.html');
  for (const source of [
    '/adelaide-cbd/index.html',
    '/interstate-removalists-adelaide/index.html',
    '/local-removals-adelaide/index.html',
    '/privacy/index.html',
    '/removalists-semore/index.html',
    '/terms/index.html',
  ]) {
    const position = vercelConfig.redirects.findIndex((redirect) => redirect.source === source);
    assert.ok(position >= 0, `${source} redirect is missing`);
    assert.ok(
      position < catchAllIndexPosition,
      `${source} should be matched before /:path*/index.html`,
    );
  }
});

test('search console not-found validation aliases have static noindex fallback pages', () => {
  const sitemap = [
    'sitemap-pages.xml',
    'sitemap-services.xml',
    'sitemap-suburbs.xml',
    'sitemap-guides.xml',
  ].map((file) => readDist(file)).join('\n');

  for (const [output, canonical, refresh] of [
    ['adelaide-cbd.html', 'https://zqremovals.au/removalists-adelaide-cbd/', '0; url=/removalists-adelaide-cbd/'],
    ['privacy.html', 'https://zqremovals.au/privacy-policy/', '0; url=/privacy-policy/'],
    [path.join('privacy', 'index.html'), 'https://zqremovals.au/privacy-policy/', '0; url=/privacy-policy/'],
    ['terms.html', 'https://zqremovals.au/terms-and-conditions/', '0; url=/terms-and-conditions/'],
    [path.join('terms', 'index.html'), 'https://zqremovals.au/terms-and-conditions/', '0; url=/terms-and-conditions/'],
  ]) {
    const html = readDist(output);
    assert.match(html, /<meta name="robots" content="noindex,nofollow" \/>/);
    assert.match(html, new RegExp(`<link rel="canonical" href="${canonical.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}" \\/>`));
    assert.match(html, new RegExp(`<meta http-equiv="refresh" content="${refresh.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}" \\/>`));
    assert.doesNotMatch(sitemap, new RegExp(output.replace(/\\/g, '/').replace(/index\\.html$/, '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('generated pages do not contain broken internal links', () => {
  for (const htmlFile of walkHtmlFiles(distDir)) {
    const relativePath = path.relative(distDir, htmlFile).replace(/\\/g, '/');
    const html = readFileSync(htmlFile, 'utf8');
    for (const match of html.matchAll(/href="([^"]+)"/g)) {
      const href = match[1];
      if (!href.startsWith('/') || href.startsWith('//')) {
        continue;
      }

      const cleanHref = href.split('#')[0].split('?')[0];
      if (!cleanHref || cleanHref.startsWith('/api/')) {
        continue;
      }

      const targetCandidates = [];
      if (cleanHref === '/') {
        targetCandidates.push(path.join(distDir, 'index.html'));
      } else if (cleanHref.endsWith('/')) {
        targetCandidates.push(path.join(distDir, cleanHref.slice(1), 'index.html'));
      } else {
        targetCandidates.push(
          path.join(distDir, cleanHref.slice(1)),
          path.join(distDir, cleanHref.slice(1), 'index.html'),
        );
        if (!cleanHref.endsWith('.html')) {
          targetCandidates.push(path.join(distDir, `${cleanHref.slice(1)}.html`));
        }
      }

      assert.ok(
        targetCandidates.some((targetPath) => statSync(targetPath, { throwIfNoEntry: false })),
        `broken internal link in ${relativePath}: ${href}`,
      );
    }
  }
});

test('generated html keeps internal links root-absolute and avoids relative crawl traps', () => {
  for (const htmlFile of walkHtmlFiles(distDir)) {
    const html = readFileSync(htmlFile, 'utf8');
    for (const match of html.matchAll(/href="([^"]+)"/g)) {
      const href = match[1];
      if (
        href.startsWith('http://') ||
        href.startsWith('https://') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        href.startsWith('javascript:') ||
        href.startsWith('data:') ||
        href.startsWith('vbscript:') ||
        href.startsWith('#')
      ) {
        continue;
      }

      assert.match(
        href,
        /^\//,
        `non-root-absolute internal href found in ${path.relative(distDir, htmlFile)}: ${href}`,
      );
      assert.ok(
        !href.startsWith('//'),
        `protocol-relative href found in ${path.relative(distDir, htmlFile)}: ${href}`,
      );
    }
  }
});

test('generated html no longer serves large Gemini PNG hero assets', () => {
  for (const htmlFile of walkHtmlFiles(distDir)) {
    const html = readFileSync(htmlFile, 'utf8');
    assert.doesNotMatch(
      html,
      /\/media\/Gemini_Generated_Image_[^"]+\.png/,
      `legacy Gemini PNG reference found in ${path.relative(distDir, htmlFile)}`,
    );
  }
});

test('indexable pages expose complete unique metadata and one matching canonical', () => {
  const seenTitles = new Map();
  const seenDescriptions = new Map();

  for (const page of pages.filter((candidate) => shouldIncludeInSitemap(candidate))) {
    const html = readDist(page.output);
    const title = html.match(/<title>(.*?)<\/title>/i)?.[1] || '';
    const description = html.match(/<meta name="description" content="([^"]+)"/i)?.[1] || '';
    const canonicals = [...html.matchAll(/<link rel="canonical" href="([^"]+)"/gi)].map((match) => match[1]);
    const h1s = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map((match) => match[1].replace(/<[^>]+>/g, '').trim());
    const h2Count = [...html.matchAll(/<h2\b/gi)].length;

    assert.ok(title, `missing title for ${page.output}`);
    assert.ok(description, `missing meta description for ${page.output}`);
    assert.deepEqual(canonicals, [page.canonical], `canonical mismatch for ${page.output}`);
    assert.equal(h1s.length, 1, `expected exactly one h1 for ${page.output}`);
    assert.ok(h1s.every(Boolean), `empty h1 for ${page.output}`);
    assert.ok(h2Count >= 1, `missing h2 structure for ${page.output}`);
    assert.match(html, /<meta property="og:title" content="[^"]+"/i, `missing og:title for ${page.output}`);
    assert.match(html, /<meta property="og:description" content="[^"]+"/i, `missing og:description for ${page.output}`);
    assert.match(html, /<meta property="og:url" content="https:\/\/zqremovals\.au\/[^"]*"/i, `missing og:url for ${page.output}`);
    assert.match(html, /<meta property="og:image" content="https:\/\/zqremovals\.au\/[^"]+"/i, `missing apex og:image for ${page.output}`);
    assert.match(html, /<meta name="twitter:card" content="summary_large_image"/i, `missing twitter card for ${page.output}`);
    assert.match(html, /<meta name="twitter:title" content="[^"]+"/i, `missing twitter:title for ${page.output}`);
    assert.match(html, /<meta name="twitter:description" content="[^"]+"/i, `missing twitter:description for ${page.output}`);
    assert.match(html, /<meta name="twitter:image" content="https:\/\/zqremovals\.au\/[^"]+"/i, `missing twitter:image for ${page.output}`);

    assert.ok(!seenTitles.has(title), `duplicate title: ${title}`);
    assert.ok(!seenDescriptions.has(description), `duplicate description: ${description}`);
    seenTitles.set(title, page.output);
    seenDescriptions.set(description, page.output);
  }
});

test('production output avoids localhost and vercel deployment urls', () => {
  const forbidden = /(?:localhost|127\.0\.0\.1|\.vercel\.app|vercel\.app)/i;
  for (const file of [
    'sitemap.xml',
    'sitemap-index.xml',
    'sitemap-pages.xml',
    'sitemap-services.xml',
    'sitemap-suburbs.xml',
    'sitemap-guides.xml',
    'sitemap-images.xml',
    'robots.txt',
  ]) {
    assert.doesNotMatch(readDist(file), forbidden, `non-production URL leaked in ${file}`);
  }

  for (const htmlFile of walkHtmlFiles(distDir)) {
    const html = readFileSync(htmlFile, 'utf8');
    assert.doesNotMatch(html, forbidden, `non-production URL leaked in ${path.relative(distDir, htmlFile)}`);
  }
});

test('json-ld is valid, host-consistent, and uses only supported business facts', () => {
  for (const htmlFile of walkHtmlFiles(distDir)) {
    const relativePath = path.relative(distDir, htmlFile).replace(/\\/g, '/');
    const html = readFileSync(htmlFile, 'utf8');
    for (const jsonLd of extractJsonLd(html)) {
      assert.doesNotMatch(JSON.stringify(jsonLd), /https:\/\/www\.zqremovals\.au|localhost|\.vercel\.app/i, `bad schema URL in ${relativePath}`);
      assert.doesNotMatch(JSON.stringify(jsonLd), /AggregateRating|aggregateRating|reviewCount|ratingValue/i, `unsupported review schema in ${relativePath}`);

      for (const node of flattenJsonLdNodes(jsonLd)) {
        const types = Array.isArray(node['@type']) ? node['@type'] : [node['@type']].filter(Boolean);
        if (types.includes('MovingCompany')) {
          assert.equal(node.name, 'ZQ Removals', `MovingCompany name mismatch in ${relativePath}`);
          assert.equal(node.url, 'https://zqremovals.au/', `MovingCompany URL mismatch in ${relativePath}`);
          assert.equal(normalizeTelephone(node.telephone), '+61433819989', `MovingCompany telephone mismatch in ${relativePath}`);
          assert.deepEqual(
            node.sameAs,
            ['https://share.google/Y04mpt9RTflWP3iRl', 'https://facebook.com/zqremovals'],
            `MovingCompany sameAs mismatch in ${relativePath}`,
          );
          assert.equal(node.taxID, '97954095119', `MovingCompany ABN mismatch in ${relativePath}`);
          assert.deepEqual(
            node.identifier,
            { '@type': 'PropertyValue', name: 'ABN', value: '97954095119' },
            `MovingCompany identifier mismatch in ${relativePath}`,
          );
          assert.equal(node.address?.['@type'], 'PostalAddress', `MovingCompany address type mismatch in ${relativePath}`);
          assert.equal(node.address?.addressLocality, 'Andrews Farm', `MovingCompany address locality mismatch in ${relativePath}`);
          assert.equal(node.address?.addressRegion, 'SA', `MovingCompany address region mismatch in ${relativePath}`);
          assert.equal(node.address?.postalCode, '5114', `MovingCompany address postal code mismatch in ${relativePath}`);
          assert.equal(node.address?.addressCountry, 'AU', `MovingCompany address country mismatch in ${relativePath}`);
          assert.ok(schemaValueNames(node.areaServed).includes('Adelaide'), `MovingCompany areaServed missing Adelaide in ${relativePath}`);
          assert.equal(node.openingHours, undefined, `unverified openingHours published in ${relativePath}`);
          assert.equal(node.openingHoursSpecification, undefined, `unverified openingHoursSpecification published in ${relativePath}`);
          if (node.founder !== undefined) {
            assert.equal(node.founder?.['@type'], 'Person', `founder must be a Person in ${relativePath}`);
            assert.equal(node.founder?.name, 'Qasim Ali', `founder mismatch in ${relativePath}`);
          }
        }
      }
    }
  }
});

test('required schema types exist on local, service, suburb, guide, FAQ, and breadcrumb pages', () => {
  const cases = [
    ['index.html', ['MovingCompany', 'WebPage']],
    [path.join('house-removals-adelaide', 'index.html'), ['MovingCompany', 'Service', 'FAQPage', 'BreadcrumbList']],
    [path.join('office-removals-adelaide', 'index.html'), ['MovingCompany', 'Service']],
    [path.join('interstate-removals-adelaide', 'index.html'), ['MovingCompany', 'Service']],
    [path.join('removalists-glenelg', 'index.html'), ['MovingCompany', 'Service', 'FAQPage', 'BreadcrumbList']],
    [path.join('removalists-salisbury', 'index.html'), ['MovingCompany', 'Service', 'FAQPage', 'BreadcrumbList']],
    [path.join('adelaide-moving-guides', 'interstate-moving-checklist-adelaide', 'index.html'), ['Article', 'FAQPage', 'BreadcrumbList']],
    [path.join('adelaide-moving-guides', 'office-relocation-checklist-adelaide', 'index.html'), ['Article', 'FAQPage', 'BreadcrumbList']],
  ];

  for (const [file, requiredTypes] of cases) {
    const html = readDist(file);
    const foundTypes = new Set(extractJsonLd(html).flatMap((jsonLd) => flattenJsonLdNodes(jsonLd)).flatMap((node) => Array.isArray(node['@type']) ? node['@type'] : [node['@type']].filter(Boolean)));
    for (const type of requiredTypes) {
      assert.ok(foundTypes.has(type), `${file} missing ${type} schema`);
    }
  }
});

test('guide article schema preserves dates and the commercial CTA stays unique', () => {
  const articleOutput = path.join('adelaide-moving-guides', 'moving-cost-adelaide-2026', 'index.html');
  const sourceOutput = articleOutput.replace(/\\/g, '/');
  const articleHtml = readDist(articleOutput);
  const hubHtml = readDist(path.join('adelaide-moving-guides', 'index.html'));
  const generalGuideHtml = readDist(path.join('adelaide-moving-guides', 'how-to-choose-removalists-adelaide', 'index.html'));
  const sourcePage = pages.find((page) => page.output === sourceOutput);

  assert.ok(sourcePage, `missing source metadata for ${articleOutput}`);
  assert.equal((articleHtml.match(/data-commercial-cta="guide-hub"/g) || []).length, 1, `${articleOutput} should include one commercial CTA`);
  assert.equal((articleHtml.match(/id="guide-next-step"/g) || []).length, 1, `${articleOutput} should keep a single guide-next-step anchor`);
  assert.equal((hubHtml.match(/data-commercial-cta="guide-hub"/g) || []).length, 0, 'guide hub must not receive the commercial CTA');
  assert.equal((generalGuideHtml.match(/data-commercial-cta="guide-hub"/g) || []).length, 1, 'guides article should include the commercial CTA');

  const articleBlocks = extractJsonLd(articleHtml);
  const articleNodes = articleBlocks.flatMap((jsonLd) => flattenJsonLdNodes(jsonLd));
  const faqSchema = articleNodes.find((node) => nodeTypes(node).includes('FAQPage'));
  assert.ok(faqSchema, `missing FAQPage node in ${articleOutput}`);

  const faqBlocks = [...articleHtml.matchAll(/<article\b[^>]*class="[^"]*\bfaq-item\b[^"]*"[\s\S]*?<\/article>/gi)].map((match) => match[0]);
  assert.equal(faqBlocks.length, faqSchema.mainEntity.length, `${articleOutput} visible FAQ count should match FAQPage JSON-LD`);
  for (const block of faqBlocks) {
    assert.match(block, /<article\b[^>]*itemscope[^>]*itemtype="https:\/\/schema\.org\/Question"/i, 'FAQ item missing Question microdata');
    assert.match(block, /<h3\b[^>]*itemprop="name"/i, 'FAQ question missing name microdata');
    assert.match(block, /<div\b[^>]*itemprop="acceptedAnswer"[^>]*itemscope[^>]*itemtype="https:\/\/schema\.org\/Answer"/i, 'FAQ answer missing Answer microdata');
    assert.match(block, /<div\b[^>]*itemprop="text"\s*>\s*<p>/i, 'FAQ answer text nesting is malformed');
    assert.doesNotMatch(block, /<p\b[^>]*itemprop="text"/i, 'FAQ answer paragraph should not carry itemprop="text" directly');
    assert.equal((block.match(/itemprop="text"/g) || []).length, 1, 'FAQ answer text itemprop should appear once per block');
  }

  const builtArticle = articleNodes.find((node) => nodeTypes(node).some((type) => type === 'Article' || type === 'BlogPosting'));
  assert.ok(builtArticle, `missing Article/BlogPosting node in ${articleOutput}`);

  const sourceArticle = sourcePage.jsonLd
    .map((block) => JSON.parse(block))
    .flatMap((jsonLd) => flattenJsonLdNodes(jsonLd))
    .find((node) => nodeTypes(node).some((type) => type === 'Article' || type === 'BlogPosting'));

  assert.ok(sourceArticle, `missing source Article/BlogPosting node for ${articleOutput}`);
  assert.deepEqual(builtArticle['@type'], sourceArticle['@type'], 'Article @type must stay normalized');
  assert.equal(builtArticle.headline, sourceArticle.headline, 'Article headline changed unexpectedly');
  assert.equal(builtArticle.description, sourceArticle.description, 'Article description changed unexpectedly');
  assert.deepEqual(builtArticle.mainEntityOfPage, sourceArticle.mainEntityOfPage, 'Article mainEntityOfPage changed unexpectedly');
  assert.deepEqual(builtArticle.author, sourceArticle.author, 'Article author changed unexpectedly');
  assert.deepEqual(builtArticle.publisher, sourceArticle.publisher, 'Article publisher changed unexpectedly');
  assert.equal(builtArticle.datePublished, sourceArticle.datePublished, 'Article datePublished changed unexpectedly');
  assert.equal(builtArticle.dateModified, sourceArticle.dateModified, 'Article dateModified changed unexpectedly');
  if (sourceArticle.image) {
    assert.deepEqual(builtArticle.image, sourceArticle.image, 'Article image changed unexpectedly');
  }
});

test('commercial CTA only appears on the expected guide article pages', () => {
  const actualPages = pages.filter((page) => readDist(page.output).includes('data-commercial-cta="guide-hub"'));

  assert.ok(actualPages.length > 0, 'expected guide articles should render the commercial CTA');
  for (const page of actualPages) {
    const isGuideArticle =
      (page.output.startsWith('adelaide-moving-guides/') && page.output !== 'adelaide-moving-guides/index.html') ||
      (page.output.startsWith('guides/') && page.output !== 'guides/index.html');
    const robots = (page.robots || '').toLowerCase();

    assert.ok(isGuideArticle, `${page.output} should be a guide article`);
    assert.notEqual(page.layout, 'redirect', `${page.output} must not be a redirect`);
    assert.ok(!robots.includes('noindex'), `${page.output} must stay indexable`);
    assert.notEqual(page.output, '404.html', `${page.output} must not be a utility page`);
    assert.notEqual(page.output, 'thank-you.html', `${page.output} must not be a utility page`);
    assert.notEqual(page.output, 'thank-you/index.html', `${page.output} must not be a utility page`);
  }
});

test('key SEO pages keep enough body-level internal links for cluster discovery', () => {
  for (const output of [
    'index.html',
    'removalists-adelaide/index.html',
    'removalists-southern-adelaide/index.html',
    'removalists-northern-adelaide/index.html',
    'house-removals-adelaide/index.html',
    'furniture-removalists-adelaide/index.html',
    'office-removals-adelaide/index.html',
    'interstate-removals-adelaide/index.html',
    'adelaide-moving-guides/index.html',
  ]) {
    const html = readDist(output);
    const main = html.match(/<main\b[\s\S]*?<\/main>/i)?.[0] || html;
    const targets = new Set([...main.matchAll(/href="(\/[^"#?]+\/?)"/g)].map((match) => match[1]).filter((href) => href !== '/'));
    assert.ok(targets.size >= 8, `${output} has only ${targets.size} body internal links`);
  }
});

function extractJsonLd(html) {
  return [...html.matchAll(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/gi)].map((match) => {
    assert.doesNotThrow(() => JSON.parse(match[1]), 'invalid JSON-LD block');
    return JSON.parse(match[1]);
  });
}

function flattenJsonLdNodes(value) {
  if (!value || typeof value !== 'object') {
    return [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((entry) => flattenJsonLdNodes(entry));
  }

  const nodes = [value];
  if (Array.isArray(value['@graph'])) {
    nodes.push(...value['@graph'].flatMap((entry) => flattenJsonLdNodes(entry)));
  }

  return nodes;
}

function nodeTypes(node) {
  return Array.isArray(node?.['@type']) ? node['@type'] : [node?.['@type']].filter(Boolean);
}

function schemaValueNames(value) {
  const items = Array.isArray(value) ? value : [value];
  return items
    .filter(Boolean)
    .map((item) => (typeof item === 'string' ? item : item?.name || ''))
    .filter(Boolean);
}

function normalizeTelephone(value = '') {
  return String(value).replace(/\s+/g, '');
}

test('priority Adelaide suburb pages are substantial and keep service, nearby, FAQ, and CTA paths', () => {
  const suburbSlugs = [
    'glenelg',
    'norwood',
    'prospect',
    'salisbury',
    'marion',
    'mawson-lakes',
    'unley',
    'port-adelaide',
    'modbury',
    'henley-beach',
    'semaphore',
    'brighton',
    'blackwood',
    'burnside',
    'gawler',
    'seaford',
    'noarlunga',
    'morphett-vale',
    'west-lakes',
    'grange',
    'findon',
    'woodville',
    'golden-grove',
    'mount-barker',
    'adelaide-cbd',
    'north-adelaide',
    'goodwood',
    'magill',
    'campbelltown',
    'athelstone',
    'parafield-gardens',
    'pennington',
    'hove',
    'seacliff',
    'christies-beach',
    'port-noarlunga',
    'oaklands-park',
    'edwardstown',
    'melrose-park',
    'fulham',
    'kidman-park',
    'largs-bay',
    'croydon',
    'kilburn',
    'walkerville',
    'clearview',
    'klemzig',
    'mitcham',
    'plympton',
    'tea-tree-gully',
  ];

  for (const slug of suburbSlugs) {
    const html = readDist(path.join(`removalists-${slug}`, 'index.html'));
    const main = extractMain(html);
    const links = extractRootLinks(main);

    const wordCount = countWords(main);
    assert.ok(wordCount >= 900 && wordCount <= 1700, `${slug} suburb page outside 900-1700 words: ${wordCount}`);
    assert.match(main, /data-generated-module="local-insights"/, `${slug} missing local insights`);
    assert.match(main, /data-generated-module="trust"/, `${slug} missing trust section`);
    assert.ok((main.match(/class="faq-item/g) || []).length >= 5, `${slug} missing FAQ depth`);
    assert.ok(links.filter((href) => href.includes('-removals-adelaide') || href.includes('furniture-removalists-adelaide') || href.includes('packing-services-adelaide') || href.includes('interstate-removals-adelaide')).length >= 3, `${slug} missing service links`);
    assert.ok(links.filter((href) => href.startsWith('/removalists-') && !href.includes(slug)).length >= 3, `${slug} missing nearby suburb links`);
    assert.ok(links.includes('/contact-us/#quote-form') || main.includes('tel:+61433819989'), `${slug} missing quote/call CTA`);
  }
});

test('expanded Adelaide moving guide cluster has 30 plus posts with service links and FAQ support', () => {
  const guideRoot = path.join(distDir, 'adelaide-moving-guides');
  const guideDirs = readdirSync(guideRoot).filter((entry) =>
    statSync(path.join(guideRoot, entry), { throwIfNoEntry: false })?.isDirectory() &&
    statSync(path.join(guideRoot, entry, 'index.html'), { throwIfNoEntry: false }),
  );
  const requiredServiceLinks = [
    '/house-removals-adelaide/',
    '/furniture-removalists-adelaide/',
    '/office-removals-adelaide/',
    '/interstate-removals-adelaide/',
    '/packing-services-adelaide/',
  ];

  assert.ok(guideDirs.length >= 30, `expected at least 30 guide posts, found ${guideDirs.length}`);

  for (const slug of [
    'removalist-cost-breakdown-adelaide',
    'how-much-do-movers-cost-adelaide',
    'cheap-vs-professional-removalists-adelaide',
    'hourly-vs-fixed-price-movers-adelaide',
    'moving-house-checklist-adelaide',
    'last-minute-movers-adelaide-guide',
    'moving-with-stairs-adelaide',
    'office-relocation-checklist-adelaide-guide',
  ]) {
    const html = readDist(path.join('adelaide-moving-guides', slug, 'index.html'));
    const main = extractMain(html);
    const links = extractRootLinks(main);

    assert.ok(countWords(main) >= 800, `${slug} guide is too thin`);
    assert.ok(requiredServiceLinks.some((href) => links.includes(href)), `${slug} missing service link`);
    assert.ok((main.match(/class="faq-item/g) || []).length >= 5, `${slug} missing FAQ support`);
  }
});

test('core money pages include cost breakdowns, trust upgrades, suburb links, and eight FAQs', () => {
  for (const output of [
    'house-removals-adelaide/index.html',
    'furniture-removalists-adelaide/index.html',
    'office-removals-adelaide/index.html',
    'interstate-removals-adelaide/index.html',
  ]) {
    const html = readDist(output);
    const main = extractMain(html);
    const links = extractRootLinks(main);

    assert.ok(countWords(main) >= 1500 && countWords(main) <= 2500, `${output} outside money-page word range`);
    assert.match(main, /data-service-money-upgrade=/, `${output} missing cost breakdown upgrade`);
    assert.match(main, /data-service-trust-upgrade=/, `${output} missing trust upgrade`);
    assert.ok(links.filter((href) => href.startsWith('/removalists-')).length >= 6, `${output} missing suburb links`);
    assert.ok((main.match(/class="faq-item/g) || []).length >= 8, `${output} missing FAQ depth`);
  }
});

test('conversion prompts keep mobile call, above-fold quote access, and qualified urgency copy', () => {
  const template = readFileSync(path.join(root, 'site-src', 'templates', 'standard.html'), 'utf8');
  const homepage = readDist('index.html');
  const hero = homepage.match(/<section class="hero-shell[\s\S]*?<\/section>/i)?.[0] || '';

  assert.match(template, /sticky-mobile-cta/);
  assert.match(template, /href="tel:\+61433819989"[^>]*>Call 0433 819 989<\/a>/);
  assert.match(hero, /hero-quote-form/);
  assert.match(hero, /Booking subject to availability/i);
  assert.match(hero, /Same-day bookings are assessed/i);
});

test('v6 homepage targets premium Adelaide removalists and above-fold CTAs', () => {
  const homepage = readDist('index.html');
  const hero = homepage.match(/<section class="hero-shell[\s\S]*?<\/section>/i)?.[0] || '';

  assert.match(homepage, /<title>Adelaide Removalists \| Fixed-Price Movers \| ZQ Removals<\/title>/);
  assert.match(homepage, /<meta name="description" content="Need Adelaide removalists\? ZQ Removals covers Andrews Farm and metro Adelaide with fixed-price quotes and careful furniture handling\."/i);
  assert.match(hero, /<h1[^>]*>Adelaide Removalists for fast, careful local moves\.<\/h1>/);
  assert.match(hero, /Call <a href="tel:\+61433819989"[^>]*>0433 819 989<\/a> for a quick quote review\./i);
  assert.match(hero, /href="\/contact-us\/#quote-form"[^>]*>Get Free Quote<\/a>/);
  assert.match(hero, /Same Day &amp; Local Moves|Same Day & Local Moves/);
  assert.match(hero, /class="rating-stars"/i);
  assert.match(hero, /class="rating-star"/i);
  for (const phrase of ['Local Movers', 'Fast Quotes', 'Careful Handling', 'Affordable Rates', '5.0\/5 on Google', '38 verified reviews']) {
    assert.match(hero, new RegExp(phrase, 'i'));
  }
  for (const href of [
    '/house-removals-adelaide/',
    '/furniture-removalists-adelaide/',
    '/office-removals-adelaide/',
    '/apartment-removalists-adelaide/',
    '/removalists-andrews-farm/',
  ]) {
    assert.match(homepage, new RegExp(`href="${href.replace(/\//g, '\\/')}"`));
  }
});

test('v6 service pages carry CTR titles, related services, suburb links, FAQ and CTA', () => {
  const cases = [
    ['furniture-removalists-adelaide/index.html', /Furniture Removalists Adelaide \| Careful Furniture Movers/i],
    ['house-removals-adelaide/index.html', /House Removalists Adelaide \| Premium Home Moving Services/i],
    ['office-removals-adelaide/index.html', /Office Removalists Adelaide \| Business Relocation Services/i],
    ['apartment-removalists-adelaide/index.html', /Apartment Removalists Adelaide/i],
  ];

  for (const [output, titlePattern] of cases) {
    const html = readDist(output);
    const main = extractMain(html);
    const links = extractRootLinks(main);

    assert.match(html, titlePattern, `${output} missing V6 CTR title`);
    assert.match(html, /<meta name="description" content="[^"]{80,}/i, `${output} missing strong meta description`);
    assert.match(main, /<h1\b/i, `${output} missing H1`);
    assert.match(main, /data-service-related-upgrade=|data-generated-module="related-services"|Related services/i, `${output} missing related services`);
    assert.ok(links.filter((href) => href.startsWith('/removalists-')).length >= 5, `${output} missing nearby suburb links`);
    assert.ok((main.match(/class="faq-item/g) || []).length >= 2, `${output} missing FAQ block`);
    assert.match(main, /href="\/contact-us\/#quote-form"|href="tel:\+61433819989"/, `${output} missing CTA`);
  }
});

test('v6 generated suburb pages include near-me wording, five nearby links, services and FAQ answers', () => {
  for (const slug of ['andrews-farm', 'glenelg', 'marion', 'salisbury', 'mawson-lakes']) {
    const html = readDist(path.join(`removalists-${slug}`, 'index.html'));
    const main = extractMain(html);
    const suburbName = slug.split('-').map((part) => part[0].toUpperCase() + part.slice(1)).join(' ');
    const links = extractRootLinks(main);

    assert.match(main, new RegExp(`${suburbName} moves`, 'i'), `${slug} missing suburb move wording`);
    assert.match(main, /fixed-price quote/i, `${slug} missing fixed-price quote wording`);
    assert.match(main, /access|parking|stairs|lifts|carry distance/i, `${slug} missing access wording`);
    assert.ok(links.filter((href) => href.startsWith('/removalists-') && !href.includes(slug)).length >= 5, `${slug} missing five nearby suburb links`);
    assert.ok(links.filter((href) => ['/house-removals-adelaide/', '/furniture-removalists-adelaide/', '/office-removals-adelaide/', '/packing-services-adelaide/', '/interstate-removals-adelaide/'].includes(href)).length >= 3, `${slug} missing related service links`);
    assert.match(main, new RegExp(`Do you service ${suburbName}\\?`, 'i'), `${slug} missing service FAQ`);
    assert.match(main, new RegExp(`Can you move furniture in ${suburbName}\\?`, 'i'), `${slug} missing furniture FAQ`);
    assert.match(main, /same-day|urgent|last-minute/i, `${slug} missing urgency FAQ`);
    assert.match(main, new RegExp(`quote for ${suburbName}`, 'i'), `${slug} missing quote FAQ`);
  }
});

test('route hub, guide hub, and suburb service pages keep orphaned pages linked', () => {
  const removalistsHub = readDist('removalists-adelaide/index.html');
  const guideHub = readDist(path.join('adelaide-moving-guides', 'index.html'));
  const cbdSuburb = readDist(path.join('removalists-adelaide-cbd', 'index.html'));

  const routeHrefs = [
    '/moving-from-adelaide-cbd-to-glenelg/',
    '/moving-from-adelaide-cbd-to-marion/',
    '/moving-from-adelaide-cbd-to-salisbury/',
    '/moving-from-adelaide-cbd-to-norwood/',
    '/moving-from-adelaide-cbd-to-mawson-lakes/',
    '/moving-from-glenelg-to-marion/',
    '/moving-from-glenelg-to-henley-beach/',
    '/moving-from-marion-to-noarlunga/',
    '/moving-from-salisbury-to-mawson-lakes/',
    '/moving-from-norwood-to-burnside/',
    '/moving-from-prospect-to-mawson-lakes/',
    '/moving-from-unley-to-mitcham/',
    '/moving-from-brighton-to-glenelg/',
    '/moving-from-modbury-to-salisbury/',
    '/moving-from-port-adelaide-to-west-lakes/',
    '/moving-from-elizabeth-to-gawler/',
  ];

  for (const href of routeHrefs) {
    assert.match(removalistsHub, new RegExp(`href="${href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`), href);
  }

  for (const href of [
    '/fixed-price-vs-hourly-removalists-adelaide/',
    '/professional-packers-vs-diy-packing-adelaide/',
    '/interstate-removalists-vs-backloading-adelaide/',
  ]) {
    assert.match(guideHub, new RegExp(`href="${href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`), href);
  }

  for (const href of [
    '/office-removals-adelaide-cbd/',
    '/packing-services-adelaide-cbd/',
    '/apartment-removalists-adelaide-cbd/',
  ]) {
    assert.match(cbdSuburb, new RegExp(`href="${href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`), href);
  }
});

test('v6 colour contrast guard prevents known invisible text pairings', () => {
  const css = readDist('premium-site.min.css');

  assert.match(css, /trust-item-bg-service[^}]*color:var\(--text-on-light\)/i);
  assert.match(css, /route-card-bg-service[^}]*color:var\(--text-on-light\)/i);
  assert.match(css, /section-soft \.faq-list-premium \.faq-question[^}]*color:var\(--text-on-light\)/i);
  assert.doesNotMatch(css, /trust-item-bg-service[\s\S]{0,240}color:var\(--text-on-dark\)/i);
  assert.doesNotMatch(css, /section-soft \.faq-list-premium \.faq-question[\s\S]{0,120}color:var\(--text-on-dark\)/i);
});

function extractMain(html) {
  return html.match(/<main\b[\s\S]*?<\/main>/i)?.[0] || html;
}

function extractRootLinks(html) {
  return [...html.matchAll(/href="(\/[^"]*)"/g)].map((match) => match[1]);
}

function countWords(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[^;]+;/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}
