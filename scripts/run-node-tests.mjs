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

for (const testFile of testFiles) {
  await new Promise((resolve) => {
    const child = spawn(process.execPath, ['--test', testFile], {
      cwd: root,
      stdio: 'inherit',
    });

    child.on('exit', (code, signal) => {
      if (signal) {
        console.error(`node --test ${testFile} terminated by ${signal}`);
        process.exit(1);
      }

      if ((code ?? 1) !== 0) {
        process.exit(code ?? 1);
      }

      resolve();
    });
  });
}
