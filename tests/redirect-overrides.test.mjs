import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const HOST = 'https://zqremovalsadelaide.com.au';
const overrides = JSON.parse(readFileSync('data/migration/redirect-overrides.json', 'utf8'));
const vercel = JSON.parse(readFileSync('vercel.json', 'utf8'));
const verified = JSON.parse(readFileSync('site-src/data/zq-redirects-verified.json', 'utf8'));
const redirectSources = new Set(vercel.redirects.map((rule) => rule.source));

test('reviewed redirect overrides are applied in vercel.json and the verified registry', () => {
  assert.ok(overrides.length > 0);
  for (const { source, destination, reason } of overrides) {
    assert.ok(reason, `${source} needs a recorded reason`);
    const rules = vercel.redirects.filter((rule) => rule.source === source);
    assert.equal(rules.length, 1, `${source} must have exactly one rule`);
    assert.equal(rules[0].destination, HOST + destination);
    assert.equal(rules[0].permanent, true);
    assert.equal(verified.find((entry) => entry.source === source)?.destination, destination);
  }
});

test('override destinations are single-hop, indexable, self-canonical pages', () => {
  for (const { source, destination } of overrides) {
    assert.notEqual(source, destination);
    assert.ok(!redirectSources.has(destination), `${source} would chain through ${destination}`);
    const file = `site-dist${destination}index.html`;
    assert.ok(existsSync(file), `${destination} is not built`);
    const html = readFileSync(file, 'utf8');
    assert.match(html, new RegExp(`<link[^>]+rel="canonical"[^>]+href="${HOST}${destination}"`), `${destination} canonical`);
    assert.doesNotMatch(html, /<meta[^>]+name="robots"[^>]+noindex/i, `${destination} must be indexable`);
  }
});
