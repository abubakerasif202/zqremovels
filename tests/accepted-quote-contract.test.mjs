import test from 'node:test';
import assert from 'node:assert/strict';
import { trackFormSubmit, trackFormSuccess } from '../analytics.mjs';

test('accepted quote event preserves receipt contract and suppresses legacy bridge duplicates', t => {
  const original = global.window;
  const records = new Map();
  const dataLayer = [];
  global.window = {
    dataLayer,
    sessionStorage: { getItem: key => records.get(key), setItem: (key, value) => records.set(key, value) },
  };
  t.after(() => { global.window = original; });
  dataLayer.push = function (event) {
    Array.prototype.push.call(this, event);
    // Mirror the publicly documented GTM bridge without sending external events.
    if (event.event === 'generate_lead' && event.form_name === 'quote_form' && !global.window.__zqQuoteSubmittedSent) {
      global.window.__zqQuoteSubmittedSent = true;
      this.push({ event: 'zq_quote_submitted', form_name: 'quote_form' });
    }
  };
  trackFormSubmit('quote_form');
  assert.equal(dataLayer.some(event => event.event === 'zq_quote_submitted'), false);
  assert.equal(trackFormSuccess('quote_form', '3f2b8c1e-9d4a-4b6f-8a1c-2e5d7f903b14'), true);
  assert.equal(trackFormSuccess('quote_form', '3f2b8c1e-9d4a-4b6f-8a1c-2e5d7f903b14'), false);
  const events = dataLayer.filter(event => event.event === 'zq_quote_submitted');
  assert.equal(events.length, 1);
  assert.equal(events[0].form_name, 'quote_form');
  assert.equal(events[0].submission_status, 'accepted');
  assert.equal(events[0].submission_id, '3f2b8c1e-9d4a-4b6f-8a1c-2e5d7f903b14');
  global.window.__zqAcceptedLeads = new Set();
  assert.equal(trackFormSuccess('quote_form', '3f2b8c1e-9d4a-4b6f-8a1c-2e5d7f903b14'), false);
  assert.equal(trackFormSuccess('quote_form', ''), false);
});

// GTM's data model keeps the last value of each key, so a later bare zq_quote_submitted push
// (e.g. the legacy bridge) would inherit accepted/submission_id and convert again.
test('accepted event clears its submission keys from the GTM data model afterwards', t => {
  const original = global.window;
  const dataLayer = [];
  global.window = { dataLayer, sessionStorage: { getItem: () => null, setItem: () => {} } };
  t.after(() => { global.window = original; });
  assert.equal(trackFormSuccess('contact-us_quote_1', '7c9e6679-7425-40de-944b-e07fc1f90ae7'), true);
  const accepted = dataLayer.find(event => event.event === 'zq_quote_submitted');
  // Reset only after GTM has processed the event, with no timeout, so it can never run before the
  // conversion tag reads the keys, whatever the load order of gtm.js.
  assert.equal(dataLayer.some(event => !event.event), false);
  assert.equal(typeof accepted.eventCallback, 'function');
  assert.equal('eventTimeout' in accepted, false);
  accepted.eventCallback();
  const reset = dataLayer.at(-1);
  assert.equal(reset.event, undefined);
  for (const key of ['form_name', 'submission_status', 'submission_id', 'lead_id', 'source_form', 'lead_type']) {
    assert.equal(Object.hasOwn(reset, key) && reset[key] === undefined, true, key);
  }
});

test('chat acceptance keeps the accepted contract and adds no redirect callback', t => {
  const original = global.window;
  const dataLayer = [];
  global.window = { dataLayer, sessionStorage: { getItem: () => null, setItem: () => {} } };
  t.after(() => { global.window = original; });
  assert.equal(trackFormSuccess('ai_chat_enquiry', '9b2f4a1c-3d5e-4f60-8a7b-1c2d3e4f5a6b'), true);
  const accepted = dataLayer.find(event => event.event === 'zq_quote_submitted');
  assert.equal(accepted.form_name, 'quote_form');
  assert.equal(accepted.source_form, 'ai_chat_enquiry');
  assert.equal(dataLayer.some(event => 'eventTimeout' in event), false);
  assert.equal('eventCallback' in dataLayer.find(event => event.event === 'generate_lead'), false);
});
