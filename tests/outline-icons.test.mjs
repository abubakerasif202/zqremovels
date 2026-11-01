import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();
const sprite = readFileSync(path.join(root, 'media/icons/zq-icons.svg'), 'utf8');
const symbolIds = [...sprite.matchAll(/<symbol\b[^>]*id="([^"]+)"/g)].map(match => match[1]);

function filesIn(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? filesIn(file) : [file];
  });
}

test('every generated icon reference resolves to a local asset and real symbol', () => {
  let references = 0;
  const assets = new Map();
  for (const file of filesIn(path.join(root, 'site-dist'))) {
    if (!/\.(?:html|css|js|mjs)$/.test(file)) continue;
    const content = readFileSync(file, 'utf8');
    for (const match of content.matchAll(/\/media\/icons\/([\w-]+\.svg)(?:#([\w-]+))?/g)) {
      references++;
      if (!assets.has(match[1])) {
        const asset = readFileSync(path.join(root, 'site-dist/media/icons', match[1]), 'utf8');
        assert.match(asset, /<svg\b/, file);
        assets.set(match[1], asset);
      }
      if (match[2]) assert.ok(symbolIds.includes(match[2]), `${file}: missing ${match[2]}`);
    }
    assert.doesNotMatch(content, /href=["']#zq-i-/, `${file}: page-local icon reference`);
  }
  assert.ok(references > 100, 'icons are present across generated routes');
});

test('shared sprite has unique symbols, consistent outline strokes and no active content', () => {
  assert.equal(symbolIds.length, new Set(symbolIds).size);
  assert.ok(symbolIds.length >= 20);
  for (const symbol of sprite.matchAll(/<symbol\b([^>]+)>/g)) {
    assert.match(symbol[1], /viewBox="0 0 24 24"/);
    assert.match(symbol[1], /fill="none"/);
    assert.match(symbol[1], /stroke="currentColor"/);
    assert.match(symbol[1], /stroke-width="1.8"/);
  }
  assert.doesNotMatch(sprite, /<script|<foreignObject|\bon\w+=|https?:\/\/(?!www\.w3\.org)/i);
});

test('chat controls retain accessible labels alongside decorative SVG icons', () => {
  const chat = readFileSync(path.join(root, 'chat-widget.mjs'), 'utf8');
  for (const label of ['Start a new conversation', 'Close chat']) {
    assert.ok(chat.includes(`aria-label="${label}"`));
  }
  for (const svg of chat.matchAll(/<svg\b([^>]+)>/g)) {
    assert.match(svg[1], /aria-hidden="true"/);
    assert.match(svg[1], /focusable="false"/);
  }
});
