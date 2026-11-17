import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const dist = path.resolve('site-dist');
const read = (output) => fs.readFileSync(path.join(dist, output), 'utf8');
const decode = (value) => value.replaceAll('&amp;', '&');
const titleOf = (html) => decode(html.match(/<title>([\s\S]*?)<\/title>/)[1]);
const metaOf = (html, attr, name) =>
  decode(html.match(new RegExp(`<meta[^>]*${attr}="${name}"[^>]*content="([^"]*)"`, 'i'))[1]);

const expectations = [
  ['removalists-toorak-gardens/index.html', 'Toorak Gardens Removalists | From $75/30 min | ZQ'],
  ['services/piano-movers-adelaide/index.html', 'Piano Movers Adelaide | Upright & Grand Pianos | ZQ'],
];

for (const [output, expectedTitle] of expectations) {
  test(`CTR title for ${output} is set, fits a SERP and matches social titles`, () => {
    const html = read(output);
    const title = titleOf(html);
    assert.equal(title, expectedTitle);
    assert.ok(title.length <= 60, `title is ${title.length} chars: ${title}`);
    assert.equal(metaOf(html, 'property', 'og:title'), expectedTitle);
    assert.equal(metaOf(html, 'name', 'twitter:title'), expectedTitle);
  });
}

test('published rates quoted in CTR titles stay at the verified $75 and $89 figures', () => {
  for (const [output, title] of expectations) {
    for (const price of title.match(/\$\d+/g) || []) {
      assert.ok(['$75', '$89'].includes(price), `${output} quotes unverified price ${price}`);
    }
  }
});
