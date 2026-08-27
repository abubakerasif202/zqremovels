import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();
const requiredFaqs = [
  'How much do removalists cost in Adelaide?',
  'How early should I book?',
  'Do you offer packing services?',
  'Can you move apartments and high-rise properties?',
  'Do you disassemble and reassemble furniture?',
  'Do you handle interstate moves?',
  'What happens if my moving date changes?',
  'Can I request an urgent or same-day move?',
];
const serviceRoutes = [
  '/services/house-removals-adelaide/',
  '/services/apartment-removals-adelaide/',
  '/office-removals-adelaide/',
  '/services/interstate-removals-adelaide/',
  '/services/packing-services-adelaide/',
  '/furniture-removalists-adelaide/',
  '/services/piano-movers-adelaide/',
  '/storage-friendly-removals-adelaide/',
  '/same-day-removalists-adelaide/',
];

test('Open Design homepage contract is generator-native and complete', async () => {
  const source = await readFile(path.join(root, 'site-src', 'content', 'index.html'), 'utf8');
  const built = await readFile(path.join(root, 'site-dist', 'index.html'), 'utf8');

  for (const html of [source, built]) {
    assert.equal((html.match(/<h1\b/gi) || []).length, 1);
    assert.match(html, /<h1[^>]*>Adelaide Removalists You Can Rely On<\/h1>/i);
    assert.equal((html.match(/data-service-card/g) || []).length, 9);
    assert.equal((html.match(/itemtype="https:\/\/schema\.org\/Question"/g) || []).length, 8);
    assert.equal((html.match(/data-quote-form="quote"/g) || []).length, 2);

    for (const route of serviceRoutes) {
      assert.match(html, new RegExp(`href="${route.replace(/\//g, '\\/')}"`));
    }
    for (const question of requiredFaqs) {
      assert.match(html, new RegExp(question.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
    for (const field of ['name', 'phone', 'email', 'pickup_suburb', 'dropoff_suburb', 'move_date', 'move_scope', 'move_size', 'message']) {
      assert.match(html, new RegExp(`name="${field}"`));
    }

    assert.match(html, /href="tel:\+61433819989"/);
    assert.match(html, /0433 819 989/);
    assert.match(html, /id="reviews"/);
    assert.match(html, /Planning a move in Adelaide\? Get your free ZQ Removals quote today\./);
    assert.match(html, /(?:5\.0|\{\{google\.rating\}\})[\s\S]*from (?:59|\{\{google\.reviewCount\}\})[\s\S]*Google reviews/i);
    assert.match(html, /(?:href="https:\/\/share\.google\/toaQ1pTUMpigxRuQM"|href="\{\{google\.profileUrl\}\}")/i);
    assert.match(html, /google-review-stars" role="img" aria-label="5 out of 5 stars"/i);
    assert.doesNotMatch(html, /Site owner to replace|Placeholder for a verified Google review|Review excerpts below are placeholders/i);
    assert.doesNotMatch(html, /54 Google|5\.0\/5|5\.0-star|top-rated|fully insured|AFRA|award-winning|guaranteed|zero damage/i);
  }

  for (const reviewText of [
    'Rakib Rafi',
    'Great service. They helped move my house a long way from Adelaide, almost 450km away.',
    'coline tangai',
    'Very helpful and kind.',
    'Wayne Rowe \\(Wayno\\)',
    'Very efficient, on time and affordable.',
  ]) {
    assert.match(built, new RegExp(reviewText, 'i'));
  }
  assert.match(built, /admin@zqremovals\.au/);
});

test('homepage navigation and sticky actions stay complete across desktop and mobile markup', async () => {
  const header = await readFile(path.join(root, 'site-src', 'partials', 'header.html'), 'utf8');
  const template = await readFile(path.join(root, 'site-src', 'templates', 'standard.html'), 'utf8');

  for (const label of ['Home', 'Services', 'Locations', 'About', 'Reviews', 'Contact']) {
    assert.match(header, new RegExp(`>${label}(?:<| ZQ Removals<)`));
  }
  assert.match(header, /aria-label="Primary navigation"/);
  assert.match(header, /aria-label="Mobile navigation"/);
  assert.match(header, /aria-controls="mobile-nav-panel"/);
  assert.match(header, /href="tel:\+61433819989"/);
  assert.match(header, />Get a Free Quote<\/a>/);
  assert.doesNotMatch(header, /Google rating|\b54 reviews\b/i);

  assert.match(template, /class="sticky-mobile-cta"/);
  assert.match(template, /aria-label="Quick contact actions"/);
  assert.match(template, /href="tel:\+61433819989"/);
  assert.match(template, />Get a Free Quote<\/a>/);
});

test('homepage visual layer preserves contrast, responsive navigation and reduced motion', async () => {
  const generatorCss = await readFile(path.join(root, 'premium-site.css'), 'utf8');
  const astroCss = await readFile(path.join(root, 'src', 'styles', 'premium-site.css'), 'utf8');

  for (const css of [generatorCss, astroCss]) {
    assert.match(css, /2026 OPEN DESIGN HOMEPAGE V2/);
    assert.match(css, /--zq-v2-ink:\s*#10263f/);
    assert.match(css, /--zq-v2-surface:\s*#fffdfa/);
    assert.match(css, /--zq-v2-accent:\s*#d6a45b/);
    assert.match(css, /@media \(max-width: 1120px\)[\s\S]*?\.desktop-nav[\s\S]*?display:\s*none\s*!important/);
    assert.match(css, /@media \(max-width: 640px\)[\s\S]*?\.sticky-mobile-cta/);
    assert.match(css, /@media \(min-width: 1121px\)[\s\S]*?body\.page-home \.sticky-mobile-cta[\s\S]*?display:\s*none\s*!important/);
    assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
    assert.match(css, /\.zq-v2-home :focus-visible/);
  }
});

test('homepage JSON-LD uses the visible FAQs and contains no unsupported trust claims', async () => {
  const pages = JSON.parse(await readFile(path.join(root, 'site-src', 'pages.json'), 'utf8'));
  const homepage = pages.find((page) => page.output === 'index.html');
  assert.ok(homepage);
  const schemas = homepage.jsonLd.map((block) => JSON.parse(block));
  const graph = schemas.flatMap((schema) => schema['@graph'] || [schema]);
  const faq = graph.find((node) => node['@type'] === 'FAQPage');
  const business = graph.find((node) => node['@type'] === 'MovingCompany');

  assert.deepEqual(faq.mainEntity.map((item) => item.name), requiredFaqs);
  assert.equal(business.telephone, '+61433819989');
  assert.equal(business.email, 'admin@zqremovals.au');
  assert.doesNotMatch(JSON.stringify(schemas), /AggregateRating|reviewCount|ratingValue|insured|guarantee|award/i);
});
