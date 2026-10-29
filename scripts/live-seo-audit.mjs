#!/usr/bin/env node
// Read-only live crawl of the sitemap: status, canonical, robots, metadata, headings,
// JSON-LD, internal links, and AI-crawler access. Writes JSON evidence to reports/.
// Usage: node scripts/live-seo-audit.mjs [origin] [out.json]
import { writeFileSync } from 'node:fs';

const ORIGIN = (process.argv[2] || 'https://zqremovalsadelaide.com.au').replace(/\/$/, '');
const OUT = process.argv[3] || 'reports/seo-aeo-live-crawl.json';
const CONCURRENCY = 8;
const BOTS = {
  Googlebot: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  Bingbot: 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
  'OAI-SearchBot': 'Mozilla/5.0 (compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot)',
  GPTBot: 'Mozilla/5.0 (compatible; GPTBot/1.1; +https://openai.com/gptbot)',
  PerplexityBot: 'Mozilla/5.0 (compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)',
  'ChatGPT-User': 'Mozilla/5.0 (compatible; ChatGPT-User/1.0; +https://openai.com/bot)',
  ClaudeBot: 'Mozilla/5.0 (compatible; ClaudeBot/1.0; +claudebot@anthropic.com)',
};

const get = async (url, ua, redirect = 'manual') => {
  const res = await fetch(url, { redirect, headers: ua ? { 'user-agent': ua } : {} });
  return res;
};
const locs = (xml) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());

async function sitemapUrls() {
  const idx = await (await get(`${ORIGIN}/sitemap.xml`)).text();
  const children = locs(idx);
  const urls = new Set();
  const childReport = [];
  for (const child of children) {
    const res = await get(child);
    const body = await res.text();
    const entries = locs(body);
    childReport.push({ child, status: res.status, entries: entries.length });
    if (/sitemap-images/.test(child)) continue;
    entries.forEach((u) => /\.(xml|jpg|png|webp|svg)$/i.test(u) || urls.add(u));
  }
  return { urls: [...urls], childReport };
}

const attr = (tag, name) => (tag.match(new RegExp(`${name}\\s*=\\s*"([^"]*)"`, 'i')) || [])[1];

// Visible text of an HTML fragment: keep only characters outside <...> (no regex sanitising).
function textOf(fragment) {
  let depth = 0;
  let out = '';
  for (const ch of fragment) {
    if (ch === '<') depth += 1;
    else if (ch === '>') depth = Math.max(0, depth - 1);
    else if (depth === 0) out += ch;
  }
  return out.trim();
}

function analyse(html) {
  const metas = [...html.matchAll(/<meta\b[^>]*>/gi)].map((m) => m[0]);
  const links = [...html.matchAll(/<link\b[^>]*>/gi)].map((m) => m[0]);
  const canonicals = links.filter((l) => /rel="canonical"/i.test(l)).map((l) => attr(l, 'href'));
  const robots = metas.filter((m) => /name="robots"/i.test(m)).map((m) => attr(m, 'content'));
  const description = metas.filter((m) => /name="description"/i.test(m)).map((m) => attr(m, 'content'));
  const title = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1]?.trim();
  const h1 = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) => textOf(m[1]));
  const levels = [...html.matchAll(/<h([1-6])\b/gi)].map((m) => Number(m[1]));
  const skips = levels.filter((l, i) => i > 0 && l - levels[i - 1] > 1).length;
  const ld = [];
  const ldErrors = [];
  for (const m of html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try { ld.push(JSON.parse(m[1])); } catch (e) { ldErrors.push(e.message); }
  }
  const flat = ld.flatMap((n) => (n['@graph'] ? n['@graph'] : [n]));
  const types = flat.flatMap((n) => [].concat(n['@type'] || []));
  const hrefs = [...html.matchAll(/<a\b[^>]*href="([^"#]+)"/gi)].map((m) => m[1]);
  const imgsNoAlt = [...html.matchAll(/<img\b[^>]*>/gi)].filter((m) => !/\balt=/i.test(m[0])).length;
  return { title, description, canonicals, robots, h1, headingSkips: skips, types, ldErrors, hrefs, imgsNoAlt, ldNodes: flat };
}

async function pool(items, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
    while (i < items.length) { const n = i++; out[n] = await fn(items[n]); }
  }));
  return out;
}

const { urls, childReport } = await sitemapUrls();
const pages = await pool(urls, async (url) => {
  try {
    const res = await get(url);
    const status = res.status;
    if (status >= 300) return { url, status, location: res.headers.get('location') };
    const html = await res.text();
    const a = analyse(html);
    const { hrefs, ldNodes, ...rest } = a;
    return { url, status, xRobots: res.headers.get('x-robots-tag'), ...rest, _hrefs: hrefs };
  } catch (e) { return { url, error: String(e) }; }
});

const known = new Set(urls.map((u) => u.replace(/\/$/, '')));
const issues = [];
const push = (sev, url, msg) => issues.push({ sev, url, msg });
const titleMap = new Map(); const descMap = new Map();
const inbound = new Map(urls.map((u) => [u, 0]));
const brokenCache = new Map();
for (const p of pages) {
  if (p.error || p.status !== 200) { push('high', p.url, `status ${p.status ?? p.error}${p.location ? ' -> ' + p.location : ''}`); continue; }
  if (p.canonicals.length !== 1) push('high', p.url, `canonical count ${p.canonicals.length}`);
  else if (p.canonicals[0] !== p.url) push('high', p.url, `canonical mismatch ${p.canonicals[0]}`);
  if (p.robots.some((r) => /noindex/i.test(r)) || /noindex/i.test(p.xRobots || '')) push('high', p.url, 'noindex in sitemap URL');
  if (!p.title) push('high', p.url, 'missing title'); else (titleMap.get(p.title) || titleMap.set(p.title, []).get(p.title)).push(p.url);
  if (p.title && p.title.length > 65) push('low', p.url, `title ${p.title.length} chars`);
  if (p.description.length !== 1) push('med', p.url, `meta description count ${p.description.length}`);
  else { (descMap.get(p.description[0]) || descMap.set(p.description[0], []).get(p.description[0])).push(p.url); if (p.description[0].length > 170) push('low', p.url, `description ${p.description[0].length} chars`); }
  if (p.h1.length !== 1) push('med', p.url, `h1 count ${p.h1.length}`);
  if (p.headingSkips) push('low', p.url, `${p.headingSkips} heading level skips`);
  if (p.ldErrors.length) push('high', p.url, `invalid JSON-LD: ${p.ldErrors[0]}`);
  if (p.imgsNoAlt) push('med', p.url, `${p.imgsNoAlt} img without alt`);
  for (const t of ['FAQPage', 'BreadcrumbList']) if (p.types.filter((x) => x === t).length > 1) push('high', p.url, `duplicate ${t}`);
  for (const h of p._hrefs) {
    let u; try { u = new URL(h, p.url); } catch { continue; }
    if (u.origin !== ORIGIN) { if (/zqremovals\.au|www\.zqremovalsadelaide/.test(u.host)) push('med', p.url, `legacy/www link ${h}`); continue; }
    const clean = u.origin + u.pathname;
    if (/\.(css|js|png|jpe?g|webp|svg|ico|xml|txt|pdf|woff2?)$/i.test(u.pathname)) continue;
    if (inbound.has(clean)) inbound.set(clean, inbound.get(clean) + (p.url === clean ? 0 : 1));
    else if (!known.has(clean.replace(/\/$/, ''))) brokenCache.set(clean, (brokenCache.get(clean) || new Set()).add(p.url));
  }
}
for (const [t, u] of titleMap) if (u.length > 1) push('med', u.join(' | '), `duplicate title "${t}"`);
for (const [d, u] of descMap) if (u.length > 1) push('med', u.join(' | '), 'duplicate meta description');
for (const [u, n] of inbound) if (n === 0 && u !== `${ORIGIN}/`) push('med', u, 'orphan (no inbound links from sitemap pages)');

const nonSitemapLinks = [];
for (const [u, from] of brokenCache) {
  const res = await get(u).catch(() => null);
  nonSitemapLinks.push({ url: u, status: res?.status ?? 'err', location: res?.headers.get('location'), linkedFrom: [...from].slice(0, 3), count: from.size });
}
for (const l of nonSitemapLinks) if (l.status >= 300) push('high', l.linkedFrom[0], `internal link to ${l.url} -> ${l.status}${l.location ? ' ' + l.location : ''} (x${l.count})`);

const probes = {};
for (const p of ['/', '/robots.txt', '/llms.txt', '/sitemap.xml', '/thank-you/', '/404.html']) {
  const r = await get(ORIGIN + p); probes[p] = { status: r.status, xRobots: r.headers.get('x-robots-tag') };
}
const botAccess = {};
for (const [name, ua] of Object.entries(BOTS)) {
  const r = await get(`${ORIGIN}/`, ua); botAccess[name] = r.status;
}
const variants = {};
for (const v of ['http://zqremovalsadelaide.com.au/', 'https://www.zqremovalsadelaide.com.au/', 'https://zqremovals.au/', 'https://zqremovalsadelaide.com.au/house-removals-adelaide', 'https://zqremovalsadelaide.com.au/index.html']) {
  const r = await get(v).catch(() => null); variants[v] = r ? { status: r.status, location: r.headers.get('location') } : 'err';
}
const robotsTxt = await (await get(`${ORIGIN}/robots.txt`)).text();

const report = {
  generatedAt: new Date().toISOString(), origin: ORIGIN, sitemapUrls: urls.length, childReport, probes, botAccess, variants, robotsTxt,
  issueCounts: issues.reduce((a, i) => ((a[i.sev] = (a[i.sev] || 0) + 1), a), {}), issues, pages: pages.map(({ _hrefs, ...p }) => p),
};
writeFileSync(OUT, JSON.stringify(report, null, 1));
console.log(JSON.stringify({ urls: urls.length, issueCounts: report.issueCounts, botAccess, variants, probes }, null, 1));
for (const i of issues.filter((x) => x.sev !== 'low').slice(0, 60)) console.log(`[${i.sev}] ${i.url} :: ${i.msg}`);
