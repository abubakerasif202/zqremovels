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
  assert.match(homepage, /href="\/removalists-northern-adelaide\/"/);
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
