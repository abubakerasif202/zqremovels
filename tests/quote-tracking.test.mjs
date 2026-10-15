import assert from 'node:assert/strict';
import test from 'node:test';
import { coordinateAcceptedQuote } from '../quote-tracking.mjs';

const first = '11111111-1111-4111-8111-111111111111';
const second = '22222222-2222-4222-8222-222222222222';
function harness(ids = [first]) {
  const timers = new Map();
  const events = [];
  let nextTimer = 0;
  const win = {
    crypto: { randomUUID: () => ids.shift() },
    setTimeout(fn, delay) { assert.equal(delay, 1600); timers.set(++nextTimer, fn); return nextTimer; },
    clearTimeout(id) { timers.delete(id); },
    dataLayer: { push(event) { events.push(event); } },
    get sessionStorage() { throw new Error('Tracking must not access storage'); },
    get localStorage() { throw new Error('Tracking must not access storage'); },
  };
  return { win, events, timers, expire() { for (const fn of [...timers.values()]) fn(); } };
}

test('accepted event is literal, PII-free, locally identified and registered before push', async () => {
  const h = harness();
  h.win.dataLayer.push = (event) => {
    h.events.push(event);
    assert.equal(h.win.__zqClaimAcceptedQuoteForAds(event.submission_id, event.form_name, event.submission_status), true);
    event.eventCallback();
  };
  await coordinateAcceptedQuote(h.win);
  assert.equal(h.events.length, 1);
  const { eventCallback, ...event } = h.events[0];
  assert.equal(typeof eventCallback, 'function');
  assert.deepEqual(event, { event: 'zq_quote_submitted', form_name: 'quote_form', submission_status: 'accepted', submission_id: first, eventTimeout: 1500 });
  assert.equal(h.timers.size, 0);
});

test('same ID replay and stale fields fail; distinct accepted IDs each claim once', async () => {
  const h = harness([first, first, second]);
  const p = coordinateAcceptedQuote(h.win);
  const claim = h.win.__zqClaimAcceptedQuoteForAds;
  for (const args of [[null, 'quote_form', 'accepted'], [second, 'quote_form', 'accepted'], [first, 'other', 'accepted'], [first, 'quote_form', 'rejected']]) assert.equal(claim(...args), false);
  assert.equal(claim(first, 'quote_form', 'accepted'), true);
  assert.equal(claim(first, 'quote_form', 'accepted'), false);
  h.events[0].eventCallback(); await p;
  await coordinateAcceptedQuote(h.win);
  assert.equal(h.events.length, 1);
  const p2 = coordinateAcceptedQuote(h.win);
  assert.equal(claim(second, 'quote_form', 'accepted'), true);
  assert.equal(claim(second, 'quote_form', 'accepted'), false);
  h.events[1].eventCallback(); await p2;
  const fresh = harness([second]);
  const freshPending = coordinateAcceptedQuote(fresh.win);
  assert.equal(fresh.win.__zqClaimAcceptedQuoteForAds(first, 'quote_form', 'accepted'), false);
  fresh.expire(); await freshPending;
});

test('blocked GTM settles at outer deadline and late callbacks cannot repeat completion', async () => {
  const h = harness();
  let completed = 0;
  const pending = coordinateAcceptedQuote(h.win).then(() => { completed++; });
  await Promise.resolve(); assert.equal(completed, 0);
  h.expire(); await pending;
  assert.equal(h.win.__zqClaimAcceptedQuoteForAds(first, 'quote_form', 'accepted'), false);
  h.events[0].eventCallback(); h.events[0].eventCallback();
  await Promise.resolve();
  assert.equal(completed, 1); assert.equal(h.events.length, 1); assert.equal(h.timers.size, 0);
});

test('tracker throws and unavailable crypto preserve accepted completion', async () => {
  for (const failure of ['push', 'crypto']) {
    const h = harness();
    if (failure === 'push') h.win.dataLayer.push = () => { throw new Error('blocked'); };
    else h.win.crypto.randomUUID = () => { throw new Error('unavailable'); };
    await coordinateAcceptedQuote(h.win);
    assert.equal(h.timers.size, 0);
  }
});
