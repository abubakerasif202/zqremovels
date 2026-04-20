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

function createRequest(payload) {
  return {
    method: 'POST',
    async *[Symbol.asyncIterator]() {
      yield JSON.stringify(payload);
    },
  };
}

const validPayload = {
  botcheck: '',
  pickup_suburb: 'Adelaide',
  dropoff_suburb: 'Glenelg',
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
    await handler(createRequest(validPayload), res);

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
    assert.equal(upstreamBody.move_scope, validPayload.move_scope);
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

await runMissingKeySmoke();
await runLegacyKeySmoke();
await runSimpleContactPayloadSmoke();

console.log('quote API smoke checks passed');
