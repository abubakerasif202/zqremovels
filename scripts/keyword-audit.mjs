import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// Assigned targets express intent; inferred targets are candidates for editorial review.
const primaryTargets = {
  '/': 'Adelaide removalists',
  '/removalists-adelaide/': 'removalists Adelaide',
  '/removalists-adelaide-prices/': 'removalists Adelaide prices',
  '/office-removals-adelaide/': 'office removalists Adelaide',
  '/house-removals-adelaide/': 'house removalists Adelaide',
  '/furniture-removalists-adelaide/': 'furniture removalists Adelaide',
  '/packing-services-adelaide/': 'packing services Adelaide',
  '/apartment-removalists-adelaide/': 'apartment removalists Adelaide',
  '/interstate-removals-adelaide/': 'interstate removalists Adelaide',
  '/cheap-removalists-adelaide/': 'cheap removalists Adelaide',
  '/services/piano-movers-adelaide/': 'piano movers Adelaide',
};

function decode(value) {
  return value.replace(/&#(x[\da-f]+|\d+);/gi, (entity, code) => {
    const point = code[0].toLowerCase() === 'x' ? parseInt(code.slice(1), 16) : Number(code);
    return point > 0 && point <= 0x10ffff ? String.fromCodePoint(point) : entity;
  }).replace(/&(amp|quot|apos|lt|gt|nbsp);/g, (_, name) => ({
    amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: ' ',
  })[name]);
}

function textOnly(html) {
  return decode(html.replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style|template)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function tokens(text) {
  return text.toLowerCase().match(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu) || [];
}

export function measureKeyword(text, keyword) {
  const words = tokens(text);
  const phrase = tokens(keyword);
  let occurrences = 0;
  if (phrase.length) {
    for (let index = 0; index <= words.length - phrase.length; index += 1) {
      if (phrase.every((word, offset) => word === words[index + offset])) occurrences += 1;
    }
  }
  return {
    words: words.length,
    occurrences,
    densityPercent: words.length ? Number((100 * occurrences / words.length).toFixed(3)) : 0,
  };
}

export function analyzeKeywordPage(html) {
  if (/<meta\b[^>]*name="robots"[^>]*content="[^"]*\bnoindex\b/i.test(html)
    || /<meta\b[^>]*http-equiv="refresh"/i.test(html)) return null;
  const canonical = decode(html.match(/<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"/i)?.[1] || '');
  if (!canonical) throw new Error('Indexable page has no canonical URL');
  const route = new URL(canonical).pathname;
  const title = textOnly(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '');
  const description = decode(html.match(/<meta\b[^>]*name="description"[^>]*content="([^"]*)"/i)?.[1] || '');
  const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1];
  if (main === undefined) throw new Error(`Indexable page has no main content: ${route}`);
  const h1s = [...main.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map((match) => textOnly(match[1]));
  const keyword = primaryTargets[route] || title.split('|')[0].trim();
  return {
    route, canonical, title, description, h1s,
    primaryKeyword: keyword,
    targetSource: primaryTargets[route] ? 'assigned' : 'inferred from title',
    ...measureKeyword(textOnly(main), keyword),
    placement: {
      title: measureKeyword(title, keyword).occurrences > 0,
      description: measureKeyword(description, keyword).occurrences > 0,
      h1: h1s.some((heading) => measureKeyword(heading, keyword).occurrences > 0),
    },
  };
}

export async function auditKeywords(distRoot = path.resolve('site-dist')) {
  const pages = [];
  async function visit(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) await visit(file);
      else if (entry.name.endsWith('.html')) {
        const result = analyzeKeywordPage(await readFile(file, 'utf8'));
        if (result) pages.push({ file: path.relative(distRoot, file).split(path.sep).join('/'), ...result });
      }
    }
  }
  await visit(distRoot);
  if (!pages.length) throw new Error('No indexable pages found; run npm run build first');
  pages.sort((a, b) => a.route.localeCompare(b.route));
  const duplicates = [];
  for (const field of ['canonical', 'title', 'description']) {
    const values = new Map();
    for (const page of pages) {
      const key = page[field].toLowerCase();
      if (!key) continue;
      values.set(key, [...(values.get(key) || []), page.route]);
    }
    for (const [value, routes] of values) {
      if (routes.length > 1) duplicates.push({ field, value, routes });
    }
  }
  return {
    method: 'Main-content phrase occurrences / main-content word tokens * 100. Scripts, styles, templates and comments excluded. No ranking threshold; inflections and reordered words count separately. CSS visibility is not evaluated.',
    pageCount: pages.length,
    duplicates,
    pages,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  console.log(JSON.stringify(await auditKeywords(), null, 2));
}
