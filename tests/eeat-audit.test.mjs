import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const root = process.cwd();
const distDir = path.join(root, 'site-dist');

function readDist(relativePath) {
  return readFileSync(path.join(distDir, relativePath), 'utf8');
}

test('build succeeds before audit assertions run', () => {
  execSync('npm run build', {
    cwd: root,
    stdio: 'pipe',
  });
});

test('homepage schema does not publish an unsupported aggregate rating', () => {
  const homepage = readDist('index.html');
  assert.doesNotMatch(homepage, /AggregateRating|aggregateRating|reviewCount|ratingValue/);
});

test('homepage and contact page avoid Gemini-labelled imagery and expose an alt-labelled logo', () => {
  const homepage = readDist('index.html');
  const contactPage = readDist(path.join('contact-us', 'index.html'));

  assert.doesNotMatch(homepage, /Gemini_Generated_Image/i);
  assert.doesNotMatch(contactPage, /Gemini_Generated_Image/i);
  assert.match(
    homepage,
    /<img[^>]+src="\/brand-logo\.webp"[^>]+alt="[^"]+\S[^"]*"/i,
  );
});

test('about page is built and surfaced from shared navigation', () => {
  const homepage = readDist('index.html');
  const aboutPage = readDist(path.join('about', 'index.html'));

  assert.match(homepage, /href="\/about\/"/);
  assert.match(aboutPage, /<h1[^>]*>About ZQ Removals/i);
  assert.match(aboutPage, /Representative move briefs/i);
});
