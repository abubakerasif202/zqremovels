import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

// Reads the generated output, so run `npm run build` first.
const distDir = path.join(process.cwd(), 'site-dist');

const SUBURBS = [
  'hyde-park',
  'unley-park',
  'queens-park',
  'medindie',
  'toorak-gardens',
  'brighton',
  'kensington-gardens',
  'malvern',
];

// Queens Park is a Sydney (NSW) pickup page, so it has no Adelaide neighbour suburbs to link to.
const SUBURBS_WITH_NEIGHBOURS = SUBURBS.filter((slug) => slug !== 'queens-park');

const readPage = (slug) => {
  const file = path.join(distDir, `removalists-${slug}`, 'index.html');
  assert.ok(existsSync(file), `missing build output for ${slug}; run npm run build`);
  return readFileSync(file, 'utf8');
};

const decode = (value) => value
  .replace(/&#39;|&apos;/g, "'")
  .replace(/&quot;/g, '"')
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>');

const getMain = (html) => html.match(/<main[\s\S]*?<\/main>/)?.[0] || '';
const stripTags = (html) => decode(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

const getMoveBrief = (html) => html.match(/<section\b[^>]*data-generated-module="suburb-move-brief"[\s\S]*?<\/section>/)?.[0] || '';
const getParagraphs = (sectionHtml) => [...sectionHtml.matchAll(/<p>([\s\S]*?)<\/p>/g)].map((match) => stripTags(match[1]));

// Links to other suburb landing pages, /removalists-<slug>/ only, in document order.
const getSuburbLinks = (html) => {
  const links = [];
  const scope = html.includes('<main') ? getMain(html) : html;
  for (const match of scope.matchAll(/<a\b[^>]*href="\/removalists-([a-z0-9-]+)\/"[^>]*>([\s\S]*?)<\/a>/g)) {
    links.push({ slug: match[1], text: stripTags(match[2]) });
  }
  return links;
};

const NON_SUBURB_ROUTES = new Set(['adelaide', 'adelaide-prices', 'northern-adelaide', 'southern-adelaide', 'adelaide-hills', 'northern-suburbs-adelaide']);
const getNeighbourSlugs = (html) => [...new Set(getSuburbLinks(html).map((link) => link.slug).filter((slug) => !NON_SUBURB_ROUTES.has(slug)))];

test('Malvern carries SA 5061 in the title, H1 and first paragraph', () => {
  const html = readPage('malvern');
  const title = decode(html.match(/<title>([\s\S]*?)<\/title>/)[1]);
  const h1 = stripTags(getMain(html).match(/<h1[^>]*>([\s\S]*?)<\/h1>/)[1]);
  const firstParagraph = stripTags(getMain(html).match(/<p\b[^>]*>([\s\S]*?)<\/p>/)[1]);

  for (const [label, value] of [['title', title], ['H1', h1], ['first paragraph', firstParagraph]]) {
    assert.match(value, /Malvern, Adelaide,? SA 5061/, `Malvern ${label} must name Malvern, Adelaide, SA 5061`);
  }
  assert.ok(title.length <= 60, `Malvern title should stay near 60 characters, got ${title.length}`);
});

test('each priority suburb page has 3-4 distinct nearby suburb links, no self link, and live targets', () => {
  for (const slug of SUBURBS_WITH_NEIGHBOURS) {
    const html = readPage(slug);
    const neighbours = getNeighbourSlugs(html);
    const suburbPageLinks = neighbours.filter((neighbour) => existsSync(path.join(distDir, `removalists-${neighbour}`, 'index.html')));

    assert.ok(!neighbours.includes(slug), `${slug} must not link to itself`);
    assert.equal(suburbPageLinks.length, neighbours.length, `${slug} links to a suburb page that is not in site-dist`);

    const nearby = html.match(/<section\b[^>]*data-generated-module="(?:nearby-suburbs|related-services)"[\s\S]*?<\/section>/g) || [];
    const nearbyNeighbours = new Set();
    for (const section of nearby) {
      for (const link of getSuburbLinks(section)) {
        if (!NON_SUBURB_ROUTES.has(link.slug)) nearbyNeighbours.add(link.slug);
      }
    }
    assert.ok(nearbyNeighbours.size >= 3 && nearbyNeighbours.size <= 4,
      `${slug} should render 3-4 nearby suburb links in the nearby block, got ${nearbyNeighbours.size}: ${[...nearbyNeighbours].join(', ')}`);
    assert.ok(!nearbyNeighbours.has(slug), `${slug} nearby block must not link to itself`);
  }
});

test('nearby suburb link anchors are descriptive and not repeated within one page', () => {
  for (const slug of SUBURBS_WITH_NEIGHBOURS) {
    const html = readPage(slug);
    const anchors = getSuburbLinks(html).filter((link) => !NON_SUBURB_ROUTES.has(link.slug)).map((link) => link.text.toLowerCase());
    for (const anchor of anchors) {
      assert.ok(anchor.length >= 8, `${slug} has a vague anchor: "${anchor}"`);
    }
  }
});

test('Brighton, Kensington Gardens and Toorak Gardens have at least two inbound links from nearby suburb pages', () => {
  const expectedSources = {
    brighton: ['glenelg', 'marion'],
    'kensington-gardens': ['magill', 'norwood', 'burnside'],
    'toorak-gardens': ['norwood', 'burnside', 'linden-park'],
  };

  for (const [target, sources] of Object.entries(expectedSources)) {
    const linkingSources = sources.filter((source) => getSuburbLinks(readPage(source)).some((link) => link.slug === target));
    assert.ok(linkingSources.length >= 2, `${target} needs >=2 inbound links from ${sources.join(', ')}, found ${linkingSources.join(', ') || 'none'}`);
    for (const source of linkingSources) {
      assert.notEqual(source, target);
    }
  }
});

test('each priority suburb has its own planning section and no paragraph is shared', () => {
  const seen = new Map();

  for (const slug of SUBURBS) {
    const section = getMoveBrief(readPage(slug));
    assert.ok(section, `${slug} is missing its suburb-move-brief section`);
    const paragraphs = getParagraphs(section);
    assert.ok(paragraphs.length >= 3, `${slug} planning section should have at least 3 paragraphs`);
    const words = paragraphs.join(' ').split(/\s+/).length;
    assert.ok(words >= 120, `${slug} planning section is too thin: ${words} words`);

    for (const paragraph of paragraphs) {
      assert.equal(seen.has(paragraph), false, `${slug} repeats a paragraph already used on ${seen.get(paragraph)}`);
      seen.set(paragraph, slug);
    }
  }
});

test('planning sections do not repeat sentences across the eight suburbs', () => {
  const sentenceOwners = new Map();
  for (const slug of SUBURBS) {
    const text = getParagraphs(getMoveBrief(readPage(slug))).join(' ');
    for (const sentence of text.split(/(?<=[.!?])\s+/)) {
      const key = sentence.toLowerCase().trim();
      if (key.length < 25) continue;
      assert.equal(sentenceOwners.has(key), false, `"${sentence}" appears on ${sentenceOwners.get(key)} and ${slug}`);
      sentenceOwners.set(key, slug);
    }
  }
});

test('planning sections avoid unsupported claims', () => {
  const forbidden = /guarantee|24\/7|free travel|fixed[- ]price|insured|insurance/i;
  for (const slug of SUBURBS) {
    const text = stripTags(getMoveBrief(readPage(slug)));
    assert.doesNotMatch(text, forbidden, `${slug} planning section contains a claim we cannot support`);
  }
});

test('priority suburb pages keep a prominent quote path and approved rates wording', () => {
  for (const slug of SUBURBS) {
    const main = getMain(readPage(slug));
    assert.match(main, /href="\/contact-us\/#quote-form"/, `${slug} lost its quote CTA`);
    assert.match(main, /href="tel:\+61433819989"/, `${slug} lost its call CTA`);
  }
  for (const slug of ['malvern', 'medindie', 'toorak-gardens', 'brighton']) {
    const html = readPage(slug);
    const description = decode(html.match(/<meta name="description" content="([^"]*)"/)[1]);
    assert.match(description, /2 men \+ truck \$75 per 30 minutes, 3 men \+ truck \$89 per 30 minutes\. Call-out\/travel may apply/, `${slug} description lost the approved rates wording`);
    assert.doesNotMatch(description, /guarantee|24\/7|free travel|fixed[- ]price/i);
  }
});

test('structured data is not duplicated and canonical stays on the apex host', () => {
  for (const slug of SUBURBS) {
    const html = readPage(slug);
    const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
    assert.equal(canonical, `https://zqremovalsadelaide.com.au/removalists-${slug}/`);
    assert.doesNotMatch(html, /<meta name="robots" content="[^"]*noindex/i);
    const jsonLd = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((match) => match[1]).join('\n');
    assert.ok((jsonLd.match(/"@type":\s*"FAQPage"/g) || []).length <= 1, `${slug} has duplicate FAQPage schema`);
    assert.ok((jsonLd.match(/"@type":\s*"BreadcrumbList"/g) || []).length <= 1, `${slug} has duplicate BreadcrumbList schema`);
  }
});
