import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const layout = readFileSync(new URL('../src/layouts/Layout.astro', import.meta.url), 'utf8');
const boot = layout.match(/<script is:inline>([\s\S]*?)<\/script>/)?.[1];
assert.ok(boot, 'inline consent boot runs before optional tag code');

function bootConsent(cookie = '') {
  const context = {
    document: { cookie },
    window: {},
    Date,
    JSON,
    Number,
  };
  context.window = context;
  vm.runInNewContext(boot, context);
  return context;
}

test('no saved user choice establishes denied Google consent defaults', () => {
  const result = bootConsent();
  assert.deepEqual(JSON.parse(JSON.stringify(Array.from(result.dataLayer[0]))), ['consent', 'default', {
    ad_storage: 'denied', analytics_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied',
  }]);
});

test('only a valid unexpired saved choice restores grants before tags', () => {
  const choice = { version: 1, analytics: true, advertising: false, updatedAt: Date.now() };
  const result = bootConsent(`zq_consent_v1=${encodeURIComponent(JSON.stringify(choice))}`);
  assert.deepEqual(JSON.parse(JSON.stringify(Array.from(result.dataLayer[0]))), ['consent', 'default', {
    ad_storage: 'denied', analytics_storage: 'granted', ad_user_data: 'denied', ad_personalization: 'denied',
  }]);
  assert.equal(result.__zqConsentChoice.analytics, true);

  const expired = bootConsent(`zq_consent_v1=${encodeURIComponent(JSON.stringify({ ...choice, updatedAt: Date.now() - 181 * 24 * 60 * 60 * 1000 }))}`);
  assert.equal(expired.dataLayer[0][2].analytics_storage, 'denied');
});

test('optional tag loaders are created only by the consent manager', () => {
  assert.match(layout, /src="\/consent-manager\.mjs"/);
  assert.doesNotMatch(layout, /src=["']https:\/\/www\.googletagmanager\.com\/gtm\.js/);
  assert.doesNotMatch(layout, /ns\.html\?id=/);
  assert.match(readFileSync(new URL('../consent-manager.mjs', import.meta.url), 'utf8'), /function loadOptionalTags/);
});
