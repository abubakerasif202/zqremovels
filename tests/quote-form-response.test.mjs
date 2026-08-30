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
  };

  const context = vm.createContext({
    console: { error: noop },
    document,
    fetch: fetchImpl,
    globalThis: {},
    requestAnimationFrame: (callback) => callback(),
    URL,
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
      body: JSON.stringify({ success: true, message: 'Submitted' }),
    }),
  );

  assert.equal(result.success, true);
  assert.equal(result.message, 'Submitted');
});

test('quote form accepts successful empty Web3Forms responses', async () => {
  const result = await runSubmitWithResponse(
    createWeb3FormsResponse({ body: '', jsonRejects: true }),
  );

  assert.equal(result.success, true);
  assert.equal(result.message, 'Quote request sent.');
});

test('quote form accepts successful non-JSON Web3Forms responses', async () => {
  const result = await runSubmitWithResponse(
    createWeb3FormsResponse({ body: 'OK', jsonRejects: true }),
  );

  assert.equal(result.success, true);
  assert.equal(result.message, 'Quote request sent.');
});

test('quote form rejects failed JSON API responses with the API payload', async () => {
  await assert.rejects(
    runSubmitWithResponse(
      createWeb3FormsResponse({
        ok: false,
        body: JSON.stringify({ success: false, message: 'Invalid access key' }),
      }),
    ),
    (error) => {
      assert.equal(error.message, 'Invalid access key');
      assert.equal(error.payload.success, false);
      assert.equal(error.payload.message, 'Invalid access key');
      return true;
    },
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
    (error) => {
      assert.equal(error.message, 'Could not send the request. Please try again.');
      assert.equal(error.payload.success, false);
      assert.equal(error.payload.message, 'Could not send the request. Please try again.');
      assert.equal(error.payload.body, '<html>Service unavailable</html>');
      return true;
    },
  );
});
