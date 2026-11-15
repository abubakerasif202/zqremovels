import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { getLiveSuburbDirectory } from '../site-src/data/seo-v4.mjs';

const distDir = path.join(process.cwd(), 'site-dist');
const MIN_INBOUND = 3;

function readRoute(route) {
  return readFileSync(path.join(distDir, route.replace(/^\/|\/$/g, ''), 'index.html'), 'utf8');
}

function mainOf(html) {
  return html.match(/<main[\s\S]*?<\/main>/)?.[0] ?? html;
}

test('Adelaide hub lists every live suburb page once, grouped by region', () => {
  const groups = getLiveSuburbDirectory();
  assert.ok(groups.length >= 4, 'at least four region groups');
  const links = groups.flatMap(({ suburbs }) => suburbs.map(({ href }) => href));
  assert.equal(links.length, 42, '42 live suburb pages');
  assert.equal(new Set(links).size, links.length, 'directory URLs are unique');
  const hub = mainOf(readRoute('/removalists-adelaide/'));
  const directory = hub.match(/data-generated-module="suburb-directory"[\s\S]*?<\/section>/)?.[0];
  assert.ok(directory, 'hub renders the suburb directory');
  for (const { suburbs } of groups) {
    for (const { suburb, href } of suburbs) {
      assert.ok(existsSync(path.join(distDir, href.replace(/^\/|\/$/g, ''), 'index.html')), `${href} is built`);
      assert.equal(directory.split(`href="${href}"`).length - 1, 1, `directory links ${suburb} exactly once`);
    }
  }
});

test('live suburb pages never link to a redirect-folded suburb URL from the directory', () => {
  const redirects = JSON.parse(readFileSync('site-src/data/zq-redirects-verified.json', 'utf8'));
  const sources = new Set(redirects.map(({ source }) => source));
  const live = new Set(getLiveSuburbDirectory().flatMap(({ suburbs }) => suburbs.map(({ href }) => href)));
  for (const href of live) {
    assert.ok(!sources.has(href), `${href} must not be a redirect source`);
  }
});

test(`every live suburb page has at least ${MIN_INBOUND} inbound internal links in page content`, () => {
  const live = getLiveSuburbDirectory().flatMap(({ suburbs }) => suburbs.map(({ href }) => href));
  const counts = new Map(live.map((href) => [href, new Set()]));
  const pages = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) walk(path.join(dir, entry.name));
      else if (entry.name === 'index.html') pages.push(path.join(dir, entry.name));
    }
  };
  walk(distDir);
  for (const file of pages) {
    const route = `/${path.relative(distDir, path.dirname(file)).split(path.sep).join('/')}/`;
    const body = mainOf(readFileSync(file, 'utf8'));
    for (const [, href] of body.matchAll(/href="(\/removalists-[a-z-]+\/)(?:#[^"]*)?"/g)) {
      if (href !== route && counts.has(href)) counts.get(href).add(route);
    }
  }
  const weak = [...counts].filter(([, sources]) => sources.size < MIN_INBOUND).map(([href, s]) => `${href} (${s.size})`);
  assert.deepEqual(weak, [], `suburb pages below ${MIN_INBOUND} inbound links`);
});

test('Queens Park route page keeps at least three inbound links from related pages', () => {
  const routes = ['/removalists-adelaide/', '/interstate-removals-adelaide/', '/adelaide-to-sydney-removalists/'];
  for (const route of routes) {
    assert.ok(mainOf(readRoute(route)).includes('href="/removalists-queens-park/"'), `${route} links Queens Park`);
  }
});
