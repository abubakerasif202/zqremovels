import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { createSitemapLastmodResolver, validateLastmod } from '../scripts/sitemap-lastmod.mjs';

test('lastmod accepts calendar dates and rejects malformed or impossible dates', () => {
  assert.equal(validateLastmod('2024-02-29'), '2024-02-29');
  for (const date of ['2025-02-29', '2026-13-01', 'today', '2026-10-07T12:00:00Z', null]) {
    assert.equal(validateLastmod(date), undefined);
  }
});

test('explicit valid lastmod takes precedence over committed source dates', () => {
  const resolve = createSitemapLastmodResolver(process.cwd(), { runGit: () => assert.fail('unnecessary Git lookup') });
  assert.equal(resolve({ lastmod: '2026-09-28' }, ['page.html']), '2026-09-28');
});

test('latest committed source date is used and Git lookups are cached', () => {
  let calls = 0;
  const root = process.cwd();
  const resolve = createSitemapLastmodResolver(root, { runGit: (_command, args) => {
    calls++;
    return args.at(-1) === 'a.html' ? '2026-09-01\n' : '2026-09-28\n';
  } });
  const sources = ['a.html', 'b.html'].map(file => path.join(root, file));
  assert.equal(resolve({ lastmod: 'invalid' }, sources), '2026-09-28');
  assert.equal(resolve({}, sources), '2026-09-28');
  assert.equal(calls, 2);
});

test('untracked sources and unavailable Git history omit lastmod', () => {
  const root = process.cwd();
  const source = path.join(root, 'untracked.html');
  const untracked = createSitemapLastmodResolver(root, { runGit: () => '' });
  assert.equal(untracked({}, [source]), undefined);
  const missingGit = createSitemapLastmodResolver(root, { runGit: () => { throw new Error('Git unavailable'); } });
  assert.equal(missingGit({}, [source]), undefined);
  assert.equal(missingGit({}, []), undefined);
});
