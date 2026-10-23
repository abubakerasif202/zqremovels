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

test('native quote failure keeps provider messages private', async t => {
  setup(t, async () => ({ ok: false, status: 502,
    json: async () => ({ success: false, message: '<script>alert(1)</script>' }) }));
  const res = await submitRaw(JSON.stringify({ name: 'Fictional', email: 'fictional@example.com', message: 'Test' }), 'text/html');
  assert.equal(res.statusCode, 502);
  assert.ok(!res.body.includes('<script>'));
  assert.ok(!res.body.includes('&lt;script&gt;'));
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

test('durable server receipt replays acceptance without a second provider delivery', async t => {
  const records = new Map();
  let deliveries = 0;
  setup(t, async (url, options) => {
    if (url.includes('fixture-store')) {
      const [cmd, key, value, ...flags] = JSON.parse(options.body);
      let result;
      if (cmd === 'EVAL') result = 1;
      else if (cmd === 'GET') result = records.get(key) || null;
      else if (flags.includes('NX') && records.has(key)) result = null;
      else { records.set(key, value); result = 'OK'; }
      return { ok: true, json: async () => ({ result }) };
    }
    deliveries++;
    assert.match(JSON.parse(options.body).submission_id, /^3f2b/);
    return { ok: true, json: async () => ({ success: true }) };
  }, { KV_REST_API_URL: 'https://fixture-store.example', KV_REST_API_TOKEN: 'fixture-only' });
  const submission_id = '3f2b8c1e-9d4a-4b6f-8a1c-2e5d7f903b14';
  const first = await submit({ submission_id });
  assert.equal(first.statusCode, 200);
  assert.equal(first.body.submission_status, 'accepted');
  assert.equal(first.body.submission_id, submission_id);
  assert.equal((await submit({ submission_id })).body.submission_id, submission_id);
  assert.equal(deliveries, 1);
  assert.equal((await submit({ submission_id, message: 'Changed details' })).statusCode, 409);
  assert.equal(deliveries, 1);
});

test('receipt storage outage fails closed before provider delivery', async t => {
  setup(t, async () => assert.fail('No provider delivery without durable receipts'));
  const result = await submit({ submission_id: '3f2b8c1e-9d4a-4b6f-8a1c-2e5d7f903b14' });
  assert.equal(result.statusCode, 503);
  assert.equal(result.body.success, false);
});

test('ambiguous provider outcomes retain pending receipt and block resend', async t => {
  const records = new Map();
  let deliveries = 0;
  setup(t, async (url, options) => {
    if (url.includes('fixture-store')) {
      const [cmd, key, value, ...flags] = JSON.parse(options.body);
      let result;
      if (cmd === 'EVAL') result = 1;
      else if (cmd === 'GET') result = records.get(key) || null;
      else if (flags.includes('NX') && records.has(key)) result = null;
      else { records.set(key, value); result = 'OK'; }
      return { ok: true, json: async () => ({ result }) };
    }
    deliveries++;
    throw new Error('fixture timeout');
  }, { KV_REST_API_URL: 'https://fixture-store.example', KV_REST_API_TOKEN: 'fixture-only' });
  const submission_id = '3f2b8c1e-9d4a-4b6f-8a1c-2e5d7f903b14';
  assert.equal((await submit({ submission_id })).statusCode, 502);
  assert.equal((await submit({ submission_id })).statusCode, 409);
  assert.equal(deliveries, 1);
});

test('failure to persist provider acceptance never returns an eligible receipt or resends', async t => {
  const records = new Map();
  let deliveries = 0;
  setup(t, async (url, options) => {
    if (url.includes('fixture-store')) {
      const [cmd, key, value, ...flags] = JSON.parse(options.body);
      let result;
      if (cmd === 'EVAL') result = 1;
      else if (cmd === 'GET') result = records.get(key) || null;
      else if (flags.includes('XX')) throw new Error('fixture write outage');
      else if (records.has(key)) result = null;
      else { records.set(key, value); result = 'OK'; }
      return { ok: true, json: async () => ({ result }) };
    }
    deliveries++;
    return { ok: true, json: async () => ({ success: true }) };
  }, { KV_REST_API_URL: 'https://fixture-store.example', KV_REST_API_TOKEN: 'fixture-only' });
  const payload = { submission_id: '3f2b8c1e-9d4a-4b6f-8a1c-2e5d7f903b14' };
  const first = await submit(payload);
  assert.equal(first.statusCode, 503);
  assert.equal(first.body.status, 'pending');
  assert.equal(first.body.submission_id, undefined);
  assert.equal((await submit(payload)).statusCode, 409);
  assert.equal(deliveries, 1);
});

function receiptTransport(provider) {
  const rows=new Map();
  return async(url,options)=>{
    if(!url.includes('fixture-store'))return provider(url,options);
    const [cmd,key,value,...flags]=JSON.parse(options.body);let result=null;
    if(cmd==='EVAL')result=1;
    else if(cmd==='GET')result=rows.get(key)??null;
    else if((flags.includes('NX')&&!rows.has(key))||(flags.includes('XX')&&rows.has(key))){rows.set(key,value);result='OK';}
    return {ok:true,json:async()=>({result})};
  };
}
const receiptEnv={KV_REST_API_URL:'https://fixture-store.example',KV_REST_API_TOKEN:'fixture-only'};
const receiptId='3f2b8c1e-9d4a-4b6f-8a1c-2e5d7f903b14';

test('explicit provider rejection permits a new corrected request, never a conversion',async t=>{
  let deliveries=0;
  setup(t,receiptTransport(async()=>{deliveries++;return {ok:deliveries>1,status:deliveries===1?400:200,json:async()=>({success:deliveries>1})};}),receiptEnv);
  assert.equal((await submit({submission_id:receiptId})).body.status,'rejected');
  const repeat=await submit({submission_id:receiptId});assert.equal(repeat.body.status,'rejected');assert.equal(repeat.body.success,false);
  assert.equal(deliveries,1);
  const corrected=await submit({submission_id:'7c9e6679-7425-40de-944b-e07fc1f90ae7'});
  assert.equal(corrected.body.submission_status,'accepted');assert.equal(deliveries,2);
});

test('accepted replay survives consumed CAPTCHA and changed URL/consent attribution',async t=>{
  let challenges=0,deliveries=0;
  setup(t,receiptTransport(async url=>{
    if(url.includes('turnstile')){challenges++;return {ok:true,json:async()=>({success:challenges===1})};}
    deliveries++;return {ok:true,status:200,json:async()=>({success:true})};
  }),{...receiptEnv,TURNSTILE_SECRET_KEY:'fixture-only'});
  const first=await submit({submission_id:receiptId,'cf-turnstile-response':'fixture-once',source_page:'https://example.invalid/?gclid=fixture',gclid:'fixture'});
  assert.equal(first.body.submission_status,'accepted');
  const replay=await submit({submission_id:receiptId,source_page:'https://example.invalid/',gclid:'',utm_campaign:'fixture-changed'});
  assert.equal(replay.body.submission_id,receiptId);assert.equal(replay.body.submission_status,'accepted');
  assert.equal(challenges,1);assert.equal(deliveries,1);
  assert.equal((await submit({submission_id:'7c9e6679-7425-40de-944b-e07fc1f90ae7'})).statusCode,403);
  assert.equal(deliveries,1);
});

test('concurrent retries deliver once while the other response is pending or accepted',async t=>{
  let deliveries=0;
  setup(t,receiptTransport(async()=>{deliveries++;await new Promise(resolve=>setTimeout(resolve,10));return {ok:true,status:200,json:async()=>({success:true})};}),receiptEnv);
  const results=await Promise.all([submit({submission_id:receiptId}),submit({submission_id:receiptId})]);
  assert.equal(deliveries,1);assert.ok(results.some(r=>r.body.submission_status==='accepted'));
  assert.ok(results.every(r=>r.body.submission_status==='accepted'||r.body.status==='pending'));
});

test('exception diagnostics omit raw request and transport context',async t=>{
  setup(t,async()=>{throw new Error('fixture-private-context@example.invalid');});
  const original=console.error;const logs=[];console.error=(...args)=>logs.push(args.join(' '));
  t.after(()=>{console.error=original;});
  assert.equal((await submit()).statusCode,502);
  await submitRaw('{"email":"fixture-private-context@example.invalid",','application/json');
  assert.ok(logs.length>=2);
  assert.ok(!logs.join(' ').includes('fixture-private-context'));
});

test('HTTP 202 negative reply remains ambiguous and cannot unlock a resend',async t=>{
  let deliveries=0;
  setup(t,receiptTransport(async()=>{deliveries++;return {ok:true,status:202,json:async()=>({success:false})};}),receiptEnv);
  assert.equal((await submit({submission_id:receiptId})).body.status,'pending');
  assert.equal((await submit({submission_id:receiptId})).body.status,'pending');
  assert.equal(deliveries,1);
});
