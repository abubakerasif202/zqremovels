import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const distDir = path.join(process.cwd(), 'site-dist');

function getAllHtmlFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      files.push(...getAllHtmlFiles(fullPath));
    } else if (entry.endsWith('.html')) {
      files.push(fullPath);
    }
  }
  return files;
}

test('no generated page contains truncated or broken "Hourly rate vs hourly" anchor text', () => {
  const htmlFiles = getAllHtmlFiles(distDir);
  assert.ok(htmlFiles.length >= 70, `expected at least 70 html files, found ${htmlFiles.length}`);

  for (const file of htmlFiles) {
    const content = readFileSync(file, 'utf8');
    const relative = path.relative(distDir, file).replace(/\\/g, '/');
    assert.doesNotMatch(
      content,
      /Hourly rate vs hourly/i,
      `found broken "Hourly rate vs hourly" in ${relative}`,
    );
  }
});

test('no generated page contains ungrammatical AI concatenation like "by clarifying explains"', () => {
  const htmlFiles = getAllHtmlFiles(distDir);

  for (const file of htmlFiles) {
    const content = readFileSync(file, 'utf8');
    const relative = path.relative(distDir, file).replace(/\\/g, '/');
    assert.doesNotMatch(
      content,
      /by clarifying (?:explains|focuses|compares|turns|separates|keeps|lists)/i,
      `found ungrammatical "by clarifying [verb]" in ${relative}`,
    );
  }
});

test('suburb pages do not use awkward AI phrasing "only locate the address"', () => {
  const htmlFiles = getAllHtmlFiles(distDir);

  for (const file of htmlFiles) {
    const content = readFileSync(file, 'utf8');
    const relative = path.relative(distDir, file).replace(/\\/g, '/');
    assert.doesNotMatch(
      content,
      /only locate the address/i,
      `found awkward "only locate the address" in ${relative}`,
    );
  }
});

test('no generated page leaks artifact keyword "moving movers Adelaide"', () => {
  const htmlFiles = getAllHtmlFiles(distDir);

  for (const file of htmlFiles) {
    const content = readFileSync(file, 'utf8');
    const relative = path.relative(distDir, file).replace(/\\/g, '/');
    assert.doesNotMatch(
      content,
      /moving movers Adelaide/i,
      `found artifact keyword "moving movers Adelaide" in ${relative}`,
    );
  }
});

test('editorial link hub guides section contains distinct valid guides without duplicate URLs', () => {
  const samplePages = ['about/index.html', 'removalists-adelaide/index.html', 'insurance-and-coverage/index.html'];

  for (const rel of samplePages) {
    const filePath = path.join(distDir, rel);
    const content = readFileSync(filePath, 'utf8');
    const hubMatch = content.match(/data-seo-v5-link-hub[\s\S]*?<\/section>/);
    if (!hubMatch) continue;

    const guidesBlock = hubMatch[0].match(/<h3>Useful planning guides<\/h3>[\s\S]*?<\/ul>/);
    assert.ok(guidesBlock, `missing Useful planning guides block in ${rel}`);

    const hrefs = [...guidesBlock[0].matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
    const uniqueHrefs = new Set(hrefs);
    assert.equal(
      hrefs.length,
      uniqueHrefs.size,
      `found duplicate guide links in ${rel}: ${hrefs.join(', ')}`,
    );
  }
});

test('office removals page title and description are commercially targeted', () => {
  const officeFile = path.join(distDir, 'office-removals-adelaide', 'index.html');
  const content = readFileSync(officeFile, 'utf8');
  assert.match(
    content,
    /<title>Office Removalists Adelaide \| Business Moves \| ZQ Removals<\/title>/i,
  );
  assert.doesNotMatch(content, /<title>[^<]*\$75 and \$89[^<]*<\/title>/i);
});

test('no page metadata contains stripped-rate artifacts like "Rates are  or  per 30 minutes"', () => {
  const htmlFiles = getAllHtmlFiles(distDir);

  for (const file of htmlFiles) {
    const content = readFileSync(file, 'utf8');
    const relative = path.relative(distDir, file).replace(/\\/g, '/');
    assert.doesNotMatch(
      content,
      /(?:Rates|Crew rates) are\s+or\s+per 30 minutes/i,
      `found stripped rate placeholder in ${relative}`,
    );
  }
});
