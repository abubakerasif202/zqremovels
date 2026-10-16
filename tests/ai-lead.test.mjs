import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const { createHandler } = require('../api/ai-lead.js');
const submissionId = '8a0fa091-12e3-4aa1-90c0-f84009d805a3';

function response() {
  return {
    headers: {}, statusCode: 200,
    setHeader(name, value) { this.headers[name.toLowerCase()] = value; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
    end(body) { this.body = JSON.parse(body); return this; },
  };
}

async function invoke(handler, body, overrides = {}) {
  const res = response();
  await handler({ method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer test-server-secret-at-least-32-characters' }, body, ...overrides }, res);
  assert.equal(typeof res.body.success, 'boolean');
  assert.equal(typeof res.body.status, 'string');
  assert.equal(typeof res.body.message, 'string');
  assert.ok(Object.hasOwn(res.body, 'submission_id'));
  return res;
}


const secret = 'test-server-secret-at-least-32-characters';
const env = {
  ZQ_AI_LEAD_SECRET: secret, ZQ_AI_LEAD_ENABLED: 'true',
  KV_REST_API_URL: 'https://redis.invalid', KV_REST_API_TOKEN: 'test-token',
  WEB3FORMS_ACCESS_KEY: 'test-web3forms-key',
};
function payload(dryRun = false) {
  return { submission_id: submissionId, consent: true, dry_run: dryRun, lead: {
    full_name: 'Test Customer', phone: '0400000000', email: 'fictional@example.com',
    pickup_suburb: 'Test Pickup', dropoff_suburb: 'Test Dropoff',
    crew_package: 'Two movers', move_scope: 'Local', property_type: 'House',
    move_size: 'Two bedrooms', pickup_access: 'Ground floor', dropoff_access: 'Ground floor',
    packing_required: 'No', move_details: 'FICTIONAL TEST DATA - never send a real enquiry.',
    move_date: '2027-01-20',
  } };
}
function harness(options = {}) {
  const records = new Map();
  const calls = [];
  let deliveries = 0;
  let count = 0;
  const fetch = async (url, init) => {
    assert.equal(new URL(url).hostname, 'redis.invalid', 'All networking must remain mocked');
    const command = JSON.parse(init.body);
    calls.push(command);
    if (options.redisFailure) throw new Error('mock Redis unavailable');
    const [operation, key, value, condition] = command;
    let result;
    if (operation === 'GET') result = records.get(key) ?? null;
    else if (operation === 'EVAL') result = options.rateCount ?? ++count;
    else if (operation === 'SET') {
      if (condition === 'XX' && options.finalizeFailure) throw new Error('mock final write failure');
      const allowed = condition === 'NX' ? !records.has(key) : records.has(key);
      result = allowed ? 'OK' : null;
      if (allowed) records.set(key, value);
    } else assert.fail(`Unexpected Redis operation: ${operation}`);
    return { ok: true, json: async () => ({ result }) };
  };
  const deliver = async (...args) => {
    deliveries++;
    if (options.deliver) return options.deliver(...args);
    return { response: { ok: true, status: 200 }, result: { success: true } };
  };
  const handler = createHandler({ env: { ...env, ...options.env }, fetch, deliver });
  return { handler, records, calls, fetch, get deliveries() { return deliveries; } };
}
function check(res, code, status, success = false) {
  assert.equal(res.statusCode, code);
  assert.equal(res.body.status, status);
  assert.equal(res.body.success, success);
  assert.equal(res.headers['cache-control'], 'no-store');
}

test('authenticated fictional dry run validates without Redis or delivery configuration', async () => {
  const h = harness({ env: { ZQ_AI_LEAD_ENABLED: undefined, KV_REST_API_URL: undefined, KV_REST_API_TOKEN: undefined, WEB3FORMS_ACCESS_KEY: undefined } });
  const res = await invoke(h.handler, JSON.stringify(payload(true)));
  check(res, 200, 'dry_run', true);
  assert.equal(res.body.submission_id, submissionId);
  assert.match(res.body.message, /No enquiry was submitted/);
  assert.equal(h.calls.length, 0);
  assert.equal(h.deliveries, 0);
});

for (const authorization of [undefined, '', 'Basic test', 'Bearer wrong', ['Bearer ' + secret]]) {
  test(`authentication rejects malformed or invalid credential ${String(authorization).slice(0, 20)}`, async () => {
    const h = harness();
    const res = await invoke(h.handler, payload(true), { headers: { 'content-type': 'application/json', authorization } });
    check(res, 401, 'unauthorized');
    assert.equal(h.calls.length, 0);
    assert.equal(h.deliveries, 0);
  });
}
for (const value of [undefined, '', 'short']) {
  test(`missing or weak server secret fails closed (${String(value)})`, async () => {
    const h = harness({ env: { ZQ_AI_LEAD_SECRET: value } });
    check(await invoke(h.handler, payload(true)), 503, 'configuration_error');
    assert.equal(h.deliveries, 0);
  });
}

test('browser Origin is rejected even with correct credentials', async () => {
  const h = harness();
  check(await invoke(h.handler, payload(), { headers: { authorization: `Bearer ${secret}`, 'content-type': 'application/json', Origin: 'https://example.com' } }), 403, 'forbidden');
  assert.equal(h.calls.length, 0);
});
test('GET is not allowed and advertises POST', async () => {
  const h = harness();
  const res = await invoke(h.handler, payload(), { method: 'GET' });
  check(res, 405, 'method_not_allowed');
  assert.equal(res.headers.allow, 'POST');
});
for (const body of ['{broken', 'null', '[]', '"string"', '{}', 'x'.repeat(16385)]) {
  test(`rejects malformed, wrong-shape or oversized request (${body.slice(0, 15)})`, async () => {
    const h = harness();
    check(await invoke(h.handler, body), 400, 'invalid_request');
    assert.equal(h.deliveries, 0);
  });
}
test('rejects unsupported media types', async () => {
  const h = harness();
  check(await invoke(h.handler, payload(), { headers: { authorization: `Bearer ${secret}`, 'content-type': 'application/x-www-form-urlencoded' } }), 400, 'invalid_request');
});
for (const consent of [false, 'true', 1, null, undefined]) {
  test(`consent requires literal true: ${String(consent)}`, async () => {
    const h = harness(); const data = payload(); data.consent = consent;
    check(await invoke(h.handler, data), 400, 'invalid_request');
    assert.equal(h.deliveries, 0);
  });
}
for (const field of Object.keys(payload().lead).filter(field => field !== 'move_date')) {
  for (const invalid of [undefined, '', ' ', 12, 'bad\u0000value']) {
    test(`rejects invalid ${field}: ${String(invalid)}`, async () => {
      const h = harness(); const data = payload(); data.lead[field] = invalid;
      check(await invoke(h.handler, data), 400, 'invalid_request');
      assert.equal(h.calls.length, 0);
    });
  }
}
for (const mutate of [
  data => { data.unexpected = true; }, data => { data.lead.access_key = 'browser-secret'; },
  data => { data.submission_id = 'invalid'; }, data => { data.dry_run = 'true'; },
  data => { data.lead.email = 'not-an-email'; }, data => { data.lead.phone = 'abc123'; },
  data => { data.lead.phone = '123'; }, data => { data.lead.move_date = '2027-02-30'; },
  data => { data.lead.move_date = 'tomorrow'; }, data => { data.lead.full_name = 'a'.repeat(121); },
  data => { data.lead.move_details = 'a'.repeat(4001); },
]) {
  test(`strict payload rejects ${mutate.toString()}`, async () => {
    const h = harness(); const data = payload(); mutate(data);
    check(await invoke(h.handler, data), 400, 'invalid_request');
    assert.equal(h.deliveries, 0);
  });
}
for (const field of ['full_name', 'phone', 'email', 'pickup_suburb', 'dropoff_suburb', 'move_details']) {
  test(`dry run rejects non-fixture ${field}`, async () => {
    const h = harness(); const data = payload(true);
    data.lead[field] = ({ full_name: 'Customer', phone: '0412345678', email: 'customer@business.invalid', pickup_suburb: 'Adelaide', dropoff_suburb: 'Sydney', move_details: 'Real enquiry' })[field];
    check(await invoke(h.handler, data), 400, 'invalid_request');
    assert.equal(h.calls.length, 0);
  });
}

test('live submission is disabled by default', async () => {
  const h = harness({ env: { ZQ_AI_LEAD_ENABLED: undefined } });
  check(await invoke(h.handler, payload()), 503, 'disabled');
  assert.equal(h.deliveries, 0);
  assert.equal(h.calls.length, 0);
});
for (const missing of ['WEB3FORMS_ACCESS_KEY', 'KV_REST_API_URL', 'KV_REST_API_TOKEN']) {
  test(`live submission fails closed without ${missing}`, async () => {
    const h = harness({ env: { [missing]: undefined } });
    check(await invoke(h.handler, payload()), 503, 'configuration_error');
    assert.equal(h.deliveries, 0);
  });
}
test('Redis failure prevents upstream delivery', async () => {
  const h = harness({ redisFailure: true });
  check(await invoke(h.handler, payload()), 503, 'datastore_unavailable');
  assert.equal(h.deliveries, 0);
});
test('rate limit prevents upstream delivery', async () => {
  const h = harness({ rateCount: 31 });
  check(await invoke(h.handler, payload()), 429, 'rate_limited');
  assert.equal(h.deliveries, 0);
});
test('provider-confirmed acceptance is replayed without sending twice', async () => {
  const h = harness();
  check(await invoke(h.handler, payload()), 200, 'accepted', true);
  check(await invoke(h.handler, payload()), 200, 'accepted', true);
  assert.equal(h.deliveries, 1);
  assert.match([...h.records.values()][0], /accepted/);
});
test('reused submission ID with altered customer data conflicts', async () => {
  const h = harness(); await invoke(h.handler, payload());
  const changed = payload(); changed.lead.move_details += ' Changed.';
  check(await invoke(h.handler, changed), 409, 'conflict');
  assert.equal(h.deliveries, 1);
});
test('pending submission is replayed while a concurrent request is delivering', async () => {
  let release; const gate = new Promise(resolve => { release = resolve; });
  let started; const began = new Promise(resolve => { started = resolve; });
  const h = harness({ deliver: async () => { started(); await gate; return { response: { ok: true, status: 200 }, result: { success: true } }; } });
  const first = invoke(h.handler, payload()); await began;
  check(await invoke(h.handler, payload()), 202, 'pending');
  release(); check(await first, 200, 'accepted', true);
  assert.equal(h.deliveries, 1);
});
test('simultaneous first requests reserve the ID atomically', async () => {
  const h = harness();
  const results = await Promise.all(Array.from({ length: 10 }, () => invoke(h.handler, payload())));
  assert.equal(h.deliveries, 1);
  for (const result of results) assert.ok(['accepted', 'pending'].includes(result.body.status));
});
for (const [label, delivery, expected] of [
  ['HTTP 422 rejection', async () => ({ response: { ok: false, status: 422 }, result: { success: false } }), 'rejected'],
  ['HTTP 500 failure', async () => ({ response: { ok: false, status: 500 }, result: { success: false } }), 'unknown'],
  ['malformed success', async () => ({ response: { ok: true, status: 200 }, result: { success: 'true' } }), 'unknown'],
  ['empty JSON', async () => ({ response: { ok: true, status: 200 }, result: null }), 'unknown'],
  ['malformed JSON exception', async () => { throw new SyntaxError('Invalid JSON'); }, 'unknown'],
  ['network exception', async () => { throw new Error('network'); }, 'unknown'],
  ['timeout exception', async () => { throw new DOMException('Timeout', 'TimeoutError'); }, 'unknown'],
]) {
  test(`${label} never claims success and cannot resend on replay`, async () => {
    const h = harness({ deliver: delivery });
    check(await invoke(h.handler, payload()), 502, expected);
    check(await invoke(h.handler, payload()), 502, expected);
    assert.equal(h.deliveries, 1);
  });
}
test('failed final state persistence returns unknown and retains pending reservation', async () => {
  const h = harness({ finalizeFailure: true });
  check(await invoke(h.handler, payload()), 502, 'unknown');
  check(await invoke(h.handler, payload()), 202, 'pending');
  assert.equal(h.deliveries, 1);
});
test('delivery receives server-controlled source, consent and Web3Forms key', async () => {
  let delivered;
  const h = harness({ deliver: async (data, key) => { delivered = { data, key }; return { response: { ok: true, status: 200 }, result: { success: true } }; } });
  await invoke(h.handler, payload());
  assert.equal(delivered.key, env.WEB3FORMS_ACCESS_KEY);
  assert.equal(delivered.data.source, 'ai_receptionist');
  assert.equal(delivered.data.consent, 'Explicitly approved');
  assert.equal(delivered.data.submission_id, submissionId);
  assert.equal(delivered.data.botcheck, '');
});


test('streamed JSON requests are accepted with bounded body reading', async () => {
  const h = harness();
  const serialized = JSON.stringify(payload(true));
  const res = await invoke(h.handler, undefined, {
    async *[Symbol.asyncIterator]() { yield Buffer.from(serialized.slice(0, 40)); yield Buffer.from(serialized.slice(40)); },
  });
  check(res, 200, 'dry_run', true);
  assert.equal(h.deliveries, 0);
});
test('streamed oversized body is rejected before any delivery', async () => {
  const h = harness();
  const res = await invoke(h.handler, undefined, {
    async *[Symbol.asyncIterator]() { yield Buffer.from('x'.repeat(10000)); yield Buffer.from('x'.repeat(10000)); },
  });
  check(res, 400, 'invalid_request');
  assert.equal(h.calls.length, 0);
});
for (const [label, provider, expected] of [
  ['verified receipt', { ok: true, status: 200, json: async () => ({ success: true }) }, 'accepted'],
  ['HTTP error despite success flag', { ok: false, status: 500, json: async () => ({ success: true }) }, 'unknown'],
  ['invalid JSON receipt', { ok: true, status: 200, json: async () => { throw new SyntaxError('invalid JSON'); } }, 'unknown'],
]) {
  test(`shared Web3Forms transport handles ${label} with fully mocked network`, async () => {
    const h = harness(); let providerCalls = 0;
    const handler = createHandler({ env, fetch: async (url, init) => {
      if (new URL(url).hostname === 'redis.invalid') return h.fetch(url, init);
      assert.equal(url, 'https://api.web3forms.com/submit');
      assert.equal(init.method, 'POST');
      assert.equal(init.redirect, 'error');
      assert.ok(init.signal instanceof AbortSignal);
      const data = JSON.parse(init.body);
      assert.equal(data.access_key, env.WEB3FORMS_ACCESS_KEY);
      assert.equal(data.email, 'fictional@example.com');
      providerCalls++;
      return provider;
    } });
    check(await invoke(handler, payload()), expected === 'accepted' ? 200 : 502, expected, expected === 'accepted');
    await invoke(handler, payload());
    assert.equal(providerCalls, 1);
  });
}
