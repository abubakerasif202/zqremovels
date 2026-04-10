import { readFile, stat } from 'node:fs/promises';
import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();
const distRoot = path.join(projectRoot, 'site-dist');

function extractHeadings(html) {
  return [...html.matchAll(/<h([1-6])[^>]*>/gi)].map((match) => Number(match[1]));
}

function validateHeadingOrder(headings) {
  let previous = 0;
  const problems = [];
  for (const level of headings) {
    if (previous && level > previous + 1) {
      problems.push(`heading jump from h${previous} to h${level}`);
    }
    previous = level;
  }
  return problems;
}

function validateResponsiveImage(html, selectorHint, src, requiredAttrs = []) {
  const images = html.match(/<img[\s\S]*?>/gi) || [];
  const match = images.find((tag) => tag.includes(`src="${src}"`) && requiredAttrs.every((attr) => tag.includes(attr)));
  if (!match) {
    return [`missing image ${src} (${selectorHint})`];
  }

  const tag = match;
  const problems = [];
  if (!tag.includes('srcset=')) {
    problems.push(`${selectorHint}: missing srcset`);
  }
  if (!tag.includes('sizes=')) {
    problems.push(`${selectorHint}: missing sizes`);
  }

  for (const attr of requiredAttrs) {
    if (!tag.includes(attr)) {
      problems.push(`${selectorHint}: missing ${attr}`);
    }
  }

  return problems;
}

async function fileBytes(relativePath) {
  return (await stat(path.join(distRoot, relativePath))).size;
}

const homeHtml = await readFile(path.join(distRoot, 'index.html'), 'utf8');
const contactHtml = await readFile(path.join(distRoot, 'contact-us', 'index.html'), 'utf8');

const failures = [];
const warnings = [];

failures.push(...validateHeadingOrder(extractHeadings(contactHtml)).map((msg) => `/contact-us/: ${msg}`));

failures.push(
  ...validateResponsiveImage(
    homeHtml,
    'home hero trust logo',
    '/brand-logo-96.webp',
    ['width="76"', 'height="76"'],
  ).map((msg) => `/ : ${msg}`),
);

failures.push(
  ...validateResponsiveImage(
    contactHtml,
    'contact header logo',
    '/brand-logo-96.webp',
    ['width="68"', 'height="68"'],
  ).map((msg) => `/contact-us/: ${msg}`),
);

const homeHeroBytes = await fileBytes('media/home-local-hero-branded.webp');
const contactHeroBytes = await fileBytes('media/contact-quote-branded.webp');
const logoBytes = await fileBytes('brand-logo-64.webp');

if (contactHeroBytes + logoBytes > 100000) {
  warnings.push('/contact-us/: image payload is still relatively large');
}
if (homeHeroBytes + logoBytes > 120000) {
  warnings.push('/ : image payload is still relatively large');
}

if (failures.length) {
  console.error('Static Lighthouse checks failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Static Lighthouse checks passed for / and /contact-us/.');
if (warnings.length) {
  console.log('Non-blocking Lighthouse warnings:');
  for (const warning of warnings) {
    console.log(`- ${warning}`);
  }
}

process.exit(0);
