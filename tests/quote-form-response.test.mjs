import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

function loadQuoteSubmitter(fetchImpl) {
  const source = readFileSync('site.js', 'utf8')
    .replace(
      /^import[\s\S]*?from "\.\/analytics\.mjs";/,
      `const getStoredAttribution = () => ({});
function initAnalytics() {}
function trackCallClick() {}
function trackEmailClick() {}
function trackFormSuccess() {}
function trackFormStart() {}
function trackFormSubmit() {}
function trackMobileMenuOpen() {}
function trackOutboundClick() {}
function trackQuoteClick() {}
function trackStickyCtaClick() {}
function trackPricePageCTA() {}
function trackSuburbCTA() {}
function trackServiceCTA() {}`,
    )
    .concat('\nglobalThis.__quoteFormTest = { submitQuoteForm };\n');

  const noop = () => {};
  const classList = { add: noop, contains: () => false, toggle: noop };
  const document = {
    body: { className: '', classList },
    documentElement: { classList },
    addEventListener: noop,
    createElement: () => ({
      setAttribute: noop,
      appendChild: noop,
      classList,
      dataset: {},
      style: {},
    }),
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => [],
  };
  const window = {
    addEventListener: noop,
    location: {
      assign: noop,
      href: 'https://zqremovalsadelaide.com.au/contact-us/',
      hostname: 'zqremovalsadelaide.com.au',
      origin: 'https://zqremovalsadelaide.com.au',
      pathname: '/contact-us/',
    },
    matchMedia: () => ({ matches: false }),
    sessionStorage: {
      getItem: () => null,
      setItem: noop,
    },
    scrollY: 0,
    crypto: { randomUUID: () => "3f2b8c1e-9d4a-4b6f-8a1c-2e5d7f903b14" },
  };

  const context = vm.createContext({
    console: { error: noop },
    document,
    fetch: fetchImpl,
    globalThis: {},
    requestAnimationFrame: (callback) => callback(),
    URL,
    AbortSignal,
    WeakSet,
    window,
  });

  vm.runInContext(source, context);
  return context.globalThis.__quoteFormTest.submitQuoteForm;
}

function createWeb3FormsResponse({ ok = true, body = '', jsonRejects = false } = {}) {
  return {
    ok,
    async text() {
      return body;
    },
    async json() {
      if (jsonRejects || body === '') {
        throw new SyntaxError('Unexpected end of JSON input');
      }
      return JSON.parse(body);
    },
  };
}

async function runSubmitWithResponse(response) {
  const submitQuoteForm = loadQuoteSubmitter(async () => response);
  return submitQuoteForm({}, {
    access_key: 'test-key',
    email: 'customer@example.com',
    message: 'Moving next week',
    name: 'Customer',
    phone: '0400000000',
  });
}

test('quote form accepts successful JSON Web3Forms responses', async () => {
  const result = await runSubmitWithResponse(
    createWeb3FormsResponse({
      body: JSON.stringify({ success: true, submission_status: 'accepted', submission_id: '3f2b8c1e-9d4a-4b6f-8a1c-2e5d7f903b14', message: 'Submitted' }),
    }),
  );

  assert.equal(result.success, true);
  assert.equal(result.message, 'Submitted');
});

for (const body of ['', 'OK', '{broken', '{}', 'null', '{"success":true}', '{"success":true,"submission_status":"accepted","submission_id":"invalid"}', '{"success":"true"}', '{"success":false}']) {
  test(`quote form rejects unconfirmed HTTP 200 response: ${body}`, async () => {
    await assert.rejects(runSubmitWithResponse(createWeb3FormsResponse({ body })));
  });
}

test('quote form rejects network failures', async () => {
  const submit = loadQuoteSubmitter(async () => { throw new Error('network'); });
  await assert.rejects(submit({}, {}));
});

test('quote form rejects failed JSON API responses with the API payload', async () => {
  await assert.rejects(
    runSubmitWithResponse(
      createWeb3FormsResponse({
        ok: false,
        body: JSON.stringify({ success: false, message: 'Invalid access key' }),
      }),
    ),
    /Could not send the request/,
  );
});

test('quote form rejects failed non-JSON API responses with response details', async () => {
  await assert.rejects(
    runSubmitWithResponse(
      createWeb3FormsResponse({
        ok: false,
        body: '<html>Service unavailable</html>',
        jsonRejects: true,
      }),
    ),
    /Could not send the request/,
  );
});

test('revoked consent cannot reuse stale hidden advertising attribution', async () => {
  let sent;
  const submit = loadQuoteSubmitter(async (_url, options) => {
    sent = JSON.parse(options.body);
    return createWeb3FormsResponse({ body: JSON.stringify({success:true,submission_status:'accepted',submission_id:'3f2b8c1e-9d4a-4b6f-8a1c-2e5d7f903b14'}) });
  });
  await submit({}, { gclid:'fixture-stale', utm_campaign:'fixture-stale' });
  assert.equal(sent.gclid, '');
  assert.equal(sent.utm_campaign, '');
});

test('quote transport forwards configured CAPTCHA response fields without adding them to analytics',async()=>{
  let sent;
  const submit=loadQuoteSubmitter(async(_url,options)=>{
    sent=JSON.parse(options.body);
    return createWeb3FormsResponse({body:JSON.stringify({success:true,submission_status:'accepted',submission_id:'3f2b8c1e-9d4a-4b6f-8a1c-2e5d7f903b14'})});
  });
  await submit({}, {'cf-turnstile-response':'fixture-turnstile','g-recaptcha-response':'fixture-recaptcha'});
  assert.equal(sent['cf-turnstile-response'],'fixture-turnstile');
  assert.equal(sent['g-recaptcha-response'],'fixture-recaptcha');
});
