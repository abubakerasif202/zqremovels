import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { classifyPage, renderSimpleQuoteForm } from '../scripts/simple-quote-form.mjs';

const require = createRequire(import.meta.url);
const handler = require('../api/quote.js');
const distRoot = path.join(process.cwd(), 'site-dist');

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (full.endsWith('.html')) out.push(full);
  }
  return out;
}

const pages = walk(distRoot).map((file) => ({
  rel: path.relative(distRoot, file).replaceAll('\\', '/'),
  html: readFileSync(file, 'utf8'),
}));
const isRedirect = (html) => /http-equiv="refresh"/i.test(html);
const isIndexable = (html) => !/<meta[^>]+name="robots"[^>]+noindex/i.test(html);
const EXCLUDED = new Set([
  'about/index.html', 'blog/index.html', 'insurance-and-coverage/index.html',
  'adelaide-moving-guides/index.html', '404.html',
]);
const quoteForms = (html) => html.match(/<form\b[^>]*data-quote-form="quote"[^>]*>[\s\S]*?<\/form>/gi) || [];

test('every indexable content page carries exactly the shared simple quote form', () => {
  const wrong = [];
  for (const { rel, html } of pages) {
    if (isRedirect(html) || !isIndexable(html) || EXCLUDED.has(rel)) continue;
    const expected = rel === 'index.html' ? 2 : 1;
    if (quoteForms(html).length !== expected) wrong.push(rel);
  }
  assert.deepEqual(wrong, []);
});

test('the homepage has a hero form and a bottom form', () => {
  const home = pages.find((page) => page.rel === 'index.html').html;
  assert.match(home, /<form id="quote-form-hero"/);
  assert.match(home, /<form id="quote-form"/);
});

test('simple form: four required fields, no selects, no email, no legacy transport', () => {
  for (const { rel, html } of pages) {
    for (const form of quoteForms(html)) {
      const required = [...form.matchAll(/<input\b[^>]*\brequired\b[^>]*>/g)]
        .map((match) => match[0].match(/name="([^"]+)"/)[1]).sort();
      assert.deepEqual(required, ['dropoff_suburb', 'full_name', 'phone', 'pickup_suburb'], rel);
      assert.doesNotMatch(form, /<select|name="email"|crew_package|type="radio"|data-multi-step/i, rel);
      assert.doesNotMatch(form, /api\.web3forms\.com|name="access_key"|data-netlify/i, rel);
      assert.match(form, /action="\/api\/quote\/" method="post"/, rel);
      assert.match(form, /Get My Free Quote/, rel);
      assert.match(form, /name="form_type" value="simple_quote"/, rel);
      assert.match(form, /name="botcheck"/, rel);
      assert.match(form, /<input[^>]*type="date"[^>]*>/, rel);
      assert.match(form, /<textarea[^>]*name="additional_details"/, rel);
    }
  }
});

test('no page ships a second quote handler or a client-side provider key', () => {
  for (const { rel, html } of pages) {
    assert.doesNotMatch(html, /80c3ff0c-7ae6-4aa7-bb66-567612739824|action="https:\/\/api\.web3forms/, rel);
  }
});

test('page context is passed as hidden metadata', () => {
  const norwood = pages.find((page) => page.rel === 'removalists-norwood/index.html').html;
  assert.match(norwood, /name="page_type" value="suburb"/);
  assert.match(norwood, /name="location_context" value="[^"]+"/);
  const perth = pages.find((page) => page.rel === 'adelaide-to-perth-removals/index.html').html;
  assert.match(perth, /name="page_type" value="interstate"/);
  assert.equal(classifyPage('house-removals-adelaide/index.html'), 'service');
  assert.equal(classifyPage('contact-us/index.html'), 'contact');
});

test('the component escapes page titles', () => {
  const html = renderSimpleQuoteForm({ page: { output: 'removalists-x/index.html', title: '"><script>alert(1)</script> | ZQ' } });
  assert.doesNotMatch(html, /<script>/);
});

async function submit(payload, ip) {
  const req = {
    method: 'POST', headers: { accept: 'application/json', 'content-type': 'application/json' },
    socket: { remoteAddress: ip },
    async *[Symbol.asyncIterator]() { yield JSON.stringify(payload); },
  };
  const res = { status(code) { this.statusCode = code; return this; }, setHeader() { return this; }, end(body) { this.body = JSON.parse(body); } };
  await handler(req, res);
  return res;
}

function withProvider(t, onDeliver) {
  const keys = ['WEB3FORMS_ACCESS_KEY', 'TURNSTILE_SECRET_KEY', 'CF_TURNSTILE_SECRET', 'RECAPTCHA_SECRET_KEY',
    'KV_REST_API_URL', 'KV_REST_API_TOKEN', 'TELEMETRY_LOG_ENDPOINT', 'VERCEL_ENV', 'NODE_ENV'];
  const original = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  const originalFetch = global.fetch;
  for (const key of keys) delete process.env[key];
  process.env.WEB3FORMS_ACCESS_KEY = 'fictional-provider-key';
  process.env.KV_REST_API_URL = 'https://fixture-store.example';
  process.env.KV_REST_API_TOKEN = 'fixture-only';
  const records = new Map();
  global.fetch = async (url, options) => {
    if (String(url).includes('fixture-store')) {
      const [cmd, key, value, ...flags] = JSON.parse(options.body);
      let result;
      if (cmd === 'GET') result = records.get(key) ?? null;
      else if (flags.includes('NX') && records.has(key)) result = null;
      else { records.set(key, value); result = 'OK'; }
      return { ok: true, json: async () => ({ result }) };
    }
    onDeliver(JSON.parse(options.body));
    return { ok: true, status: 200, json: async () => ({ success: true }) };
  };
  t.after(() => {
    global.fetch = originalFetch;
    for (const key of keys) {
      if (original[key] === undefined) delete process.env[key];
      else process.env[key] = original[key];
    }
  });
}

const valid = {
  form_type: 'simple_quote', full_name: 'TEST LEAD - Please ignore', phone: '0400 000 000',
  pickup_suburb: 'Norwood', dropoff_suburb: 'Glenelg',
};

test('server accepts the four-field lead, forwards context, and requires no email', async (t) => {
  const delivered = [];
  withProvider(t, (body) => delivered.push(body));
  const res = await submit({ ...valid, page_type: 'suburb', location_context: 'Norwood', additional_details: 'Third floor' }, '203.0.113.10');
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.equal(delivered.length, 1);
  assert.match(delivered[0].subject, /TEST LEAD.*Norwood to Glenelg/);
  assert.equal(delivered[0].additional_details, 'Third floor');
  assert.equal(delivered[0].location_context, 'Norwood');
  assert.equal(delivered[0].email, undefined);
});

test('server rejects each missing required field and malformed phone/email without delivering', async (t) => {
  const delivered = [];
  withProvider(t, (body) => delivered.push(body));
  let ip = 20;
  for (const field of ['full_name', 'phone', 'pickup_suburb', 'dropoff_suburb']) {
    const res = await submit({ ...valid, [field]: '  ' }, `203.0.113.${ip++}`);
    assert.equal(res.statusCode, 400, field);
  }
  assert.equal((await submit({ ...valid, phone: 'abc' }, `203.0.113.${ip++}`)).statusCode, 400);
  assert.equal((await submit({ ...valid, phone: '12345' }, `203.0.113.${ip++}`)).statusCode, 400);
  assert.equal((await submit({ ...valid, email: 'not-an-email' }, `203.0.113.${ip++}`)).statusCode, 400);
  assert.equal(delivered.length, 0);
});

test('server idempotency: a repeated submission_id is delivered once', async (t) => {
  const delivered = [];
  withProvider(t, (body) => delivered.push(body));
  const submissionId = '3f1c2d4e-5a6b-4c7d-8e9f-0a1b2c3d4e5f';
  const first = await submit({ ...valid, submission_id: submissionId }, '203.0.113.60');
  const second = await submit({ ...valid, submission_id: submissionId }, '203.0.113.61');
  assert.equal(first.statusCode, 200);
  assert.equal(second.statusCode, 200);
  assert.equal(second.body.submission_id, submissionId);
  assert.equal(delivered.length, 1);
});
