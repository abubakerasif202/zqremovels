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
