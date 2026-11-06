import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'site-dist');

function readDist(rel) {
  return readFileSync(path.join(dist, rel), 'utf8');
}

function* htmlFiles(dir = dist) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* htmlFiles(full);
    else if (entry.name === 'index.html') yield full;
  }
}

function visibleText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ');
}

test('generated pages contain no singular verb after a plural logistics label or wrong indefinite article', () => {
  const bad = [];
  for (const file of htmlFiles()) {
    const text = visibleText(readFileSync(file, 'utf8'));
    const rel = path.relative(dist, file).replace(/\\/g, '/');
    if (/\bchanges the crew\b/i.test(text)) bad.push(`${rel}: "changes the crew"`);
    if (/\bconstraints, property access\b/i.test(text) && /review the .{0,80} constraints/i.test(text)) bad.push(`${rel}: "review the ... constraints"`);
    // "a" before a capitalised vowel-initial place name (e.g. "a Adelaide CBD move").
    const article = text.match(/\ba (Adelaide|Allenby|Andrews|Aldgate|Athelstone|Elizabeth|Edwardstown|Ingle|Ottoway|Oaklands)\b/);
    if (article) bad.push(`${rel}: "a ${article[1]}"`);
  }
  assert.deepEqual(bad, []);
});

test('route quote-factor cards give distinct guidance instead of repeating the card title', () => {
  for (const slug of ['adelaide-to-sydney-removalists', 'adelaide-to-melbourne-removalists', 'adelaide-to-brisbane-removals']) {
    const html = readDist(path.join(slug, 'index.html'));
    const section = html.match(/data-generated-module="route-quote-factors"[\s\S]*?<\/section>/)?.[0] || '';
    assert.ok(section.length > 0, slug);
    assert.doesNotMatch(section, /should be described clearly so the Adelaide-to-destination route/, slug);
    const bodies = [...section.matchAll(/<article[^>]*>\s*<h3>([\s\S]*?)<\/h3>\s*<p>([\s\S]*?)<\/p>/g)];
    assert.ok(bodies.length >= 4, slug);
    assert.equal(new Set(bodies.map((m) => m[2])).size, bodies.length, `${slug}: card bodies must differ`);
    for (const [, title, body] of bodies) {
      assert.notEqual(body.trim().toLowerCase().startsWith(title.trim().toLowerCase()), true, `${slug}: body repeats title "${title}"`);
    }
  }
});

test('Queens Park NSW page sits under Interstate Removals, not Adelaide suburbs, in visible and JSON-LD breadcrumbs', () => {
  const html = readDist(path.join('removalists-queens-park', 'index.html'));
  const nav = html.match(/<nav aria-label="Breadcrumb"[\s\S]*?<\/nav>/)?.[0] || '';
  assert.match(nav, /href="\/interstate-removals-adelaide\/"/);
  assert.doesNotMatch(nav, /Suburb Removalists/);
  const ld = html.match(/"@type": ?"BreadcrumbList"[\s\S]*?\]\s*\}/)?.[0] || '';
  assert.match(ld, /"name": "Interstate Removals"/);
  assert.match(ld, /interstate-removals-adelaide\//);
  assert.doesNotMatch(ld, /"name": "Removalists Adelaide"/);
  assert.match(html, /<link rel="canonical" href="https:\/\/zqremovalsadelaide\.com\.au\/removalists-queens-park\/"/);
});

test('Queens Park hero does not link the redirected Sydney-to-Adelaide URL', () => {
  const html = readDist(path.join('removalists-queens-park', 'index.html'));
  const main = html.match(/<main\b[\s\S]*?<\/main>/i)?.[0] || html;
  assert.doesNotMatch(main, /href="\/sydney-to-adelaide-removalists\/"/);
  assert.doesNotMatch(main, /href="\/adelaide-to-sydney-removalists\/"/);
  assert.match(main, /Queens Park is in Sydney, NSW/);
});

test('nearby-suburb cards never label a redirected suburb (Myrtle Bank) while pointing at another page', () => {
  const html = readDist(path.join('removalists-campbelltown', 'index.html'));
  const cards = html.match(/data-generated-module="nearby-suburbs"[\s\S]*?<\/section>/)?.[0] || '';
  assert.ok(cards.length > 0);
  assert.doesNotMatch(cards, /Myrtle Bank/);
});

test('Pennington is linked from the Semaphore page so it has more than the three prior inbound links', () => {
  const html = readDist(path.join('removalists-semaphore', 'index.html'));
  assert.match(html, /href="\/removalists-pennington\/"/);
});
