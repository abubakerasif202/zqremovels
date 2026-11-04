import assert from 'node:assert/strict';
import test from 'node:test';

const { getGeneratedPages } = await import(new URL('../site-src/data/seo-v4.mjs', import.meta.url).href);
const { zqSuburbGeoData } = await import(new URL('../site-src/data/zq-suburbs.mjs', import.meta.url).href);

function decodeEntities(value) {
  return String(value)
    .replaceAll('&amp;', '&')
    .replaceAll('&#39;', "'")
    .replaceAll('&quot;', '"')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>');
}

function moduleText(html, moduleName) {
  const match = String(html).match(new RegExp(`data-generated-module="${moduleName}"[\\s\\S]*?</section>`));
  return match ? decodeEntities(match[0].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()) : '';
}

test('generated suburb insights use verified local notes and do not share one parking paragraph', () => {
  const suburbs = getGeneratedPages().filter((page) => page.generatedKind === 'suburb' && page.contentHtml?.includes('data-generated-module="local-insights"'));
  assert.ok(suburbs.length >= 30, `expected generated suburb insights, found ${suburbs.length}`);

  const seen = new Map();
  for (const page of suburbs) {
    const slug = page.output.match(/^removalists-([^/]+)\//)?.[1] || '';
    const insights = moduleText(page.contentHtml, 'local-insights');
    assert.ok(insights, `${slug} missing local insights`);
    assert.doesNotMatch(insights, /should be treated as an access variable/i, slug);
    assert.doesNotMatch(insights, /Traffic can shift with school periods/i, slug);
    assert.equal(seen.has(insights), false, `${slug} repeats local insights from ${seen.get(insights)}`);
    seen.set(insights, slug);

    const geo = zqSuburbGeoData[slug];
    if (geo?.council) {
      assert.match(insights, new RegExp(geo.council.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `${slug} missing council`);
    }
    if (geo?.landmarks?.[0]) {
      assert.match(decodeEntities(page.contentHtml), new RegExp(geo.landmarks[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `${slug} missing landmark reference`);
    }
  }
});

test('hyperlocal suburb links do not stack keyword aliases onto one prices URL', () => {
  const hyperlocal = getGeneratedPages().filter((page) => page.contentHtml?.includes('data-generated-module="hyperlocal-v7"'));
  assert.ok(hyperlocal.length >= 4);

  for (const page of hyperlocal) {
    const html = page.contentHtml;
    assert.doesNotMatch(html, /href="\/moving-quotes-adelaide\/"/);
    assert.doesNotMatch(html, /href="\/fixed-price-removalists-adelaide\/"/);
    assert.doesNotMatch(html, /href="\/affordable-removalists-adelaide\/"/);
    assert.match(html, /href="\/removalists-adelaide-prices\/"/);
    assert.match(html, /href="\/house-removals-adelaide\/"/);
    assert.match(html, /href="\/furniture-removalists-adelaide\/"/);
    assert.match(html, /href="\/packing-services-adelaide\/"/);
    assert.match(html, /href="\/contact-us\/#quote-form"/);
  }
});
