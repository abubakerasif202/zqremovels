import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const handler = require('../api/quote.js');

function createResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: '',
    status(code) {
      this.statusCode = code;
      return this;
    },
    setHeader(name, value) {
      this.headers[name.toLowerCase()] = value;
      return this;
    },
    end(payload) {
      this.body = payload;
      return this;
    },
  };
}

function createRequest(payload, headers = {}, remoteAddress = '127.0.0.1') {
  return {
    method: 'POST',
    headers: {
      accept: 'application/json',
      ...headers,
    },
    socket: {
      remoteAddress,
    },
    async *[Symbol.asyncIterator]() {
      yield JSON.stringify(payload);
    },
  };
}

function createFormRequest(body, headers = {}, remoteAddress = '127.0.0.1') {
  return {
    method: 'POST',
    headers,
    socket: {
      remoteAddress,
    },
    async *[Symbol.asyncIterator]() {
      yield body;
    },
  };
}

const validPayload = {
  botcheck: '',
  pickup_suburb: 'Adelaide',
  dropoff_suburb: 'Glenelg',
  crew_package: '2 Men + Truck — $75 / 30 min',
  move_scope: 'house-removal',
  property_type: 'house',
  move_date: '2026-04-15',
  move_size: '3-bedroom',
  pickup_access: 'ground-level',
  dropoff_access: 'stairs',
  packing_required: 'partial-packing',
  full_name: 'Test User',
  phone: '+61 400 000 000',
  email: 'test@example.com',
  move_details: 'Two sofas, a fridge, and stair access at the drop-off property.',
  source_page: 'https://zqremovals.au/contact-us/',
  attribution: {
    utm_source: 'google',
    utm_medium: 'cpc',
    utm_campaign: 'adelaide-removals',
    utm_content: 'hero-cta',
    utm_term: 'fixed-price-quote',
    gclid: 'test-gclid',
    fbclid: 'test-fbclid',
    landing_page: 'https://zqremovals.au/?utm_source=google',
  },
};

const simpleContactPayload = {
  botcheck: '',
  name: 'Simple Contact User',
  email: 'simple@example.com',
  phone: '+61 411 111 111',
  message: 'Need a quote for a move next month.',
  source_page: 'https://zqremovals.au/contact-us/',
};

async function runMissingKeySmoke() {
  const originalFetch = global.fetch;
  const originalKey = process.env.WEB3FORMS_ACCESS_KEY;
  const originalLegacyKey = process.env.VITE_WEB3FORMS_ACCESS_KEY;
  delete process.env.WEB3FORMS_ACCESS_KEY;
  delete process.env.VITE_WEB3FORMS_ACCESS_KEY;
  global.fetch = async () => {
    throw new Error('fetch should not be called without an access key');
  };

  try {
    const res = createResponse();
    await handler(createRequest(validPayload), res);

    assert.equal(res.statusCode, 500);
    assert.equal(res.headers['content-type'], 'application/json');

    const body = JSON.parse(res.body);
    assert.equal(body.success, false);
    assert.equal(body.message, 'Quote service unavailable');
    assert.match(body.details, /Missing Web3Forms access key/);
  } finally {
    if (originalFetch === undefined) {
      delete global.fetch;
    } else {
      global.fetch = originalFetch;
    }

    if (originalKey === undefined) {
      delete process.env.WEB3FORMS_ACCESS_KEY;
    } else {
      process.env.WEB3FORMS_ACCESS_KEY = originalKey;
    }

    if (originalLegacyKey === undefined) {
      delete process.env.VITE_WEB3FORMS_ACCESS_KEY;
    } else {
      process.env.VITE_WEB3FORMS_ACCESS_KEY = originalLegacyKey;
    }
  }
}

async function runLegacyKeySmoke() {
  const originalFetch = global.fetch;
  const originalKey = process.env.WEB3FORMS_ACCESS_KEY;
  const originalLegacyKey = process.env.VITE_WEB3FORMS_ACCESS_KEY;
  delete process.env.WEB3FORMS_ACCESS_KEY;
  process.env.VITE_WEB3FORMS_ACCESS_KEY = 'legacy-test-key';

  let upstreamBody = null;
  global.fetch = async (_url, options) => {
    upstreamBody = JSON.parse(options.body);
    return {
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    };
  };

  try {
    const res = createResponse();
    await handler(
      createRequest(
        validPayload,
        {
          'x-forwarded-for': '203.0.113.10',
          'x-vercel-ip-city': 'Adelaide%20CBD',
          'x-vercel-ip-country-region': 'South Australia',
          'x-vercel-ip-country': 'AU',
          'x-vercel-ip-timezone': 'Australia/Adelaide',
        },
      ),
      res,
    );

    assert.equal(res.statusCode, 200);
    assert.equal(res.headers['content-type'], 'application/json');
    assert.deepEqual(JSON.parse(res.body), {
      success: true,
      message: 'Quote submitted',
    });
    assert.equal(upstreamBody.access_key, 'legacy-test-key');
    assert.equal(upstreamBody.subject, 'Quote request - ZQ Removals');
    assert.equal(upstreamBody.botcheck, '');
    assert.equal(upstreamBody.source_page, validPayload.source_page);
    assert.equal(upstreamBody.dropoff_suburb, validPayload.dropoff_suburb);
    assert.equal(upstreamBody.crew_package, validPayload.crew_package);
    assert.equal(upstreamBody.move_scope, validPayload.move_scope);
    assert.equal(upstreamBody.full_name, validPayload.full_name);
    assert.equal(upstreamBody.move_details, validPayload.move_details);
    assert.equal(upstreamBody.utm_source, validPayload.attribution.utm_source);
    assert.equal(upstreamBody.utm_medium, validPayload.attribution.utm_medium);
    assert.equal(upstreamBody.utm_campaign, validPayload.attribution.utm_campaign);
    assert.equal(upstreamBody.gclid, validPayload.attribution.gclid);
    assert.equal(upstreamBody.fbclid, validPayload.attribution.fbclid);
    assert.equal(upstreamBody._edge_ip, '203.0.113.10');
    assert.equal(upstreamBody._edge_location, 'Adelaide CBD, South Australia, AU');
    assert.equal(upstreamBody._edge_timezone, 'Australia/Adelaide');
  } finally {
    if (originalFetch === undefined) {
      delete global.fetch;
    } else {
      global.fetch = originalFetch;
    }

    if (originalKey === undefined) {
      delete process.env.WEB3FORMS_ACCESS_KEY;
    } else {
      process.env.WEB3FORMS_ACCESS_KEY = originalKey;
    }

    if (originalLegacyKey === undefined) {
      delete process.env.VITE_WEB3FORMS_ACCESS_KEY;
    } else {
      process.env.VITE_WEB3FORMS_ACCESS_KEY = originalLegacyKey;
    }
  }
}

async function runSimpleContactPayloadSmoke() {
  const originalFetch = global.fetch;
  const originalKey = process.env.WEB3FORMS_ACCESS_KEY;
  process.env.WEB3FORMS_ACCESS_KEY = 'primary-test-key';

  let upstreamBody = null;
  global.fetch = async (_url, options) => {
    upstreamBody = JSON.parse(options.body);
    return {
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    };
  };

  try {
    const res = createResponse();
    await handler(createRequest(simpleContactPayload), res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(JSON.parse(res.body), {
      success: true,
      message: 'Quote submitted',
    });
    assert.equal(upstreamBody.access_key, 'primary-test-key');
    assert.equal(upstreamBody.subject, 'New ZQ Removals Contact');
    assert.equal(upstreamBody.from_name, 'ZQ Removals Website');
    assert.equal(upstreamBody.name, simpleContactPayload.name);
    assert.equal(upstreamBody.email, simpleContactPayload.email);
    assert.equal(upstreamBody.phone, simpleContactPayload.phone);
    assert.equal(upstreamBody.message, simpleContactPayload.message);
    assert.equal(upstreamBody.source_page, simpleContactPayload.source_page);
  } finally {
    if (originalFetch === undefined) {
      delete global.fetch;
    } else {
      global.fetch = originalFetch;
    }

    if (originalKey === undefined) {
      delete process.env.WEB3FORMS_ACCESS_KEY;
    } else {
      process.env.WEB3FORMS_ACCESS_KEY = originalKey;
    }
  }
}

async function runBrowserFormPayloadSmoke() {
  const originalFetch = global.fetch;
  const originalKey = process.env.WEB3FORMS_ACCESS_KEY;
  process.env.WEB3FORMS_ACCESS_KEY = 'primary-test-key';

  let upstreamBody = null;
  global.fetch = async (_url, options) => {
    upstreamBody = JSON.parse(options.body);
    return {
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    };
  };

  try {
    const body = new URLSearchParams({
      botcheck: '',
      pickup_suburb: 'Adelaide',
      dropoff_suburb: 'Glenelg',
      crew_package: '3 Men + Truck — $89 / 30 min',
      move_scope: 'house-removal',
      property_type: 'house',
      move_date: '2026-04-15',
      move_size: '3-bedroom',
      pickup_access: 'ground-level',
      dropoff_access: 'stairs',
      packing_required: 'partial-packing',
      full_name: 'Browser Form User',
      phone: '+61 400 111 222',
      email: 'browser@example.com',
      move_details: 'Browser submission should redirect after success.',
      source_page: 'https://zqremovals.au/contact-us/',
      utm_source: 'google',
      utm_medium: 'cpc',
      utm_campaign: 'adelaide-removals',
      utm_content: 'hero-cta',
      utm_term: 'fixed-price-quote',
      gclid: 'browser-gclid',
      fbclid: 'browser-fbclid',
      landing_page: 'https://zqremovals.au/?utm_source=google',
    }).toString();

    const res = createResponse();
    await handler(
      createFormRequest(body, {
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'content-type': 'application/x-www-form-urlencoded',
        referer: 'https://zqremovals.au/contact-us/',
      }),
      res,
    );

    assert.equal(res.statusCode, 303);
    assert.equal(res.headers.location, '/thank-you/');
    assert.equal(upstreamBody.access_key, 'primary-test-key');
    assert.equal(upstreamBody.source_page, 'https://zqremovals.au/contact-us/');
    assert.equal(upstreamBody.utm_source, 'google');
    assert.equal(upstreamBody.utm_medium, 'cpc');
    assert.equal(upstreamBody.utm_campaign, 'adelaide-removals');
    assert.equal(upstreamBody.gclid, 'browser-gclid');
  } finally {
    if (originalFetch === undefined) {
      delete global.fetch;
    } else {
      global.fetch = originalFetch;
    }

    if (originalKey === undefined) {
      delete process.env.WEB3FORMS_ACCESS_KEY;
    } else {
      process.env.WEB3FORMS_ACCESS_KEY = originalKey;
    }
  }
}

await runMissingKeySmoke();
await runLegacyKeySmoke();
await runSimpleContactPayloadSmoke();
await runBrowserFormPayloadSmoke();

console.log('quote API smoke checks passed');
