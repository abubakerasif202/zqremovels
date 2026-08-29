import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const distDir = path.join(root, 'site-dist');

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

async function buildSite() {
  const buildUrl = pathToFileURL(path.join(root, 'scripts', 'build-site.mjs')).href;
  await import(`${buildUrl}?seoPass=${Date.now()}`);
}

test.before(async () => {
  await buildSite();
});

test('homepage targets Adelaide removalists with the approved Open Design conversion structure', () => {
  const homepage = readDist('index.html');

  assert.match(
    homepage,
    /<h1[^>]*>Adelaide Removalists You Can Rely On<\/h1>/i,
  );
  assert.match(
    homepage,
    /From the first box to the final placement/i,
  );
  assert.match(homepage, /href="tel:\+61433819989"/i);
  assert.equal((homepage.match(/data-service-card/g) || []).length, 9);
  assert.equal((homepage.match(/itemtype="https:\/\/schema\.org\/Question"/g) || []).length, 8);
  assert.match(homepage, /href="\/house-removals-adelaide\/"/);
  assert.match(homepage, /href="\/furniture-removalists-adelaide\/"/);
  assert.match(homepage, /href="\/office-removals-adelaide\/"/);
  assert.match(homepage, /href="\/interstate-removals-adelaide\/"/);
  assert.match(homepage, /href="\/packing-services-adelaide\/"/);
  assert.match(homepage, /href="\/apartment-removals-adelaide\/"/);
  assert.match(homepage, /href="\/removalists-adelaide-cbd\/"/);
  assert.match(homepage, /href="\/removalists-marion\/"/);
  assert.match(homepage, /href="\/removalists-unley\/"/);
  assert.match(homepage, /href="\/removalists-prospect\/"/);
  assert.match(homepage, /href="\/removalists-glenelg\/"/);
  assert.match(homepage, /href="\/removalists-mawson-lakes\/"/);
  assert.doesNotMatch(homepage, /54 Google|5\.0\/5|fully insured|award-winning/i);
});

test('generated html keeps internal hrefs root-absolute', () => {
  const htmlFiles = [];
  (function walk(dir) {
    for (const entry of readdirSync(dir)) {
      const fullPath = path.join(dir, entry);
      if (statSync(fullPath).isDirectory()) {
        walk(fullPath);
      } else if (entry.endsWith('.html')) {
        htmlFiles.push(fullPath);
      }
    }
  })(distDir);

  for (const htmlFile of htmlFiles) {
    const html = readFileSync(htmlFile, 'utf8');
    const relativeLinks = [...html.matchAll(/href="([^"]+)"/g)]
      .map((match) => match[1])
      .filter((href) =>
        href &&
        !href.startsWith('/') &&
        !href.startsWith('http://') &&
        !href.startsWith('https://') &&
        !href.startsWith('mailto:') &&
        !href.startsWith('tel:') &&
        !href.startsWith('#') &&
        !href.startsWith('//') &&
        !href.startsWith('javascript:'),
      );

    assert.deepEqual(
      relativeLinks,
      [],
      `relative internal hrefs found in ${path.relative(distDir, htmlFile)}: ${relativeLinks.join(', ')}`,
    );
  }
});

test('quote forms post directly to Web3Forms with attribution and the required contact field names', () => {
  const homepage = readDist('index.html');
  const contactPage = readDist(path.join('contact-us', 'index.html'));
  const clientScript = readFileSync(path.join(root, 'site.js'), 'utf8');

  for (const formMarkup of [homepage, contactPage]) {
    for (const fieldName of ['name', 'phone', 'email', 'message']) {
      assert.match(formMarkup, new RegExp(`name="${fieldName}"`));
    }

    assert.doesNotMatch(formMarkup, /name="full_name"/);
    assert.doesNotMatch(formMarkup, /name="move_details"/);
  }

  assert.match(contactPage, /Get My Moving Quote/i);
  assert.match(contactPage, /Get your moving quote in minutes/i);
  assert.match(contactPage, /What happens after you enquire/i);
  assert.match(clientScript, /const attribution = getStoredAttribution\(\);/);
  assert.match(clientScript, /JSON\.stringify\(buildQuoteSubmissionPayload\(payload\)\)/);
  assert.match(clientScript, /function updateFormStepAccessibility\(form, activeStepIndex\)/);
  assert.match(clientScript, /fieldset\.setAttribute\("aria-hidden", "true"\)/);
  assert.match(clientScript, /el\.setAttribute\("tabindex", "-1"\)/);
  assert.match(clientScript, /\b(?:const|var) QUOTE_API_ENDPOINT = "https:\/\/api\.web3forms\.com\/submit";/);
  assert.match(clientScript, /fetch\(QUOTE_API_ENDPOINT,/);
  assert.match(clientScript, /"Content-Type": "application\/json"/);
  assert.match(clientScript, /access_key: getTrimmedPayloadValue\(payload, "access_key"\)/);
  assert.match(clientScript, /subject: getTrimmedPayloadValue\(payload, "subject"\)/);
  assert.match(clientScript, /source_page: window\.location\.href/);
  assert.match(clientScript, /utm_source: attribution\.utm_source/);
  assert.match(contactPage, /action="https:\/\/api\.web3forms\.com\/submit"/);
  assert.match(contactPage, /method="POST"/);
  assert.match(contactPage, /name="access_key" value="80c3ff0c-7ae6-4aa7-bb66-567612739824"/);
  assert.match(contactPage, /name="redirect" value="https:\/\/zqremovals\.au\/thank-you\/"/);
  assert.doesNotMatch(clientScript, /d928b483-d5f0-40d7-9eb1-44a56130ba63/);
});

test('house removals page owns the residential keyword and old local-removals URL redirects to it', () => {
  const houseRemovals = readDist(path.join('house-removals-adelaide', 'index.html'));
  const localRemovalsRedirect = readDist(path.join('local-removals-adelaide', 'index.html'));
  const sitemap = readDist('sitemap-services.xml');
  const vercelConfig = JSON.parse(readFileSync(path.join(root, 'vercel.json'), 'utf8'));

  assert.match(
    houseRemovals,
    /<title>House Removalists Adelaide \| Local Home Moves \| ZQ Removals<\/title>/,
  );
  assert.match(houseRemovals, /<h1>House Removals Adelaide for Professional Home Moves<\/h1>/i);
  assert.match(houseRemovals, /href="\/removalists-marion\/"/);
  assert.match(houseRemovals, /href="\/removalists-glenelg\/"/);
  assert.match(houseRemovals, /href="\/contact-us\/#quote-form"/);
  assert.match(houseRemovals, /"@type": "Service"/);
  assert.match(houseRemovals, /"serviceType": "House removal services"/);
  assert.match(sitemap, /https:\/\/zqremovals\.au\/house-removals-adelaide\//);

  assert.match(localRemovalsRedirect, /http-equiv="refresh"/i);
  assert.match(localRemovalsRedirect, /https:\/\/zqremovals\.au\/house-removals-adelaide\//);
  assert.ok(
    vercelConfig.redirects.some(
      ({ source, destination }) =>
        source === '/local-removals-adelaide/' &&
        destination === '/house-removals-adelaide/',
    ),
  );
});

test('priority service and suburb pages carry the refined title targets and cross-link between intents', () => {
  const furniturePage = readDist(path.join('furniture-removalists-adelaide', 'index.html'));
  const officePage = readDist(path.join('office-removals-adelaide', 'index.html'));
  const interstatePage = readDist(path.join('interstate-removals-adelaide', 'index.html'));
  const packingPage = readDist(path.join('packing-services-adelaide', 'index.html'));
  const marionPage = readDist(path.join('removalists-marion', 'index.html'));
  const glenelgPage = readDist(path.join('removalists-glenelg', 'index.html'));
  const salisburyPage = readDist(path.join('removalists-salisbury', 'index.html'));
  const cbdPage = readDist(path.join('removalists-adelaide-cbd', 'index.html'));
  const northernPage = readDist(path.join('removalists-northern-adelaide', 'index.html'));

  assert.match(furniturePage, /<title>.*Furniture.*Adelaide.*<\/title>/);
  assert.match(officePage, /<title>.*Office.*Adelaide.*<\/title>/);
  assert.match(interstatePage, /<title>.*Interstate.*Adelaide.*<\/title>/);
  assert.match(packingPage, /<title>.*Packing.*Adelaide.*<\/title>/);
  assert.match(marionPage, /<title>.*Marion.*<\/title>/);
  assert.match(glenelgPage, /<title>.*Glenelg.*<\/title>/);
  assert.match(salisburyPage, /<title>.*Salisbury.*<\/title>/);
  assert.match(cbdPage, /<title>.*Adelaide CBD.*<\/title>/);
  assert.match(northernPage, /<title>.*Northern.*Adelaide.*<\/title>/);

  assert.match(officePage, /href="\/removalists-adelaide-cbd\/"/);
  assert.match(officePage, /href="\/removalists-marion\/"/);
  assert.match(packingPage, /href="\/house-removals-adelaide\/"/);
  assert.match(marionPage, /href="\/office-removals-adelaide\/"/);
  assert.match(marionPage, /href="\/furniture-removalists-adelaide\/"/);
  assert.match(marionPage, /href="\/removalists-glenelg\/"/);
  assert.match(glenelgPage, /href="\/furniture-removalists-adelaide\/"/);
  assert.match(glenelgPage, /href="\/removalists-marion\/"/);
  assert.match(salisburyPage, /href="\/removalists-elizabeth\/"/);
  assert.match(salisburyPage, /href="\/removalists-northern-adelaide\/"/);
  assert.match(cbdPage, /loading zones/i);
  assert.match(cbdPage, /service lifts?/i);
  assert.match(northernPage, /Removalists Northern Suburbs Adelaide/i);
});


// --- Consolidated conversion IA (post GSC route-cleanup) -------------------
// Tests 6-13 originally asserted a large programmatic page inventory. Those URLs
// are now folded into surviving hubs via 301s (site-src/data/zq-redirects-
// verified.json); these tests assert the consolidation kept the conversion
// paths intact on the survivors.
const verifiedRedirects = JSON.parse(
  readFileSync(path.join(root, 'site-src', 'data', 'zq-redirects-verified.json'), 'utf8'),
);
const vercelRedirects = JSON.parse(
  readFileSync(path.join(root, 'vercel.json'), 'utf8'),
).redirects;
const stripSlash = (value) => value.replace(/\/$/, '');
const redirectDest = (src) => {
  const entry = vercelRedirects.find((r) => stripSlash(r.source) === stripSlash(src));
  return entry ? entry.destination : '';
};
const linksTo = (html, href) => html.includes(`href="${href}"`);

test('interstate hub and surviving route pages keep the interstate conversion path', () => {
  const hub = readDist(path.join('interstate-removals-adelaide', 'index.html'));
  const homepage = readDist('index.html');
  for (const route of ['/adelaide-to-brisbane-removals/', '/adelaide-to-sydney-removalists/', '/adelaide-to-melbourne-removalists/']) {
    assert.ok(linksTo(hub, route), `hub missing ${route}`);
  }
  assert.ok(linksTo(homepage, '/interstate-removals-adelaide/'));
  for (const gone of ['/adelaide-to-queensland-removals/', '/adelaide-to-smithfield-nsw-removalists/', '/adelaide-to-western-sydney-removalists/']) {
    assert.equal(redirectDest(gone), '/interstate-removals-adelaide/', gone);
  }
});

test('guide hub feeds the surviving guide cluster into service intent pages', () => {
  const guideHub = readDist(path.join('adelaide-moving-guides', 'index.html'));
  for (const slug of ['how-much-do-removalists-cost-adelaide', 'how-to-choose-removalists-adelaide', 'moving-house-checklist-adelaide', 'office-relocation-checklist-adelaide']) {
    assert.ok(linksTo(guideHub, `/adelaide-moving-guides/${slug}/`), slug);
  }
  for (const svc of ['/packing-services-adelaide/', '/furniture-removalists-adelaide/', '/office-removals-adelaide/', '/interstate-removals-adelaide/']) {
    assert.ok(linksTo(guideHub, svc), svc);
  }
});

test('surviving suburb pages keep region-aware CTAs and cluster links', () => {
  for (const slug of ['removalists-glenelg', 'removalists-salisbury', 'removalists-elizabeth', 'removalists-norwood', 'removalists-adelaide-cbd']) {
    const html = readDist(path.join(slug, 'index.html'));
    assert.match(html, /data-generated-module="/);
    assert.ok(linksTo(html, '/contact-us/#quote-form'), slug);
    assert.ok(linksTo(html, '/removalists-adelaide/'), slug);
  }
});

test('consolidated suburb and guide URLs 301 to a hub and leave the sitemap', () => {
  const suburbsSitemap = readDist('sitemap-suburbs.xml');
  const guidesSitemap = readDist('sitemap-guides.xml');
  for (const r of verifiedRedirects) {
    if (r.source.startsWith('/removalists-')) {
      assert.ok(!suburbsSitemap.includes(`zqremovals.au${r.source}`), `${r.source} still in suburb sitemap`);
      assert.match(redirectDest(r.source), /^\/removalists-(southern|northern|adelaide)/, r.source);
    }
    if (r.source.startsWith('/adelaide-moving-guides/')) {
      assert.ok(!guidesSitemap.includes(`zqremovals.au${r.source}`), `${r.source} still in guide sitemap`);
    }
  }
});

test('southern regional hub acts as the cluster controller for folded coastal suburbs', () => {
  const southernHub = readDist(path.join('removalists-southern-adelaide', 'index.html'));
  for (const href of ['/packing-services-adelaide/', '/furniture-removalists-adelaide/', '/interstate-removals-adelaide/', '/removalists-adelaide/', '/contact-us/#quote-form']) {
    assert.ok(linksTo(southernHub, href), href);
  }
  for (const gone of ['/removalists-noarlunga/', '/removalists-reynella/', '/removalists-morphett-vale/', '/removalists-seaford/']) {
    assert.equal(redirectDest(gone), '/removalists-southern-adelaide/', gone);
  }
});

test('regional hubs and homepage stay linked as cluster controllers', () => {
  const homepage = readDist('index.html');
  const adelaideHub = readDist(path.join('removalists-adelaide', 'index.html'));
  for (const href of ['/removalists-southern-adelaide/', '/removalists-northern-adelaide/', '/house-removals-adelaide/', '/office-removals-adelaide/']) {
    assert.ok(linksTo(homepage, href), href);
  }
  for (const href of ['/removalists-southern-adelaide/', '/removalists-northern-adelaide/', '/adelaide-moving-guides/', '/contact-us/#quote-form']) {
    assert.ok(linksTo(adelaideHub, href), href);
  }
});

test('generated suburb pages ship modular content and the corrected semaphore route', () => {
  const semaphorePage = readDist(path.join('removalists-semaphore', 'index.html'));
  const suburbsSitemap = readDist('sitemap-suburbs.xml');
  for (const moduleName of ['hero-title', 'local-intro', 'logistics-access', 'nearby-suburbs', 'related-services', 'related-guides', 'suburb-faq', 'bottom-cta']) {
    assert.match(semaphorePage, new RegExp(`data-generated-module="${moduleName}"`), moduleName);
  }
  assert.ok(linksTo(semaphorePage, '/removalists-adelaide/'));
  assert.ok(suburbsSitemap.includes('zqremovals.au/removalists-semaphore/'));
  assert.ok(!suburbsSitemap.includes('zqremovals.au/removalists-semore/'));
  assert.ok(vercelRedirects.some(({ source, destination }) => source === '/removalists-semore/' && destination.includes('removalists-semaphore')));
});

test('surviving money pages stay substantial, image-backed, and cross-linked', () => {
  for (const slug of ['cheap-removalists-adelaide', 'same-day-removalists-adelaide', 'apartment-removalists-adelaide', 'removalists-adelaide-prices']) {
    const html = readDist(path.join(slug, 'index.html'));
    assert.ok(linksTo(html, '/contact-us/#quote-form'), slug);
    assert.match(html, /href="\/removalists-[a-z-]+\/"/, slug);
    assert.match(html, /href="\/adelaide-moving-guides\//, slug);
  }
});


test('generated-page lastmod follows source file mtimes and image sitemap is powered by real page images', () => {
  const suburbsSitemap = readDist('sitemap-suburbs.xml');
  const servicesSitemap = readDist('sitemap-services.xml');
  const imageSitemap = readDist('sitemap-images.xml');
  const expectedLastmod = [
    statSync(path.join(root, 'site-src', 'data', 'seo-v4.mjs')).mtime.toISOString().slice(0, 10),
    statSync(path.join(root, 'site-src', 'data', 'zq-blog-guides.mjs')).mtime.toISOString().slice(0, 10),
    statSync(path.join(root, 'site-src', 'data', 'zq-internal-links.mjs')).mtime.toISOString().slice(0, 10),
    statSync(path.join(root, 'site-src', 'data', 'zq-seo-pages.mjs')).mtime.toISOString().slice(0, 10),
    statSync(path.join(root, 'site-src', 'data', 'zq-services.mjs')).mtime.toISOString().slice(0, 10),
    statSync(path.join(root, 'site-src', 'data', 'zq-suburbs.mjs')).mtime.toISOString().slice(0, 10),
    statSync(path.join(root, 'scripts', 'build-site.mjs')).mtime.toISOString().slice(0, 10),
  ].sort().at(-1);

  const semaphoreLastmod = suburbsSitemap.match(
    /<loc>https:\/\/zqremovals\.au\/removalists-semaphore\/<\/loc>\s*<lastmod>([^<]+)<\/lastmod>/,
  );
  const cheapLastmod = servicesSitemap.match(
    /<loc>https:\/\/zqremovals\.au\/cheap-removalists-adelaide\/<\/loc>\s*<lastmod>([^<]+)<\/lastmod>/,
  );

  assert.ok(semaphoreLastmod);
  assert.ok(cheapLastmod);
  assert.equal(semaphoreLastmod[1], expectedLastmod);
  assert.equal(cheapLastmod[1], expectedLastmod);
  assert.match(imageSitemap, /<image:loc>https:\/\/zqremovals\.au\/media\/zq-local-premium\.webp<\/image:loc>/);
  assert.match(imageSitemap, /<image:loc>https:\/\/zqremovals\.au\/media\/zq-service-premium\.webp<\/image:loc>/);
});

test('premium stylesheet includes clear responsive media queries', () => {
  const css = readFileSync(path.join(root, 'premium-site.css'), 'utf8');

  assert.match(css, /@media \(max-width: 1023px\)/);
  assert.match(css, /@media \(min-width: 768px\)/);
  assert.match(css, /@media \(min-width: 1024px\)/);
});

test('important pages keep accessible image alt text and dimensions', () => {
  const homepage = readDist('index.html');
  const contactPage = readDist(path.join('contact-us', 'index.html'));

  for (const html of [homepage, contactPage]) {
    assert.doesNotMatch(html, /<img(?![^>]*\balt=")[^>]*>/i);
    assert.doesNotMatch(html, /<img(?![^>]*\bwidth=")[^>]*>/i);
    assert.doesNotMatch(html, /<img(?![^>]*\bheight=")[^>]*>/i);
  }
});

test('no generated page path matches site-dist/**/index/index.html', () => {
  const walk = (dir) => {
    let files = [];
    const list = readdirSync(dir);
    for (const file of list) {
      const filePath = path.join(dir, file);
      const stat = statSync(filePath);
      if (stat.isDirectory()) {
        files = files.concat(walk(filePath));
      } else {
        files.push(filePath);
      }
    }
    return files;
  };

  const allFiles = walk(distDir);
  for (const file of allFiles) {
    const normalized = file.replace(/\\/g, '/');
    assert.ok(
      !normalized.endsWith('/index/index.html'),
      `Should not generate double index path: ${file}`
    );
  }
});
