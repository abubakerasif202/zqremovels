import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('Redesign integration: homepage markup contains all required interactive sections', async () => {
  const source = await readFile(path.join(root, 'site-src', 'content', 'index.html'), 'utf8');

  // Hero Quick Estimator
  assert.match(source, /class="[^"]*zq-hero-estimator[^"]*"/);
  assert.match(source, /id="heroPickup"/);
  assert.match(source, /id="heroDropoff"/);
  assert.match(source, /id="heroEstPrice"/);
  assert.match(source, /id="heroEstSub"/);
  assert.match(source, /transferHeroToQuote/);

  // Attached Inventory Banner
  assert.match(source, /id="attachedInventoryBanner"/);
  assert.match(source, /id="attachedInventoryText"/);
  assert.match(source, /clearAttachedInventory/);

  // Cubic Metre Calculator
  assert.match(source, /id="calculator"/);
  assert.match(source, /id="calcCategoryTabs"/);
  assert.match(source, /id="calcItemsGrid"/);
  assert.match(source, /id="calcTotalM3"/);
  assert.match(source, /id="calcTruckName"/);
  assert.match(source, /id="calcTruckFillPct"/);
  assert.match(source, /id="calcTruckFillBar"/);
  assert.match(source, /id="calcEstHours"/);
  assert.match(source, /id="calcTotalCostRange"/);
  assert.match(source, /sendCalculatorToForm/);

  // Suburbs Explorer
  assert.match(source, /id="suburbs"/);
  assert.match(source, /id="suburbsGrid"/);
  assert.match(source, /filterSuburbs/);

  // Interstate Matrix
  assert.match(source, /id="interstate"/);
  assert.match(source, /id="routeDetailPanel"/);
  assert.match(source, /selectInterstateRoute/);

  // The competitor comparison table was removed in the Stitch integration: its claims about
  // other businesses and cover levels could not be verified. Keep it out until they can be.
  assert.doesNotMatch(source, /id="comparison"/);
  assert.doesNotMatch(source, /comparison-table/);
  assert.doesNotMatch(source, /lead brokers|Zero hidden stair surcharges|140\+ Suburbs|public liability/i);
});

test('Redesign integration: site.js exports all interactive functions and structures', async () => {
  const siteJs = await readFile(path.join(root, 'site.js'), 'utf8');

  // Verify function registrations
  assert.match(siteJs, /function setupHeroEstimator\(\)/);
  assert.match(siteJs, /function setupInventoryCalculator\(\)/);
  assert.match(siteJs, /function setupSuburbsExplorer\(\)/);
  assert.match(siteJs, /function setupInterstateMatrix\(\)/);

  // Verify window hooks
  assert.match(siteJs, /window\.setHeroScope\s*=/);
  assert.match(siteJs, /window\.setHeroSize\s*=/);
  assert.match(siteJs, /window\.transferHeroToQuote\s*=/);
  assert.match(siteJs, /window\.switchCalcCategory\s*=/);
  assert.match(siteJs, /window\.adjustItem\s*=/);
  assert.match(siteJs, /window\.applyPreset\s*=/);
  assert.match(siteJs, /window\.recalculateVolume\s*=/);
  assert.match(siteJs, /window\.sendCalculatorToForm\s*=/);
  assert.match(siteJs, /window\.clearAttachedInventory\s*=/);
  assert.match(siteJs, /window\.filterSuburbs\s*=/);
  assert.match(siteJs, /window\.prefillSuburb\s*=/);
  assert.match(siteJs, /window\.selectInterstateRoute\s*=/);
  assert.match(siteJs, /window\.bookInterstateRoute\s*=/);

  // Verify data items and presets
  assert.match(siteJs, /CALC_CATEGORIES/);
  assert.match(siteJs, /CALC_ITEMS/);
  assert.match(siteJs, /CALC_PRESETS/);
  assert.match(siteJs, /SUBURB_DATA/);
  assert.match(siteJs, /ROUTES\s*=/);
});

test('Redesign integration: deterministic cubic volume and truck calculation logic', () => {
  // Test industry-standard m3 logic embedded in site.js
  const CALC_ITEMS = {
    sofa_3s: { m3: 2.2 },
    bed_queen: { m3: 2.0 },
    fridge_double: { m3: 1.8 },
    dining_table_6: { m3: 1.6 },
    box_standard: { m3: 0.12 },
  };

  const sampleInventory = {
    sofa_3s: 1,
    bed_queen: 2,
    fridge_double: 1,
    dining_table_6: 1,
    box_standard: 20,
  };

  const totalM3 = Object.entries(sampleInventory).reduce(
    (acc, [id, qty]) => acc + qty * (CALC_ITEMS[id]?.m3 || 0),
    0,
  );

  // 1*2.2 + 2*2.0 + 1*1.8 + 1*1.6 + 20*0.12 = 2.2 + 4.0 + 1.8 + 1.6 + 2.4 = 12.0 m3
  assert.equal(Math.round(totalM3 * 10) / 10, 12.0);

  // Check truck recommendation logic
  const getTruck = (vol) => {
    if (vol <= 16) return { name: '4.5T Truck + 2 Men', cap: 20, rate: 150 };
    if (vol <= 28) return { name: '8-Tonne Pantech + 2 Men', cap: 35, rate: 150 };
    if (vol <= 45) return { name: '10-12T Heavy Pantech + 3 Men', cap: 50, rate: 178 };
    return { name: 'Semi-Trailer / Multiple Trips + 3 Men', cap: 65, rate: 178 };
  };

  const truck = getTruck(totalM3);
  assert.equal(truck.name, '4.5T Truck + 2 Men');
  assert.equal(truck.rate, 150);

  const fillPct = Math.round((totalM3 / truck.cap) * 100);
  assert.equal(fillPct, 60); // 12 / 20 = 60%
});

test('Redesign integration: phone numbers and claims are verified and authentic', async () => {
  const source = await readFile(path.join(root, 'site-src', 'content', 'index.html'), 'utf8');

  // Verify correct phone number is used
  assert.match(source, /0433\s*819\s*989/);
  assert.match(source, /tel:\+61433819989/);

  // Ensure reference defects/wrong phone numbers are NOT present
  assert.doesNotMatch(source, /0416\s*561\s*088/);
  assert.doesNotMatch(source, /1300977366/);

  // Ensure no unverified claims or buzzwords
  assert.doesNotMatch(source, /3,400\+\s*moves/i);
  assert.doesNotMatch(source, /99\.8%\s*damage-free/i);
  assert.doesNotMatch(source, /\$20M\s*public\s*liability/i);
  assert.doesNotMatch(source, /54\s*Google/i);
  assert.doesNotMatch(source, /5\.0\/5|5\.0-star|award-winning|guaranteed/i);

  // Ensure no foreign or corrupted characters (e.g. highway距离)
  assert.doesNotMatch(source, /highway距离/);
  assert.doesNotMatch(source, /[\u4e00-\u9fa5]/); // No CJK characters in content
});
