import { randomBytes, randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { createHandler } = require('../api/ai-lead.js');
const lead = JSON.parse(await readFile(new URL('../integrations/google-adk/fictional-dry-run.json', import.meta.url), 'utf8'));
// This local handler gets no live enable flag, Redis configuration or delivery key.
const secret = randomBytes(32).toString('hex');
const handler = createHandler({
  env: { ZQ_AI_LEAD_SECRET: secret },
  fetch: async () => { throw new Error('Dry run must never access the network'); },
});
const req = {
  method: 'POST',
  headers: { 'content-type': 'application/json', authorization: `Bearer ${secret}` },
  body: { submission_id: randomUUID(), consent: true, dry_run: true, lead },
};
const res = {
  status(code) { this.statusCode = code; return this; },
  setHeader() {},
  end(body) {
    const result = JSON.parse(body);
    if (this.statusCode !== 200 || result.success !== true || result.status !== 'dry_run') {
      throw new Error('Local dry-run validation failed');
    }
    console.log(JSON.stringify(result, null, 2));
  },
};
await handler(req, res);
