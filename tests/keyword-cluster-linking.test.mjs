import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const distDir = path.join(process.cwd(), 'site-dist');

function readPage(route) {
  const file = route === '/' ? 'index.html' : `${route.replace(/^\/|\/$/g, '')}/index.html`;
  return readFileSync(path.join(distDir, file), 'utf8');
}

function hasLink(html, href, anchorPattern) {
  const re = new RegExp(`<a\\b[^>]*href="${href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>([\\s\\S]*?)</a>`, 'g');
  return [...html.matchAll(re)].some((m) => anchorPattern.test(m[1].replace(/<[^>]+>/g, '')));
}

const sampledPages = ['/', '/house-removals-adelaide/', '/removalists-glenelg/', '/removalists-adelaide/'];

test('keyword cluster pages are linked sitewide with descriptive anchors', () => {
  for (const route of sampledPages) {
    const html = readPage(route);
    assert.ok(hasLink(html, '/adelaide-movers-and-packers/', /movers and packers/i), `${route} -> movers and packers`);
    assert.ok(hasLink(html, '/moving-company-adelaide/', /moving company/i), `${route} -> moving company`);
    if (route !== '/removalists-adelaide/') {
      assert.ok(hasLink(html, '/removalists-adelaide/', /removalists adelaide/i), `${route} -> pillar`);
    }
  }
});

test('pillar page links the regional hubs and cluster pages in body copy', () => {
  const html = readPage('/removalists-adelaide/');
  for (const href of [
    '/removalists-northern-adelaide/',
    '/removalists-southern-adelaide/',
    '/removalists-adelaide-cbd/',
    '/removalists-adelaide-hills/',
  ]) {
    assert.ok(html.includes(`href="${href}"`), `pillar links ${href}`);
  }
});

test('cluster links never point at retired redirect URLs', () => {
  for (const route of sampledPages) {
    const html = readPage(route);
    for (const retired of ['/removal-companies-adelaide/', '/small-removalists-adelaide/', '/movers-and-packers-adelaide/']) {
      assert.ok(!html.includes(`href="${retired}"`), `${route} must not link ${retired}`);
    }
  }
});
