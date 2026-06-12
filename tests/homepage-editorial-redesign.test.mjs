import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();

test('editorial homepage direction stays generator-native and production-safe', async () => {
  const source = await readFile(path.join(root, 'site-src', 'content', 'index.html'), 'utf8');
  const built = await readFile(path.join(root, 'site-dist', 'index.html'), 'utf8');

  for (const html of [source, built]) {
    assert.match(html, /class="home-redesign-hero home-editorial-hero"/);
    assert.match(html, /class="home-quote-planner"/);
    assert.match(html, /class="home-editorial-bento"/);
    assert.match(html, /class="home-editorial-process-grid"/);
    assert.match(html, /src="\/media\/home-local-hero-branded\.webp"/);
    assert.match(html, /href="\/services\/house-removals-adelaide\/"/);
    assert.match(html, /href="\/services\/interstate-removals-adelaide\/"/);
    assert.doesNotMatch(html, /cdn\.tailwindcss\.com|lh3\.googleusercontent\.com|href="#"/i);
    assert.doesNotMatch(html, /500\+|zero damage|no hidden fees/i);
  }
});

test('built homepage receives its page-specific body class', async () => {
  const built = await readFile(path.join(root, 'site-dist', 'index.html'), 'utf8');
  assert.match(built, /<body class="[^"]*\bpage-home\b[^"]*">/);
});
