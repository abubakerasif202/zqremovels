import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { guideTopicContent } from '../site-src/data/guide-topic-content.mjs';

// Guards against internal SEO/strategy wording leaking into public page copy,
// and against the route-label regressions found in the October 2026 GSC review.

const distDir = path.join(process.cwd(), 'site-dist');

function listHtml(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) out.push(...listHtml(full));
    else if (name.endsWith('.html')) out.push(full);
  }
  return out;
}

function visibleMainText(html) {
  const main = html.match(/<main[\s\S]*?<\/main>/)?.[0] || html;
  return main
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ');
}

const indexablePages = existsSync(distDir)
  ? listHtml(distDir)
      .map((file) => ({ file, html: readFileSync(file, 'utf8') }))
      .filter(({ html }) => !/<meta[^>]+name="robots"[^>]+noindex/i.test(html) && /<main/i.test(html))
  : [];

const leakedPhrases = [
  /money pages?/i,
  /high-intent/i,
  /without filler/i,
  /natural links into/i,
  /the best guide pages/i,
  /thin suburb estimate/i,
  /stay aligned with the visible/i,
  /corridor intent/i,
  /nearby search patterns/i,
  /visitors should still be able/i,
  /support conversion/i,
  /not a claim of a destination office/i,
];

test('build output exists for copy checks', () => {
  assert.ok(indexablePages.length > 50, 'run npm run build before this test');
});

test('indexable pages do not expose internal SEO strategy wording', () => {
  const failures = [];
  for (const { file, html } of indexablePages) {
    const text = visibleMainText(html);
    for (const pattern of leakedPhrases) {
      if (pattern.test(text)) failures.push(`${path.relative(distDir, file)}: ${pattern}`);
    }
  }
  assert.deepEqual(failures, []);
});

test('interstate route labels read naturally and do not repeat "via"', () => {
  const failures = [];
  for (const { file, html } of indexablePages) {
    const text = visibleMainText(html);
    if (/\bvia [^.]{0,40}\bvia\b/i.test(text) || /Hwy route via/i.test(text) || /cubic-metre model/i.test(text)) {
      failures.push(path.relative(distDir, file));
    }
  }
  assert.deepEqual(failures, []);
});

test('topic-specific guides render their own overview, checklist and FAQs', () => {
  for (const [slug, content] of Object.entries(guideTopicContent)) {
    const file = path.join(distDir, 'adelaide-moving-guides', slug, 'index.html');
    if (!existsSync(file)) continue;
    const html = readFileSync(file, 'utf8');
    const text = visibleMainText(html);
    assert.ok(text.includes(content.paragraphs[0].slice(0, 60)), `${slug} missing topic overview`);
    for (const card of content.cards || []) {
      assert.ok(text.includes(card.title), `${slug} missing card ${card.title}`);
    }
    for (const item of content.faq || []) {
      assert.ok(html.includes(item.question.replace(/’/g, '’')), `${slug} missing FAQ ${item.question}`);
    }
  }
});
