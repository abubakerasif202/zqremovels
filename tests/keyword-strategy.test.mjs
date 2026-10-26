import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { analyzeKeywordPage, auditKeywords, measureKeyword } from '../scripts/keyword-audit.mjs';
import { getGeneratedPages, getSeoV5IntentProfile, isVerifiedRedirectSource } from '../site-src/data/seo-v4.mjs';
import { guideTopicContent } from '../site-src/data/guide-topic-content.mjs';

test('keyword measurement counts whole phrases and documents its denominator', () => {
  assert.deepEqual(measureKeyword('Office removalists Adelaide; office removalists Adelaide.', 'office removalists Adelaide'), {
    words: 6, occurrences: 2, densityPercent: 33.333,
  });
  assert.equal(measureKeyword('removalists removalist premovalist', 'removalist').occurrences, 1);
  assert.deepEqual(measureKeyword('', ''), { words: 0, occurrences: 0, densityPercent: 0 });
});

test('audit measures main content without counting navigation or executable content', () => {
  const page = analyzeKeywordPage(`<link rel="canonical" href="https://zqremovalsadelaide.com.au/office-removals-adelaide/">
    <title>Office Removalists Adelaide</title><meta name="description" content="Office removalists Adelaide &amp; business moves">
    <nav>Office removalists Adelaide</nav><main><h1>Office removalists Adelaide</h1>
    <script>Office removalists Adelaide</script><style>Office removalists Adelaide</style>
    <template>Office removalists Adelaide</template><!-- Office removalists Adelaide --><p>Access planning</p></main>`);
  assert.equal(page.words, 5);
  assert.equal(page.occurrences, 1);
  assert.equal(page.description, 'Office removalists Adelaide & business moves');
  assert.deepEqual(page.placement, { title: true, description: true, h1: true });
});

test('audit excludes noindex and redirect pages and fails on incomplete indexable output', () => {
  assert.equal(analyzeKeywordPage('<meta name="robots" content="noindex,follow">'), null);
  assert.equal(analyzeKeywordPage('<meta http-equiv="refresh" content="0; url=/">'), null);
  assert.throws(() => analyzeKeywordPage('<main>Incomplete</main>'), /no canonical/);
  assert.throws(() => analyzeKeywordPage('<link rel="canonical" href="https://zqremovalsadelaide.com.au/">'), /no main content/);
});

const pages = getGeneratedPages().filter((page) => !isVerifiedRedirectSource(page));

test('suburb metadata avoids duplicated locations and arbitrary promotional suffixes', () => {
  const suburbs = pages.filter((page) => page.generatedKind === 'suburb');
  assert.ok(suburbs.length > 20);
  for (const page of suburbs) {
    assert.doesNotMatch(page.title, /Fast & Clear Pricing|Professional Local Experts|Local Adelaide Removalists/, page.output);
    assert.doesNotMatch(page.description, /Adelaide Adelaide|your .+ Adelaide move/, page.output);
    assert.ok(page.description.length <= 160, page.output);
    assert.equal(page.description, page.ogDescription, page.output);
    assert.equal(page.description, page.twitterDescription, page.output);
  }
});

test('suburb quick answers link to distinct pricing, education and quote destinations', () => {
  const page = pages.find((page) => page.output === 'removalists-port-adelaide/index.html');
  const block = page.contentHtml.match(/data-generated-module="suburb-aeo-answer"([\s\S]*?)<\/section>/)?.[1];
  assert.ok(block);
  const links = [...block.matchAll(/href="([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(links, ['/removalists-adelaide-prices/', '/adelaide-moving-guides/removalists-cost-adelaide/', '/contact-us/#quote-form']);
});

test('residential suburb cards avoid office targeting while commercial profiles retain it', () => {
  for (const [slug, expected] of [['medindie', false], ['woodcroft', false], ['port-adelaide', true], ['norwood', true]]) {
    const page = pages.find((page) => page.output === `removalists-${slug}/index.html`);
    const block = page.contentHtml.match(/data-generated-module="related-services"([\s\S]*?)<\/section>/)?.[1];
    assert.ok(block, slug);
    assert.equal(block.includes('href="/office-removals-adelaide/"'), expected, slug);
    assert.ok(block.includes('href="/packing-services-adelaide/"'), slug);
    assert.doesNotMatch(block, /stays relevant for/, slug);
  }
});

test('topic-specific guide descriptions and intent profiles reach metadata and rendered content', () => {
  for (const [slug, topic] of Object.entries(guideTopicContent)) {
    const page = pages.find((page) => page.output === `adelaide-moving-guides/${slug}/index.html`);
    assert.ok(page, slug);
    assert.equal(page.description, topic.description, slug);
    assert.ok(topic.description.length >= 60 && topic.description.length <= 160, slug);
    assert.equal(page.ogDescription, topic.description, slug);
    assert.match(page.contentHtml, /Questions about planning your move/, slug);
    assert.doesNotMatch(page.contentHtml, /Questions people ask about .+ in Adelaide/, slug);
    const profile = getSeoV5IntentProfile(slug);
    if (profile) {
      assert.ok(page.contentHtml.includes(`data-seo-v5-intent-profile="${profile.primaryKeyword}"`), slug);
      assert.ok(page.contentHtml.includes(profile.uniqueAngle), slug);
    }
  }
});

test('interstate descriptions state the route once', () => {
  for (const slug of ['adelaide-to-canberra-removals', 'adelaide-to-perth-removals']) {
    const page = pages.find((page) => page.output === `${slug}/index.html`);
    assert.ok(page, slug);
    assert.doesNotMatch(page.description, /removals from Adelaide/i);
    assert.equal((page.description.match(/Adelaide/g) || []).length, 1);
  }
});

test('built indexable pages have unique metadata and a single primary heading', async () => {
  const audit = await auditKeywords();
  assert.ok(audit.pageCount > 40);
  assert.deepEqual(audit.duplicates, []);
  for (const page of audit.pages) {
    assert.equal(page.h1s.length, 1, page.route);
    assert.ok(page.words > 0, page.route);
    assert.match(page.canonical, /^https:\/\/zqremovalsadelaide\.com\.au\//, page.route);
  }
});

test('generic location link blocks do not add office targeting without a commercial profile', () => {
  for (const slug of ['queens-park', 'adelaide-hills']) {
    const html = readFileSync(`site-dist/removalists-${slug}/index.html`, 'utf8');
    const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1];
    assert.ok(main, slug);
    assert.ok(main.includes('href="/interstate-removals-adelaide/"'), slug);
    assert.ok(!main.includes('href="/office-removals-adelaide/"'), slug);
  }
});
