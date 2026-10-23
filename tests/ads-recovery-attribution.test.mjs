import test from 'node:test';
import assert from 'node:assert/strict';
import { captureAttribution, getStoredAttribution, trackQuoteDiagnostic } from '../analytics.mjs';

test('paid attribution storage respects denied and granted consent without analytics PII', t => {
  const original = global.window;
  const records = new Map();
  const dataLayer = [];
  global.window = { dataLayer, location: { pathname: '/', search: '?gclid=fixture&gbraid=braid-a&wbraid=braid-b&utm_campaign=fixture' },
    sessionStorage: { getItem: k => records.get(k), setItem: (k,v) => records.set(k,v), removeItem:k=>records.delete(k) } };
  t.after(() => { global.window = original; });
  assert.deepEqual(captureAttribution(), {});
  assert.equal(records.size, 0);
  dataLayer.push(['consent', 'update', {ad_storage:'granted',analytics_storage:'granted'}]);
  assert.equal(captureAttribution().gbraid, 'braid-a');
  assert.equal(getStoredAttribution().wbraid, 'braid-b');
  trackQuoteDiagnostic('zq_quote_form_view');
  assert.deepEqual(dataLayer.at(-1), {event:'zq_quote_form_view',form_name:'quote_form'});
  dataLayer.push(['consent', 'update', {ad_storage:'denied'}]);
  assert.deepEqual(getStoredAttribution(), {});
  captureAttribution();
  assert.equal(records.size, 0);
});
