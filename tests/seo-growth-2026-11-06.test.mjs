import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { withArticle } from '../site-src/data/indefinite-article.mjs';
import { visibleText } from './helpers/html-text.mjs';

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

test('indefinite article follows pronunciation for supported place names', () => {
  const cases = [
    ['Glenelg', 'a Glenelg'],
    ['Adelaide CBD', 'an Adelaide CBD'],
    ['Unley', 'an Unley'],
    ['Unley Park', 'an Unley Park'],
    ['Urrbrae', 'an Urrbrae'],
    ['Uraidla', 'a Uraidla'],
    ['Elizabeth', 'an Elizabeth'],
    ['Ottoway', 'an Ottoway'],
    ['Henley Beach', 'a Henley Beach'],
    ['Hyde Park', 'a Hyde Park'],
    ['One Tree Hill', 'a One Tree Hill'],
    ['Eudunda', 'a Eudunda'],
  ];
  for (const [name, expected] of cases) {
    assert.equal(withArticle(name), expected, name);
  }
});

test('visibleText ignores script and style content, including malformed end tags', () => {
  const html = '<p>keep</p><script>drop()</script ><STYLE>.x{}</STYLE\n><!-- hidden --><a href="a>b">link</a> 1 < 2';
  const text = visibleText(html).replace(/\s+/g, ' ').trim();
  assert.equal(text, 'keep link 1 < 2');
});

test('generated pages contain no singular verb after a plural logistics label or wrong indefinite article', () => {
  const bad = [];
  for (const file of htmlFiles()) {
    const text = visibleText(readFileSync(file, 'utf8'));
    const rel = path.relative(dist, file).replace(/\\/g, '/');
    if (/\bchanges the crew\b/i.test(text)) bad.push(`${rel}: "changes the crew"`);
    if (/\bconstraints, property access\b/i.test(text) && /review the .{0,80} constraints/i.test(text)) bad.push(`${rel}: "review the ... constraints"`);
    // "a" before a capitalised vowel-initial place name (e.g. "a Adelaide CBD move").
    const article = text.match(/\ba (Adelaide|Allenby|Andrews|Aldgate|Athelstone|Elizabeth|Edwardstown|Ingle|Ottoway|Oaklands|Unley|Urrbrae)\b/);
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

test('Hyde Park, Unley Park and Malvern show review proof from the verified Google review data, labelled as business-wide', () => {
  const data = JSON.parse(readFileSync(path.join(root, 'site-src', 'data', 'google-reviews.json'), 'utf8'));
  for (const slug of ['hyde-park', 'unley-park', 'malvern']) {
    const html = readDist(path.join(`removalists-${slug}`, 'index.html'));
    const section = html.match(/data-generated-module="suburb-review-proof"[\s\S]*?<\/section>/)?.[0] || '';
    assert.ok(section.includes(`from ${data.reviewCount} Google reviews`), slug);
    assert.match(section, /not only this suburb/, slug);
    assert.doesNotMatch(section, /&lt;|\{\{/, slug);
  }
});

test('Pennington is linked from the Semaphore page so it has more than the three prior inbound links', () => {
  const html = readDist(path.join('removalists-semaphore', 'index.html'));
  assert.match(html, /href="\/removalists-pennington\/"/);
});

test('Pennington page carries verified, sourced local facts and no wrong council claim anywhere', () => {
  const html = readDist(path.join('removalists-pennington', 'index.html'));
  const text = visibleText(html).replace(/\s+/g, ' ');
  assert.match(text, /City of Charles Sturt/);
  assert.match(text, /70\.2% of occupied dwellings/);
  assert.match(text, /ABS 2021 Census QuickStats/);
  for (const file of htmlFiles()) {
    const page = visibleText(readFileSync(file, 'utf8')).replace(/\s+/g, ' ');
    assert.doesNotMatch(page, /Pennington[^.]{0,80}Port Adelaide Enfield|Port Adelaide Enfield[^.]{0,80}Pennington/, path.relative(dist, file));
  }
});

test('suburb Service schema lists each area once, header and footer link the piano page, and every page has a social image', () => {
  for (const slug of ['unley-park', 'hyde-park', 'malvern', 'pennington']) {
    const html = readDist(path.join(`removalists-${slug}`, 'index.html'));
    for (const block of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
      const json = JSON.parse(block[1]);
      if (Array.isArray(json.areaServed)) {
        const lower = json.areaServed.map((a) => String(a).toLowerCase());
        assert.equal(new Set(lower).size, lower.length, `${slug}: duplicate areaServed ${lower.join(',')}`);
      }
    }
  }
  const about = readDist(path.join('about', 'index.html'));
  assert.ok((about.match(/href="\/services\/piano-movers-adelaide\/"/g) || []).length >= 2, 'header and footer link the piano page');
  for (const file of htmlFiles()) {
    const html = readFileSync(file, 'utf8');
    assert.match(html, /property="og:image" content="https?:\/\/[^"]+"/, path.relative(dist, file));
    assert.match(html, /name="twitter:image" content="https?:\/\/[^"]+"/, path.relative(dist, file));
  }
});
