import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const layout = readFileSync(new URL('../src/layouts/Layout.astro', import.meta.url), 'utf8');
const bootstrap = layout.match(/<script is:inline>([\s\S]*?)<\/script>/)[1];
const denied = { ad_storage: 'denied', analytics_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' };
function execute(dataLayer = [], running = {}) {
  const window = { dataLayer, ...running };
  vm.runInNewContext(bootstrap, { window, document: { querySelector: () => null } });
  return window;
}
test('partial queued consent has full denied baseline before choices and events', () => {
  const choice = ['consent', 'update', { analytics_storage: 'granted' }];
  const event = { event: 'fixture' };
  const window = execute([choice, event]);
  assert.equal(window.dataLayer[0][0], 'consent');
  assert.equal(window.dataLayer[0][1], 'default');
  assert.deepEqual(JSON.parse(JSON.stringify(window.dataLayer[0][2])), denied);
  assert.equal(window.dataLayer[1], choice);
  assert.equal(window.dataLayer[2], event);
});
test('grant then revoke choices retain identity and order; bootstrap idempotent', () => {
  const grant = ['consent', 'update', { ad_storage: 'granted' }];
  const revoke = ['consent', 'update', { ad_storage: 'denied' }];
  const window = execute([grant, revoke]);
  vm.runInNewContext(bootstrap, { window, document: { querySelector: () => null } });
  assert.equal(window.dataLayer.length, 3);
  assert.equal(window.dataLayer[1], grant);
  assert.equal(window.dataLayer[2], revoke);
});
for (const marker of ['__zqGtmLoaded', '__gtagLoaded', 'google_tag_manager']) {
  test(`already running ${marker} queue is never reset or reordered`, () => {
    const grant = ['consent', 'update', { ad_storage: 'granted' }];
    const layer = [grant];
    execute(layer, { [marker]: marker === 'google_tag_manager' ? { GTM: {} } : true });
    assert.deepEqual(layer, [grant]);
  });
}
test('all three Vercel CSP scopes include only the approved additional origins', () => {
  const config = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));
  const policies = config.headers.flatMap(rule => rule.headers.filter(header => header.key === 'Content-Security-Policy').map(header => ({ scope: rule.source, value: header.value })));
  assert.equal(policies.length, 3);
  for (const { value } of policies) {
    const connect = value.match(/(?:^|;)\s*connect-src ([^;]+)/)[1].split(/\s+/);
    assert.equal(connect.filter(origin => origin === 'https://ad.doubleclick.net').length, 1);
    assert.equal(connect.filter(origin => origin === 'https://www.googleadservices.com').length, 1);
    assert.match(value, /object-src 'none'/);
    assert.match(value, /frame-ancestors/);
    assert.ok(!connect.includes('*'));
  }
});
