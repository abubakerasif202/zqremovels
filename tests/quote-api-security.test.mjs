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
