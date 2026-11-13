import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const html = readFileSync(
  path.join(process.cwd(), 'site-dist', 'removalists-southern-adelaide', 'index.html'),
  'utf8',
);

const anchors = [...html.matchAll(/<a\s[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)].map((m) => ({
  href: m[1],
  text: m[2].replace(/<[^>]+>/g, '').trim(),
}));

test('Southern hub links Woodcroft and Marion from its content', () => {
  assert.ok(anchors.some((a) => a.href === '/removalists-woodcroft/'));
  assert.ok(anchors.some((a) => a.href === '/removalists-marion/'));
});

test('Southern hub has no self-links with suburb anchor text', () => {
  const selfLinks = anchors.filter((a) => a.href === '/removalists-southern-adelaide/');
  for (const link of selfLinks) {
    assert.match(link.text, /^Southern Adelaide routes$/, `unexpected self-link: "${link.text}"`);
  }
});
