import { spawn } from 'node:child_process';
import { readdir } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const testsDir = path.join(root, 'tests');
const testFiles = (await readdir(testsDir))
  .filter((file) => file.endsWith('.test.mjs'))
  .sort()
  .map((file) => path.join('tests', file));

if (testFiles.length === 0) {
  console.error('No test files found in tests/*.test.mjs');
  process.exit(1);
}

const child = spawn(
  process.execPath,
  ['--test', '--test-concurrency=1', ...testFiles],
  {
    cwd: root,
    stdio: 'inherit',
  },
);

child.on('exit', (code, signal) => {
  if (signal) {
    console.error(`node --test terminated by ${signal}`);
    process.exit(1);
  }
  process.exit(code ?? 1);
});
