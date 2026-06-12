import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();
const pages = JSON.parse(await readFile(path.join(root, 'site-src', 'pages.json'), 'utf8'));
const gallerySource = await readFile(
  path.join(root, 'site-src', 'content', 'premium-moving-concepts', 'index.html'),
  'utf8',
);

const assets = [
  'email-header-concept.webp',
  'social-card-concept.webp',
  'banner-ad-concept.webp',
  'loading-state-concept.webp',
  'corporate-relocation-concept.webp',
  'homepage-redesign-1-concept.webp',
  'homepage-redesign-2-concept.webp',
  'white-glove-service-concept.webp',
  'marketing-email-concept.webp',
];

test('remaining Stitch exports are integrated into the noindex concept gallery', async () => {
  const galleryPage = pages.find((page) => page.output === 'premium-moving-concepts/index.html');

  assert.ok(galleryPage, 'premium concept gallery route must exist');
  assert.match(galleryPage.robots, /noindex/i);
  assert.match(gallerySource, /placeholder contacts, ratings, client marks/i);

  for (const asset of assets) {
    await access(path.join(root, 'media', 'stitch', asset));
    assert.match(gallerySource, new RegExp(`/media/stitch/${asset.replace('.', '\\.')}`));
  }
});

test('integrated Stitch references publish through the normal build output', async () => {
  for (const asset of assets) {
    await access(path.join(root, 'site-dist', 'media', 'stitch', asset));
  }

  const builtGallery = await readFile(
    path.join(root, 'site-dist', 'premium-moving-concepts', 'index.html'),
    'utf8',
  );
  assert.match(builtGallery, /<meta name="robots" content="noindex,follow"/i);
  assert.match(builtGallery, /\/media\/stitch\/marketing-email-concept\.webp/);
});
