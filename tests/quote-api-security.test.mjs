import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const handler = require('../api/quote.js');
const { requestWeb3Forms } = require('../lib/server/web3forms.js');
let ipCounter = 0;

function setup(t, fetchImpl, overrides = {}) {
  const keys = ['WEB3FORMS_ACCESS_KEY', 'TURNSTILE_SECRET_KEY', 'CF_TURNSTILE_SECRET',
    'RECAPTCHA_SECRET_KEY', 'KV_REST_API_URL', 'KV_REST_API_TOKEN', 'TELEMETRY_LOG_ENDPOINT'];
  const original = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  const originalFetch = global.fetch;
  for (const key of keys) delete process.env[key];
  Object.assign(process.env, { WEB3FORMS_ACCESS_KEY: 'fictional-provider-key', ...overrides });
  global.fetch = fetchImpl;
  t.after(() => {
    global.fetch = originalFetch;
    for (const key of keys) {
      if (original[key] === undefined) delete process.env[key];
      else process.env[key] = original[key];
    }
  });
}

async function submit(payload = {}, ip = `security-test-${++ipCounter}`) {
  const req = {
    method: 'POST', headers: { accept: 'application/json', 'content-type': 'application/json' },
    socket: { remoteAddress: ip },
    async *[Symbol.asyncIterator]() {
      yield JSON.stringify({ name: 'Fictional Test', email: 'fictional@example.com',
        message: 'Fictional test only', ...payload });
    },
  };
  const res = {
    status(code) { this.statusCode = code; return this; },
    setHeader() { return this; },
    end(body) { this.body = JSON.parse(body); },
  };
  await handler(req, res);
  return res;
}

test('public honeypot blocks delivery', async t => {
  setup(t, async () => assert.fail('No network call expected'));
  assert.equal((await submit({ botcheck: 'bot' })).statusCode, 400);
});

test('public configured CAPTCHA rejects missing and failed challenges', async t => {
  let calls = 0;
  setup(t, async url => {
    assert.equal(url, 'https://challenges.cloudflare.com/turnstile/v0/siteverify');
    calls++;
    return { json: async () => ({ success: false }) };
  }, { TURNSTILE_SECRET_KEY: 'fictional-turnstile-secret' });
  assert.equal((await submit()).statusCode, 403);
  assert.equal(calls, 0);
  assert.equal((await submit({ 'cf-turnstile-response': 'invalid' })).statusCode, 403);
  assert.equal(calls, 1);
});

test('public CAPTCHA must succeed before verified delivery', async t => {
  const calls = [];
  setup(t, async url => {
    calls.push(url);
    return { ok: true, json: async () => ({ success: true }) };
  }, { TURNSTILE_SECRET_KEY: 'fictional-turnstile-secret' });
  assert.equal((await submit({ 'cf-turnstile-response': 'verified-fixture' })).statusCode, 200);
  assert.deepEqual(calls, ['https://challenges.cloudflare.com/turnstile/v0/siteverify',
    'https://api.web3forms.com/submit']);
});

test('public reCAPTCHA rejects low scores', async t => {
  setup(t, async url => {
    assert.equal(url, 'https://www.google.com/recaptcha/api/siteverify');
    return { json: async () => ({ success: true, score: 0.1 }) };
  }, { RECAPTCHA_SECRET_KEY: 'fictional-recaptcha-secret' });
  assert.equal((await submit({ 'g-recaptcha-response': 'fixture' })).statusCode, 403);
});

test('public memory rate limit still permits five and blocks sixth request', async t => {
  let deliveries = 0;
  setup(t, async () => {
    deliveries++;
    return { ok: true, json: async () => ({ success: true }) };
  });
  for (let index = 0; index < 5; index++) assert.equal((await submit({}, 'rate-fixture')).statusCode, 200);
  assert.equal((await submit({}, 'rate-fixture')).statusCode, 429);
  assert.equal(deliveries, 5);
});

test('public delivery failures never trigger success telemetry', async t => {
  setup(t, async url => {
    assert.equal(url, 'https://api.web3forms.com/submit');
    return { ok: true, status: 200, json: async () => ({ success: false }) };
  }, { TELEMETRY_LOG_ENDPOINT: 'https://telemetry.example.com' });
  const res = await submit();
  assert.equal(res.statusCode, 502);
  assert.equal(res.body.success, false);
});

test('shared transport fixes destination, secret, timeout and disallows redirects', async () => {
  await requestWeb3Forms({ access_key: 'untrusted', email: 'fictional@example.com' }, 'server-secret',
    async (url, options) => {
      assert.equal(url, 'https://api.web3forms.com/submit');
      assert.equal(options.redirect, 'error');
      assert.ok(options.signal instanceof AbortSignal);
      assert.equal(JSON.parse(options.body).access_key, 'server-secret');
      return { ok: true };
    });
});

async function submitRaw(raw, accept = 'application/json') {
  const req = {
    method: 'POST', headers: { accept, 'content-type': 'application/json' },
    socket: { remoteAddress: `raw-test-${++ipCounter}` },
    async *[Symbol.asyncIterator]() { yield raw; },
  };
  const res = {
    status(code) { this.statusCode = code; return this; },
    setHeader() { return this; }, end(body) { this.body = body; },
  };
  await handler(req, res);
  return res;
}

test('public payload bounds and object shape are enforced before delivery', async t => {
  setup(t, async () => assert.fail('No provider call expected'));
  assert.equal((await submitRaw('x'.repeat(32001))).statusCode, 413);
  for (const raw of ['null', '[]', '42', '"text"']) {
    assert.equal((await submitRaw(raw)).statusCode, 400);
  }
});

test('native quote failure escapes provider messages', async t => {
  setup(t, async () => ({ ok: false, status: 502,
    json: async () => ({ success: false, message: '<script>alert(1)</script>' }) }));
  const res = await submitRaw(JSON.stringify({ name: 'Fictional', email: 'fictional@example.com', message: 'Test' }), 'text/html');
  assert.equal(res.statusCode, 502);
  assert.ok(!res.body.includes('<script>'));
  assert.ok(res.body.includes('&lt;script&gt;'));
});

test('datastore failure retains memory abuse protection', async t => {
  let deliveries = 0;
  setup(t, async (url, options) => {
    if (url === 'https://fixture.example/') {
      assert.equal(options.redirect, 'error');
      assert.ok(options.signal instanceof AbortSignal);
      assert.equal(JSON.parse(options.body)[0], 'EVAL');
      return { ok: false, json: async () => ({ error: 'unavailable' }) };
    }
    deliveries++;
    return { ok: true, json: async () => ({ success: true }) };
  }, { KV_REST_API_URL: 'https://fixture.example', KV_REST_API_TOKEN: 'fictional' });
  for (let n = 0; n < 5; n++) assert.equal((await submit({}, 'kv-outage-fixture')).statusCode, 200);
  assert.equal((await submit({}, 'kv-outage-fixture')).statusCode, 429);
  assert.equal(deliveries, 5);
});

test('CAPTCHA truthy strings do not authorize delivery', async t => {
  setup(t, async () => ({ ok: true, json: async () => ({ success: 'false' }) }),
    { TURNSTILE_SECRET_KEY: 'fictional' });
  assert.equal((await submit({ 'cf-turnstile-response': 'fixture' })).statusCode, 403);
});

test('distributed quote rate limit uses validated atomic count', async t => {
  setup(t, async (url, options) => {
    assert.equal(url, 'https://fixture.example/');
    const command = JSON.parse(options.body);
    assert.equal(command[0], 'EVAL');
    assert.match(command[3], /^rate_limit:/);
    return { ok: true, json: async () => ({ result: 6 }) };
  }, { KV_REST_API_URL: 'https://fixture.example', KV_REST_API_TOKEN: 'fictional' });
  assert.equal((await submit()).statusCode, 429);
});
