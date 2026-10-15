import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

function loadQuoteSubmitter(fetchImpl) {
  const source = readFileSync('site.js', 'utf8')
    .replace(/^import .*quote-tracking\.mjs";\r?\n/, 'const coordinateAcceptedQuote = async () => {};')
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

for (const body of ['', 'OK', '{broken', '{}', 'null', '{"success":"true"}', '{"success":false}']) {
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

test('quote form rejects HTTP failure even when JSON success is true', async () => {
  await assert.rejects(runSubmitWithResponse(createWeb3FormsResponse({ ok: false, body: '{"success":true}' })));
});
