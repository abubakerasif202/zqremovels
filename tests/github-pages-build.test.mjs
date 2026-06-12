import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();

test('repository includes .nojekyll to disable GitHub Pages Jekyll parsing', async () => {
  await assert.doesNotReject(
    access(path.join(root, '.nojekyll')),
  );
});
