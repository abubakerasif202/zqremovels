import { copyFile, cp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const srcRoot = path.join(root, 'site-src');
const distRoot = path.join(root, 'site-dist');

const templates = {
  standard: await readFile(path.join(srcRoot, 'templates', 'standard.html'), 'utf8'),
  bare: await readFile(path.join(srcRoot, 'templates', 'bare.html'), 'utf8'),
  redirect: await readFile(path.join(srcRoot, 'templates', 'redirect.html'), 'utf8'),
};

const partials = {
  header: await readFile(path.join(srcRoot, 'partials', 'header.html'), 'utf8'),
  footer: await readFile(path.join(srcRoot, 'partials', 'footer.html'), 'utf8'),
};

const pages = JSON.parse(await readFile(path.join(srcRoot, 'pages.json'), 'utf8'));

await rm(distRoot, { recursive: true, force: true });
await mkdir(distRoot, { recursive: true });
await copyFile(path.join(root, 'premium-site.css'), path.join(root, 'premium-site.min.css'));
await copyFile(path.join(root, 'premium-site.css'), path.join(distRoot, 'premium-site.min.css'));

for (const page of pages) {
  const contentPath = path.join(srcRoot, page.contentFile);
  let content = await readFile(contentPath, 'utf8');
  content = transformContent(content, page);

  const head = renderHead(page);
  const bodyAttributes = renderBodyAttributes(page);
  const template = templates[page.layout] ?? templates.standard;

  const html = template
    .replace('{{HEAD}}', indent(head, 4))
    .replace('{{BODY_ATTRIBUTES}}', bodyAttributes)
    .replace('{{HEADER}}', indent(page.layout === 'standard' ? partials.header : '', 4))
    .replace('{{CONTENT}}', indent(content.trim(), 4))
    .replace('{{FOOTER}}', indent(page.layout === 'standard' ? partials.footer : '', 4));

  const outputPath = path.join(root, page.output);
  const distOutputPath = path.join(distRoot, page.output);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await mkdir(path.dirname(distOutputPath), { recursive: true });
  await writeFile(outputPath, `${html.trim()}\n`, 'utf8');
  await writeFile(distOutputPath, `${html.trim()}\n`, 'utf8');
  console.log(`built ${page.output}`);
}

const sitemap = await renderSitemap(pages);
await writeFile(path.join(root, 'sitemap.xml'), sitemap, 'utf8');
await writeFile(path.join(distRoot, 'sitemap.xml'), sitemap, 'utf8');

await copyStaticAssets();

function renderHead(page) {
  const tags = [
    '<meta charset="utf-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1" />',
    `<title>${escapeHtml(page.title)}</title>`,
    `<meta name="description" content="${escapeAttribute(page.description)}" />`,
    `<link rel="canonical" href="${escapeAttribute(page.canonical)}" />`,
    `<meta name="theme-color" content="${escapeAttribute(page.themeColor || '#0A192F')}" />`,
    `<meta name="robots" content="${escapeAttribute(page.robots || 'index,follow,max-image-preview:large')}" />`,
    '<link rel="icon" type="image/svg+xml" href="/favicon.svg" />',
    `<meta property="og:type" content="${escapeAttribute(page.ogType || 'website')}" />`,
    '<meta property="og:site_name" content="ZQ Removals" />',
    '<meta property="og:locale" content="en_AU" />',
    `<meta property="og:url" content="${escapeAttribute(page.ogUrl || page.canonical)}" />`,
    `<meta property="og:title" content="${escapeAttribute(page.ogTitle || page.title)}" />`,
    `<meta property="og:description" content="${escapeAttribute(page.ogDescription || page.description)}" />`,
    `<meta property="og:image" content="${escapeAttribute(page.ogImage)}" />`,
    `<meta property="twitter:card" content="${escapeAttribute(page.twitterCard || 'summary_large_image')}" />`,
    `<meta property="twitter:title" content="${escapeAttribute(page.twitterTitle || page.title)}" />`,
    `<meta property="twitter:description" content="${escapeAttribute(page.twitterDescription || page.description)}" />`,
    `<meta property="twitter:image" content="${escapeAttribute(page.twitterImage || page.ogImage)}" />`,
  ];

  if (page.layout !== 'redirect') {
    tags.push('<link rel="stylesheet" href="/premium-site.min.css" />');
  }

  if (page.refresh) {
    tags.push(`<meta http-equiv="refresh" content="${escapeAttribute(page.refresh)}" />`);
  }

  for (const jsonLd of page.jsonLd || []) {
    tags.push(`<script type="application/ld+json">\n${jsonLd}\n</script>`);
  }

  return tags.join('\n');
}

function renderBodyAttributes(page) {
  const classes = [];
  if (page.output === 'thank-you.html') {
    classes.push('thank-you-page');
  }

  return classes.length > 0 ? ` class="${classes.join(' ')}"` : '';
}

function transformContent(content, page) {
  let next = content.replaceAll('href="/#quote-form"', 'href="/contact-us/#quote-form"');
  next = next.replace(/\/contact-us(?:\/contact-us)+\/#quote-form/g, '/contact-us/#quote-form');

  if (page.output === 'index.html') {
    next = next
      .replaceAll('/zq-removals-social-share.png', '/zq-removals-social-share.webp')
      .replaceAll('/brand-logo.png', '/brand-logo.webp')
      .replaceAll('/screen.png', '/screen.webp');
  }

  if (next.includes('class="hero-section"')) {
    next = next.replaceAll('/brand-logo.png', '/zq-removals-social-share.webp');
  }

  return next;
}

function indent(text, spaces) {
  if (!text) {
    return '';
  }

  const prefix = ' '.repeat(spaces);
  return text
    .split('\n')
    .map((line) => (line.length > 0 ? `${prefix}${line}` : line))
    .join('\n');
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function escapeAttribute(value = '') {
  return escapeHtml(value).replaceAll('"', '&quot;');
}

async function copyStaticAssets() {
  const fileAssets = [
    'brand-logo.png',
    'brand-logo.webp',
    'favicon.svg',
    'robots.txt',
    'screen.png',
    'screen.webp',
    'site.js',
    'zq-removals-social-share.png',
    'zq-removals-social-share.webp',
  ];

  for (const asset of fileAssets) {
    await copyFile(path.join(root, asset), path.join(distRoot, asset));
  }

  await cp(path.join(root, 'fonts'), path.join(distRoot, 'fonts'), { recursive: true });
  await cp(path.join(root, 'media'), path.join(distRoot, 'media'), { recursive: true });
}

async function renderSitemap(pages) {
  const urls = [];

  for (const page of pages) {
    if (page.output === 'privacy-policy.html' || page.output === 'terms-and-conditions.html') {
      continue;
    }

    if ((page.robots || '').includes('noindex')) {
      continue;
    }

    const contentPath = path.join(srcRoot, page.contentFile);
    const { mtime } = await stat(contentPath);
    const meta = getSitemapMeta(page);

    urls.push(`  <url>
    <loc>${escapeHtml(page.canonical)}</loc>
    <lastmod>${mtime.toISOString().slice(0, 10)}</lastmod>
    <changefreq>${meta.changefreq}</changefreq>
    <priority>${meta.priority}</priority>
  </url>`);
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`;
}

function getSitemapMeta(page) {
  if (page.output === 'index.html') {
    return { changefreq: 'monthly', priority: '1.0' };
  }

  if (page.output === 'removalists-adelaide/index.html') {
    return { changefreq: 'monthly', priority: '0.9' };
  }

  if (
    page.output === 'adelaide-moving-guides/index.html' ||
    page.output === 'furniture-removalists-adelaide/index.html' ||
    page.output === 'office-removals-adelaide/index.html' ||
    page.output === 'interstate-removals-adelaide/index.html' ||
    page.output === 'adelaide-to-melbourne-removals/index.html' ||
    page.output === 'adelaide-to-sydney-removals/index.html' ||
    page.output === 'packing-services-adelaide/index.html'
  ) {
    return { changefreq: 'monthly', priority: '0.8' };
  }

  if (page.output.startsWith('adelaide-moving-guides/')) {
    return { changefreq: 'monthly', priority: '0.7' };
  }

  if (page.output === 'contact-us/index.html') {
    return { changefreq: 'monthly', priority: '0.7' };
  }

  if (page.output.startsWith('removalists-')) {
    return { changefreq: 'monthly', priority: '0.8' };
  }

  return { changefreq: 'monthly', priority: '0.7' };
}
