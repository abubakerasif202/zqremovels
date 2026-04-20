import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const distDir = path.join(root, 'site-dist');

function readDist(relativePath) {
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
    /<h1[^>]*>Adelaide removalists for local, interstate, office, and furniture moves<\/h1>/i,
  );
  assert.match(
    homepage,
    /ZQ Removals quotes Adelaide house moves, apartment relocations, office removals, furniture-only jobs, packing support, and interstate routes from one clear brief\./i,
  );
  assert.match(homepage, /href="\/house-removals-adelaide\/"/);
  assert.match(homepage, /href="\/furniture-removalists-adelaide\/"/);
  assert.match(homepage, /href="\/office-removals-adelaide\/"/);
  assert.match(homepage, /href="\/interstate-removals-adelaide\/"/);
  assert.match(homepage, /href="\/packing-services-adelaide\/"/);
  assert.match(homepage, /href="\/removalists-adelaide-cbd\/"/);
  assert.match(homepage, /href="\/removalists-marion\/"/);
  assert.match(homepage, /href="\/removalists-salisbury\/"/);
  assert.match(homepage, /href="\/removalists-elizabeth\/"/);
  assert.match(homepage, /href="\/removalists-glenelg\/"/);
  assert.match(homepage, /href="\/removalists-morphett-vale\/"/);
  assert.match(homepage, /href="\/removalists-noarlunga\/"/);
  assert.match(homepage, /href="\/removalists-southern-adelaide\/"/);
  assert.match(homepage, /href="\/removalists-northern-adelaide\/"/);
  assert.match(homepage, /href="\/adelaide-moving-guides\/moving-heavy-furniture-adelaide\/"/);
  assert.match(homepage, /href="\/adelaide-moving-guides\/office-access-planning-adelaide-cbd\/"/);
  assert.match(homepage, /href="\/adelaide-moving-guides\/when-to-book-packing-services-adelaide\/"/);
});

test('quote forms post directly to Web3Forms with the required contact field names', () => {
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

  assert.match(contactPage, /Request My Moving Quote/i);
  assert.match(clientScript, /new FormData\(form\)/);
  assert.match(clientScript, /https:\/\/api\.web3forms\.com\/submit/);
  assert.match(clientScript, /d928b483-d5f0-40d7-9eb1-44a56130ba63/);
  assert.match(clientScript, /Accept:\s*"application\/json"/);
  assert.doesNotMatch(clientScript, /fetch\("\/api\/quote"/);
});

test('house removals page owns the residential keyword and old local-removals URL redirects to it', () => {
  const houseRemovals = readDist(path.join('house-removals-adelaide', 'index.html'));
  const localRemovalsRedirect = readDist(path.join('local-removals-adelaide', 'index.html'));
  const sitemap = readDist('sitemap.xml');
  const vercelConfig = JSON.parse(readFileSync(path.join(root, 'vercel.json'), 'utf8'));

  assert.match(houseRemovals, /<title>House Removals Adelaide \| Local Home Moving Services \| ZQ Removals<\/title>/);
  assert.match(houseRemovals, /<h1[^>]*>House Removals Adelaide for Family Homes, Apartments, and Townhouse Moves<\/h1>/i);
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

  assert.match(furniturePage, /<title>Furniture Removalists Adelaide \| Furniture Movers \| ZQ Removals<\/title>/);
  assert.match(officePage, /<title>Office Removals Adelaide \| Office Relocations \| ZQ Removals<\/title>/);
  assert.match(interstatePage, /<title>Interstate Removals Adelaide \| Interstate Movers \| ZQ Removals<\/title>/);
  assert.match(packingPage, /<title>Packing Services Adelaide \| Fragile, Partial &amp; Full Packing Help \| ZQ Removals<\/title>/);
  assert.match(marionPage, /<title>Marion Removalists \| Local Movers in Marion \| ZQ Removals<\/title>/);
  assert.match(glenelgPage, /<title>Glenelg Removalists \| Coastal Moves &amp; Apartments \| ZQ Removals<\/title>/);
  assert.match(salisburyPage, /<title>Salisbury Removalists \| Local Movers in Salisbury \| ZQ Removals<\/title>/);
  assert.match(cbdPage, /<title>Removalists Adelaide CBD \| Apartment, Office &amp; City Moves \| ZQ Removals<\/title>/);
  assert.match(northernPage, /<title>Removalists Northern Suburbs Adelaide \| Family Homes &amp; Northside Moves \| ZQ Removals<\/title>/);

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

test('v4 suburb pages surface region-aware intents and contextual ctas', () => {
  const cbdPage = readDist(path.join('removalists-adelaide-cbd', 'index.html'));
  const glenelgPage = readDist(path.join('removalists-glenelg', 'index.html'));
  const salisburyPage = readDist(path.join('removalists-salisbury', 'index.html'));
  const elizabethPage = readDist(path.join('removalists-elizabeth', 'index.html'));
  const noarlungaPage = readDist(path.join('removalists-noarlunga', 'index.html'));
  const reynellaPage = readDist(path.join('removalists-reynella', 'index.html'));
  const norwoodPage = readDist(path.join('removalists-norwood', 'index.html'));
  const seafordPage = readDist(path.join('removalists-seaford', 'index.html'));

  assert.match(cbdPage, /Route and intent expansion/i);
  assert.match(cbdPage, /Book apartment move/i);
  assert.match(cbdPage, /Book office relocation/i);
  assert.match(cbdPage, /interstate/i);
  assert.match(cbdPage, /Apartment Lift Bookings Adelaide/i);
  assert.match(glenelgPage, /Plan coastal move/i);
  assert.match(glenelgPage, /furniture removalists support/i);
  assert.match(glenelgPage, /Coastal Moving Access Adelaide/i);
  assert.match(salisburyPage, /Get suburb-specific quote/i);
  assert.match(salisburyPage, /northern corridor/i);
  assert.match(salisburyPage, /Storage Planning Adelaide/i);
  assert.match(elizabethPage, /Book eastern-corridor move|How long moves take Adelaide/i);
  assert.match(elizabethPage, /Route and intent expansion/i);
  assert.match(noarlungaPage, /Plan coastal move/i);
  assert.match(noarlungaPage, /Storage planning Adelaide/i);
  assert.match(reynellaPage, /Book family-home move/i);
  assert.match(reynellaPage, /Avoiding damage during a move/i);
  assert.match(norwoodPage, /Book eastern-corridor move/i);
  assert.match(norwoodPage, /Adelaide Pricing Breakdown/i);
  assert.match(seafordPage, /coastal family-home access/i);
  assert.match(seafordPage, /Coastal Moving Access Adelaide/i);
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
