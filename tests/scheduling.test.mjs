import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeSchedulingUrl } from '../site-src/data/scheduling.mjs';

test('accepts an HTTPS booking link', () => {
  assert.equal(
    normalizeSchedulingUrl(' https://calendar.example.com/consultation '),
    'https://calendar.example.com/consultation',
  );
});

test('rejects missing, unsafe, or malformed booking links', () => {
  for (const value of [undefined, '', ' ', 'http://calendar.example.com/event', 'javascript:alert(1)', '//calendar.example.com/event', 'https://user:pass@calendar.example.com/event', 'not-a-url']) {
    assert.equal(normalizeSchedulingUrl(value), null, String(value));
  }
});
