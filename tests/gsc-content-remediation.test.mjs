import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { readVercelConfig } from './helpers/vercel-config.mjs';

const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
const survivor = '/adelaide-moving-guides/removalists-cost-adelaide/';
const alias = '/adelaide-moving-guides/how-much-do-removalists-cost-adelaide/';

test('duplicate educational cost guide and legacy aliases redirect directly to the survivor', () => {
  const { redirects } = readVercelConfig();
  for (const stem of [alias.slice(0, -1), '/guides/how-much-do-removalists-cost-adelaide']) {
    for (const source of [stem, `${stem}/`, `${stem}/index.html`]) {
      const rule = redirects.find((entry) => entry.source === source && !entry.has);
      assert.equal(rule?.destination, survivor, source);
      assert.equal(rule?.statusCode, 301, source);
    }
  }
  assert.equal(redirects.some((rule) => !rule.has && rule.source === survivor), false);
  const verified = JSON.parse(read('site-src/data/zq-redirects-verified.json'));
  assert.deepEqual(verified.find((rule) => rule.source === alias), { source: alias, destination: survivor, permanent: true });
});

test('furniture aliases preserve the established canonical winner', () => {
  const { redirects } = readVercelConfig();
  for (const source of ['/services/furniture-removals-adelaide/', '/furniture-removals-adelaide/']) {
    const rule = redirects.find((entry) => entry.source === source && !entry.has);
    assert.equal(rule?.destination, '/furniture-removalists-adelaide/');
    assert.equal(rule?.permanent, true);
  }
});

test('service and guide source registries do not promise unsupported fixed pricing', () => {
  for (const file of ['site-src/data/zq-services.mjs', 'site-src/data/zq-blog-guides.mjs', 'site-src/data/zq-internal-links.mjs']) {
    assert.doesNotMatch(read(file), /fixed.price|quote-ready|service fit|this page is built/i, file);
  }
});
