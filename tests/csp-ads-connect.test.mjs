import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

const config = JSON.parse(readFileSync('vercel.json', 'utf8'));

// Consent-mode page_view pings go to pagead2.googlesyndication.com; CSP must allow them on every header block.
test('every CSP header block allows the Google Ads consent-mode ping', () => {
  const policies = config.headers.flatMap((rule) => rule.headers)
    .filter((header) => header.key === 'Content-Security-Policy')
    .map((header) => header.value);
  assert.ok(policies.length >= 1);
  for (const policy of policies) {
    const connect = policy.split(';').map((part) => part.trim()).find((part) => part.startsWith('connect-src'));
    assert.match(connect, /\shttps:\/\/pagead2\.googlesyndication\.com(\s|$)/);
  }
});
