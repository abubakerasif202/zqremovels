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

test('homepage targets Adelaide removalists with the new commercial headline and service links', () => {
  const homepage = readDist('index.html');

  assert.match(
    homepage,
    /<h1[^>]*>Removalists Adelaide<\/h1>/i,
  );
  assert.match(
    homepage,
    /Local &amp; Interstate Moves Across Adelaide\. Fixed Pricing, Professional Movers, Insurance Details Confirmed Before Booking\./i,
  );
  assert.match(
    homepage,
    /<a class="button button-secondary" href="tel:\+61433819989"[^>]*>Call 0433 819 989<\/a>/i,
  );
  assert.match(homepage, /class="home-redesign-rating-box"/i);
  assert.match(homepage, /class="home-redesign-stars"/i);
  assert.match(homepage, /href="\/services\/house-removals-adelaide\/"/);
  assert.match(homepage, /href="\/services\/furniture-removals-adelaide\/"/);
  assert.match(homepage, /href="\/services\/office-removals-adelaide\/"/);
  assert.match(homepage, /href="\/services\/interstate-removals-adelaide\/"/);
  assert.match(homepage, /href="\/services\/packing-services-adelaide\/"/);
  assert.match(homepage, /href="\/services\/apartment-removals-adelaide\/"/);
  assert.match(homepage, /href="\/removalists-adelaide-cbd\/"/);
  assert.match(homepage, /href="\/removalists-marion\/"/);
  assert.match(homepage, /href="\/removalists-unley\/"/);
  assert.match(homepage, /href="\/apartment-removalists-prospect\/"/);
  assert.match(homepage, /href="\/removalists-glenelg\/"/);
  assert.match(homepage, /href="\/apartment-removalists-henley-beach\/"/);
  assert.match(homepage, /href="\/adelaide-moving-guides\/moving-house-checklist-adelaide\/"/);
  assert.match(homepage, /href="\/adelaide-moving-guides\/packing-checklist-adelaide\/"/);
  assert.match(homepage, /href="\/adelaide-moving-guides\/removalists-cost-adelaide\/"/);
  assert.match(homepage, /href="\/adelaide-moving-guides\/interstate-moving-checklist-adelaide\/"/);
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
  const clientScript = readDist('site.js');

  for (const formMarkup of [homepage, contactPage]) {
    for (const fieldName of ['name', 'phone', 'email', 'message']) {
      assert.match(formMarkup, new RegExp(`name="${fieldName}"`));
    }

    assert.doesNotMatch(formMarkup, /name="full_name"/);
    assert.doesNotMatch(formMarkup, /name="move_details"/);
  }

  assert.match(contactPage, /Get My Fixed-Price Quote/i);
  assert.match(contactPage, /Get your fixed-price quote in minutes/i);
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

test('new interstate routes are linked from the hub, footer, and sibling route sections', () => {
  const hubPage = readDist(path.join('interstate-removals-adelaide', 'index.html'));
  const homepage = readDist('index.html');
  const brisbanePage = readDist(path.join('adelaide-to-brisbane-removals', 'index.html'));
  const canberraPage = readDist(path.join('adelaide-to-canberra-removals', 'index.html'));
  const perthPage = readDist(path.join('adelaide-to-perth-removals', 'index.html'));
  const queenslandPage = readDist(path.join('adelaide-to-queensland-removals', 'index.html'));

  for (const route of [
    '/adelaide-to-brisbane-removals/',
    '/adelaide-to-canberra-removals/',
    '/adelaide-to-perth-removals/',
    '/adelaide-to-queensland-removals/',
  ]) {
    assert.match(hubPage, new RegExp(`href="${route.replace(/\//g, '\\/')}"`));
    assert.match(homepage, new RegExp(`href="${route.replace(/\//g, '\\/')}"`));
  }

  assert.match(brisbanePage, /href="\/interstate-removals-adelaide\/"/);
  assert.match(brisbanePage, /href="\/adelaide-to-canberra-removals\/"/);
  assert.match(canberraPage, /href="\/interstate-removals-adelaide\/"/);
  assert.match(canberraPage, /href="\/adelaide-to-brisbane-removals\/"/);
  assert.match(perthPage, /href="\/interstate-removals-adelaide\/"/);
  assert.match(perthPage, /href="\/adelaide-to-queensland-removals\/"/);
  assert.match(queenslandPage, /href="\/interstate-removals-adelaide\/"/);
  assert.match(queenslandPage, /href="\/adelaide-to-perth-removals\/"/);
});

test('guide hub and guide articles feed into packing, furniture, office, and interstate intent pages', () => {
  const guideHub = readDist(path.join('adelaide-moving-guides', 'index.html'));
  const packingWhen = readDist(path.join('adelaide-moving-guides', 'when-to-book-packing-services-adelaide', 'index.html'));
  const heavyFurniture = readDist(path.join('adelaide-moving-guides', 'moving-heavy-furniture-adelaide', 'index.html'));
  const officeAccess = readDist(path.join('adelaide-moving-guides', 'office-access-planning-adelaide-cbd', 'index.html'));
  const apartmentLiftBookings = readDist(
    path.join('adelaide-moving-guides', 'apartment-lift-bookings-adelaide', 'index.html'),
  );
  const coastalAccess = readDist(
    path.join('adelaide-moving-guides', 'coastal-moving-access-adelaide', 'index.html'),
  );

  for (const href of [
    '/adelaide-moving-guides/when-to-book-packing-services-adelaide/',
    '/adelaide-moving-guides/moving-heavy-furniture-adelaide/',
    '/adelaide-moving-guides/office-access-planning-adelaide-cbd/',
    '/adelaide-moving-guides/apartment-lift-bookings-adelaide/',
    '/adelaide-moving-guides/coastal-moving-access-adelaide/',
    '/packing-services-adelaide/',
    '/furniture-removalists-adelaide/',
    '/office-removals-adelaide/',
    '/interstate-removals-adelaide/',
  ]) {
    assert.match(guideHub, new RegExp(`href="${href.replace(/\//g, '\\/')}"`));
  }

  assert.match(packingWhen, /href="\/packing-services-adelaide\/"/);
  assert.match(packingWhen, /href="\/office-removals-adelaide\/"/);
  assert.match(packingWhen, /href="\/furniture-removalists-adelaide\/"/);
  assert.match(packingWhen, /href="\/interstate-removals-adelaide\/"/);

  assert.match(heavyFurniture, /href="\/furniture-removalists-adelaide\/"/);
  assert.match(heavyFurniture, /href="\/house-removals-adelaide\/"/);
  assert.match(heavyFurniture, /href="\/packing-services-adelaide\/"/);
  assert.match(heavyFurniture, /href="\/interstate-removals-adelaide\/"/);

  assert.match(officeAccess, /href="\/office-removals-adelaide\/"/);
  assert.match(officeAccess, /href="\/removalists-adelaide-cbd\/"/);
  assert.match(officeAccess, /href="\/adelaide-moving-guides\/office-relocation-checklist-adelaide\/"/);
  assert.match(officeAccess, /href="\/packing-services-adelaide\/"/);

  assert.match(apartmentLiftBookings, /href="\/house-removals-adelaide\/"/);
  assert.match(apartmentLiftBookings, /href="\/removalists-adelaide-cbd\/"/);
  assert.match(apartmentLiftBookings, /href="\/removalists-mawson-lakes\/"/);
  assert.match(apartmentLiftBookings, /href="\/packing-services-adelaide\/"/);

  assert.match(coastalAccess, /href="\/house-removals-adelaide\/"/);
  assert.match(coastalAccess, /href="\/furniture-removalists-adelaide\/"/);
  assert.match(coastalAccess, /href="\/removalists-glenelg\/"/);
  assert.match(coastalAccess, /href="\/removalists-noarlunga\/"/);
  assert.match(coastalAccess, /href="\/removalists-southern-adelaide\/"/);
});

test('v5 suburb pages surface region-aware ctas, richer modules, and stronger link paths', () => {
  const cbdPage = readDist(path.join('removalists-adelaide-cbd', 'index.html'));
  const glenelgPage = readDist(path.join('removalists-glenelg', 'index.html'));
  const salisburyPage = readDist(path.join('removalists-salisbury', 'index.html'));
  const elizabethPage = readDist(path.join('removalists-elizabeth', 'index.html'));
  const noarlungaPage = readDist(path.join('removalists-noarlunga', 'index.html'));
  const reynellaPage = readDist(path.join('removalists-reynella', 'index.html'));
  const norwoodPage = readDist(path.join('removalists-norwood', 'index.html'));
  const seafordPage = readDist(path.join('removalists-seaford', 'index.html'));

  assert.match(cbdPage, /data-generated-module="logistics-access"/);
  assert.match(cbdPage, /Book city move|Book apartment move/i);
  assert.match(cbdPage, /href="\/office-relocation-adelaide\/"/);
  assert.match(cbdPage, /href="\/adelaide-moving-guides\/apartment-moving-tips-adelaide\/"/);
  assert.match(cbdPage, /src="\/media\/zq-operations-premium\.webp"/);
  assert.match(glenelgPage, /Plan coastal move/i);
  assert.match(glenelgPage, /href="\/furniture-removalists-adelaide\/"/);
  assert.match(glenelgPage, /href="\/adelaide-moving-guides\/coastal-moving-access-adelaide\/"/);
  assert.match(glenelgPage, /Specialized Glenelg Moving Options:/);
  assert.match(glenelgPage, /href="\/apartment-removalists-glenelg\/"/);
  assert.match(glenelgPage, /href="\/office-removals-glenelg\/"/);
  assert.match(glenelgPage, /href="\/packing-services-glenelg\/"/);
  assert.match(glenelgPage, /Calculate Move Cost/);
  assert.match(glenelgPage, /Request a Fixed-Price Adelaide Moving Quote/);
  assert.match(glenelgPage, /href="\/contact-us\/#quote-form"[^>]*>Get Free Fixed Quote/);
  assert.match(glenelgPage, /href="tel:\+61433819989"[^>]*>Call Specialist Now/);
  assert.match(salisburyPage, /Get suburb-specific quote/i);
  assert.match(salisburyPage, /href="\/cheap-removalists-adelaide\/"/);
  assert.match(salisburyPage, /href="\/adelaide-moving-guides\/suburb-move-preparation-adelaide\/"|href="\/adelaide-moving-guides\/removalists-cost-adelaide\/"/);
  assert.match(salisburyPage, /Specialized Salisbury Moving Options:/);
  assert.match(salisburyPage, /href="\/office-removals-salisbury\/"/);
  assert.match(salisburyPage, /href="\/packing-services-salisbury\/"/);
  assert.doesNotMatch(salisburyPage, /href="\/apartment-removalists-salisbury\/"/);
  assert.match(elizabethPage, /Get suburb-specific quote|Book larger-home move/i);
  assert.match(elizabethPage, /data-generated-module="move-types"/);
  assert.match(noarlungaPage, /Plan staged coastal move|Plan coastal move/i);
  assert.match(noarlungaPage, /href="\/storage-friendly-removals-adelaide\/"/);
  assert.match(reynellaPage, /Book family-home move/i);
  assert.match(reynellaPage, /href="\/storage-friendly-removals-adelaide\/"/);
  assert.match(norwoodPage, /Book access-aware move/i);
  assert.match(norwoodPage, /href="\/adelaide-moving-guides\/removalists-cost-adelaide\/"/);
  assert.match(seafordPage, /coastal family-home access/i);
  assert.match(seafordPage, /Plan coastal move|coastal access planning/i);
});

test('new v4 guides are linked from the guide hub and support conversion paths', () => {
  const guideHub = readDist(path.join('adelaide-moving-guides', 'index.html'));
  const pricing = readDist(path.join('adelaide-moving-guides', 'pricing-breakdown-adelaide', 'index.html'));
  const timing = readDist(path.join('adelaide-moving-guides', 'how-long-moves-take-adelaide', 'index.html'));
  const bestTime = readDist(path.join('adelaide-moving-guides', 'best-time-to-move-adelaide', 'index.html'));
  const damage = readDist(path.join('adelaide-moving-guides', 'avoiding-damage-adelaide', 'index.html'));
  const storage = readDist(path.join('adelaide-moving-guides', 'storage-planning-adelaide', 'index.html'));

  for (const href of [
    '/adelaide-moving-guides/pricing-breakdown-adelaide/',
    '/adelaide-moving-guides/how-long-moves-take-adelaide/',
    '/adelaide-moving-guides/best-time-to-move-adelaide/',
    '/adelaide-moving-guides/avoiding-damage-adelaide/',
    '/adelaide-moving-guides/storage-planning-adelaide/',
  ]) {
    assert.match(guideHub, new RegExp(`href="${href.replace(/\//g, '\\/')}"`));
  }

  assert.match(pricing, /Request a quote/i);
  assert.match(pricing, /Removalists Adelaide/i);
  assert.match(timing, /move timing/i);
  assert.match(bestTime, /weekdays/i);
  assert.match(damage, /Packing Services Adelaide/i);
  assert.match(storage, /storage unit/i);
});

test('southern suburb pages connect into service clusters and interstate planning', () => {
  const southernHub = readDist(path.join('removalists-southern-adelaide', 'index.html'));
  const morphettVale = readDist(path.join('removalists-morphett-vale', 'index.html'));
  const noarlunga = readDist(path.join('removalists-noarlunga', 'index.html'));
  const reynella = readDist(path.join('removalists-reynella', 'index.html'));

  assert.match(southernHub, /href="\/removalists-morphett-vale\/"/);
  assert.match(southernHub, /href="\/removalists-noarlunga\/"/);
  assert.match(southernHub, /href="\/removalists-reynella\/"/);
  assert.match(southernHub, /href="\/packing-services-adelaide\/"/);
  assert.match(southernHub, /href="\/furniture-removalists-adelaide\/"/);
  assert.match(southernHub, /href="\/interstate-removals-adelaide\/"/);
  assert.match(southernHub, /href="\/adelaide-moving-guides\/coastal-moving-access-adelaide\/"/);
  assert.match(southernHub, /href="\/adelaide-moving-guides\/when-to-book-packing-services-adelaide\/"/);

  for (const page of [morphettVale, noarlunga, reynella]) {
    assert.match(page, /href="\/packing-services-adelaide\/"/);
    assert.match(page, /href="\/furniture-removalists-adelaide\/"/);
    assert.match(page, /href="\/office-removals-adelaide\/"/);
    assert.match(page, /href="\/interstate-removals-adelaide\/"/);
    assert.match(page, /href="\/removalists-adelaide\/"/);
    assert.match(page, /href="\/removalists-southern-adelaide\/"/);
  }
});

test('regional hubs act like cluster controllers instead of isolated landing pages', () => {
  const homepage = readDist('index.html');
  const adelaideHub = readDist(path.join('removalists-adelaide', 'index.html'));
  const northernHub = readDist(path.join('removalists-northern-adelaide', 'index.html'));
  const southernHub = readDist(path.join('removalists-southern-adelaide', 'index.html'));

  for (const href of [
    '/removalists-southern-adelaide/',
    '/removalists-northern-adelaide/',
    '/house-removals-adelaide/',
    '/office-removals-adelaide/',
    '/adelaide-moving-guides/apartment-lift-bookings-adelaide/',
    '/adelaide-moving-guides/coastal-moving-access-adelaide/',
  ]) {
    assert.match(homepage, new RegExp(`href="${href.replace(/\//g, '\\/')}"`));
  }

  for (const href of [
    '/removalists-southern-adelaide/',
    '/removalists-northern-adelaide/',
    '/adelaide-moving-guides/',
    '/adelaide-moving-guides/apartment-lift-bookings-adelaide/',
    '/adelaide-moving-guides/coastal-moving-access-adelaide/',
    '/contact-us/#quote-form',
  ]) {
    assert.match(adelaideHub, new RegExp(`href="${href.replace(/\//g, '\\/')}"`));
  }

  for (const href of [
    '/removalists-mawson-lakes/',
    '/removalists-salisbury/',
    '/office-removals-adelaide/',
    '/packing-services-adelaide/',
    '/adelaide-moving-guides/apartment-lift-bookings-adelaide/',
    '/adelaide-moving-guides/office-relocation-checklist-adelaide/',
  ]) {
    assert.match(northernHub, new RegExp(`href="${href.replace(/\//g, '\\/')}"`));
  }

  for (const href of [
    '/removalists-noarlunga/',
    '/removalists-reynella/',
    '/house-removals-adelaide/',
    '/interstate-removals-adelaide/',
    '/adelaide-moving-guides/coastal-moving-access-adelaide/',
    '/adelaide-moving-guides/when-to-book-packing-services-adelaide/',
  ]) {
    assert.match(southernHub, new RegExp(`href="${href.replace(/\//g, '\\/')}"`));
  }
});

test('generated suburb pages now ship modular content, real hero images, and the corrected semaphore route', () => {
  const semaphorePage = readDist(path.join('removalists-semaphore', 'index.html'));
  const semoreRedirect = readDist(path.join('removalists-semore', 'index.html'));
  const suburbsSitemap = readDist('sitemap-suburbs.xml');
  const imageSitemap = readDist('sitemap-images.xml');
  const vercelConfig = JSON.parse(readFileSync(path.join(root, 'vercel.json'), 'utf8'));

  for (const moduleName of [
    'hero-title',
    'local-intro',
    'local-service-summary',
    'logistics-access',
    'move-types',
    'nearby-suburbs',
    'related-services',
    'related-guides',
    'suburb-faq',
    'bottom-cta',
  ]) {
    assert.match(semaphorePage, new RegExp(`data-generated-module="${moduleName}"`));
  }

  assert.match(semaphorePage, /data-generated-cta="top"/);
  assert.match(semaphorePage, /data-generated-cta="bottom"/);
  assert.match(semaphorePage, /href="\/removalists-adelaide\/"/);
  assert.match(semaphorePage, /href="\/removalists-glenelg\/"|href="\/removalists-brighton\/"/);
  assert.match(semaphorePage, /href="\/adelaide-moving-guides\/coastal-moving-access-adelaide\/"/);
  assert.match(semaphorePage, /src="\/media\/zq-local-premium\.webp"/);

  assert.match(semoreRedirect, /http-equiv="refresh"/i);
  assert.match(semoreRedirect, /https:\/\/zqremovals\.au\/removalists-semaphore\//);
  assert.match(suburbsSitemap, /https:\/\/zqremovals\.au\/removalists-semaphore\//);
  assert.doesNotMatch(suburbsSitemap, /https:\/\/zqremovals\.au\/removalists-semore\//);
  assert.match(imageSitemap, /https:\/\/zqremovals\.au\/removalists-semaphore\//);
  assert.match(imageSitemap, /https:\/\/zqremovals\.au\/media\/zq-local-premium\.webp/);

  assert.ok(
    vercelConfig.redirects.some(
      ({ source, destination }) =>
        source === '/removalists-semore/' &&
        destination === '/removalists-semaphore/',
    ),
  );
});

test('generated money pages are substantial, image-backed, and linked into suburbs, guides, and sibling services', () => {
  const cases = [
    {
      slug: 'cheap-removalists-adelaide',
      suburb: '/removalists-salisbury/',
      guide: '/adelaide-moving-guides/removalists-cost-adelaide/',
      sibling: '/last-minute-removalists-adelaide/',
      image: '/media/home-local-hero-branded.webp',
    },
    {
      slug: 'same-day-removalists-adelaide',
      suburb: '/removalists-adelaide-cbd/',
      guide: '/adelaide-moving-guides/booking-timing-guide-adelaide/',
      sibling: '/last-minute-removalists-adelaide/',
      image: '/media/home-local-hero-branded.webp',
    },
    {
      slug: 'last-minute-removalists-adelaide',
      suburb: '/removalists-glenelg/',
      guide: '/adelaide-moving-guides/packing-tips-adelaide/',
      sibling: '/same-day-removalists-adelaide/',
      image: '/media/home-local-hero-branded.webp',
    },
    {
      slug: 'apartment-removalists-adelaide',
      suburb: '/removalists-mawson-lakes/',
      guide: '/adelaide-moving-guides/apartment-moving-tips-adelaide/',
      sibling: '/same-day-removalists-adelaide/',
      image: '/media/zq-service-premium.webp',
    },
    {
      slug: 'office-relocation-adelaide',
      suburb: '/removalists-marion/',
      guide: '/adelaide-moving-guides/office-relocation-preparation-adelaide/',
      sibling: '/storage-friendly-removals-adelaide/',
      image: '/media/zq-operations-premium.webp',
    },
    {
      slug: 'storage-friendly-removals-adelaide',
      suburb: '/removalists-noarlunga/',
      guide: '/adelaide-moving-guides/storage-planning-adelaide/',
      sibling: '/office-relocation-adelaide/',
      image: '/media/zq-interstate-premium.webp',
    },
  ];

  for (const testCase of cases) {
    const html = readDist(path.join(testCase.slug, 'index.html'));

    assert.match(html, /data-generated-page="money-v5"/);
    assert.match(html, new RegExp(`href="${testCase.suburb.replace(/\//g, '\\/')}"`));
    assert.match(html, new RegExp(`href="${testCase.guide.replace(/\//g, '\\/')}"`));
    assert.match(html, new RegExp(`href="${testCase.sibling.replace(/\//g, '\\/')}"`));
    assert.match(html, /href="\/contact-us\/#quote-form"/);
    assert.match(html, new RegExp(`src="${testCase.image.replace(/\//g, '\\/')}"`));
    assert.match(html, /data-generated-module="commercial-factors"/);
    assert.match(html, /data-generated-module="commercial-guides"/);
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
