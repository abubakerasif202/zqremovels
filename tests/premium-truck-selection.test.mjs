import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const home = readFileSync(new URL('../site-src/content/index.html', import.meta.url), 'utf8');
const script = readFileSync(new URL('../site.js', import.meta.url), 'utf8');
test('truck cards are a dedicated section after the concise hero', () => {
  const section = home.match(/<section id="truck-selection"[\s\S]*?<\/section>/)?.[0];
  assert.ok(section, 'dedicated selection section');
  assert.equal((section.match(/name="hero_truck"/g) || []).length, 2);
  assert.equal((section.match(/class="truck-photo"/g) || []).length, 2);
  assert.match(section, /Illustrative artwork/);
  assert.doesNotMatch(home, /hero-truck-art|truck-wheel/);
  assert.ok(home.indexOf('id="truck-selection"') > home.indexOf('</section>', home.indexOf('class="zqh-hero"')));
  assert.match(home.slice(0, home.indexOf('id="truck-selection"')), /href="#truck-selection"/);
});
test('relocated controls retain one native selection and existing manual-choice guard', () => {
  assert.match(script, /document\.querySelectorAll\('#truck-selection \[name="hero_truck"\]'\)/);
  assert.match(script, /if \(!manualTruck\) selectedPackage = SIZES\[currentSizeIndex\]\.recommended/);
  assert.match(script, /ensureHiddenField\(quoteForm, "truck_preference"/);
});
