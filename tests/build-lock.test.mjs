import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import path from 'node:path';

const source = await readFile(new URL('../scripts/build-site.mjs', import.meta.url), 'utf8');
const lockFunction = source.slice(source.indexOf('async function acquireBuildLock('), source.indexOf('async function getProcessStartToken('));

function fixture(alive) {
  let attempts = 0;
  let removals = 0;
  const context = vm.createContext({
    projectRoot: '/fixture', path, Date,
    process: { pid: 123, kill() { if (!alive) throw Object.assign(new Error('gone'), { code: 'ESRCH' }); } },
    mkdir: async () => { if (++attempts === 1 || alive) throw Object.assign(new Error('exists'), { code: 'EEXIST' }); },
    readFile: async () => JSON.stringify({ pid: 123, processStart: null }),
    writeFile: async () => {},
    getProcessStartToken: async () => null,
    stat: async () => ({ mtimeMs: Date.now() - 10000 }),
    rm: async () => { removals++; },
    setTimeout: callback => callback(),
  });
  vm.runInContext(lockFunction, context);
  return { acquire: retries => context.acquireBuildLock(retries), removals: () => removals };
}

test('a live Windows build lock survives beyond five seconds without /proc metadata', async () => {
  const lock = fixture(true);
  await assert.rejects(lock.acquire(1), /Timed out waiting/);
  assert.equal(lock.removals(), 0);
});

test('an abandoned build lock can still be recovered', async () => {
  const lock = fixture(false);
  const release = await lock.acquire(2);
  assert.equal(lock.removals(), 1);
  await release();
  assert.equal(lock.removals(), 2);
});
