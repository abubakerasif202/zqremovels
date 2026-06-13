import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();

test('repository includes .nojekyll to disable GitHub Pages Jekyll parsing', () => {
  assert.ok(
    existsSync(path.join(root, '.nojekyll')),
    'Expected .nojekyll file to exist at repository root',
  );
});
