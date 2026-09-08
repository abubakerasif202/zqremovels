import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();
const gitmodulesPath = path.join(root, '.gitmodules');

function parseGitlinkPaths() {
  const output = execFileSync('git', ['ls-files', '-s'], {
    cwd: root,
    encoding: 'utf8',
  });

  return output
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(/\s+/))
    .filter(([mode]) => mode === '160000')
    .map(([, , , filePath]) => filePath);
}

function parseGitmodulesUrls() {
  if (!existsSync(gitmodulesPath)) {
    return new Set();
  }

  const content = readFileSync(gitmodulesPath, 'utf8');
  const pathsWithUrls = new Set();
  const sections = content.split(/\r?\n\r?\n/);

  for (const section of sections) {
    const pathMatch = section.match(/^\[submodule\s+"([^"]+)"\]/m);
    const urlMatch = section.match(/^\s*url\s*=\s*(.+)\s*$/m);
    if (pathMatch && urlMatch) {
      pathsWithUrls.add(pathMatch[1].trim());
    }
  }

  return pathsWithUrls;
}

test('all gitlink entries have a .gitmodules url mapping', () => {
  const gitlinkPaths = parseGitlinkPaths();
  const mappedPaths = parseGitmodulesUrls();
  const missingMappings = gitlinkPaths.filter((filePath) => !mappedPaths.has(filePath));

  assert.deepEqual(
    missingMappings,
    [],
    `Found gitlink entries without .gitmodules url mappings: ${missingMappings.join(', ')}`,
  );
});
