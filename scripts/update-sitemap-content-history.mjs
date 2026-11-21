import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { meaningfulContentHash } from './sitemap-content-history.mjs';
import { validateLastmod } from './sitemap-lastmod.mjs';

const args = process.argv.slice(2);
const seed = args.includes('--seed');
const date = args.find(arg => arg.startsWith('--date='))?.slice(7);
if (!seed && !validateLastmod(date)) throw new Error('Pass --seed once, or --date=YYYY-MM-DD for the actual content change date. Build first.');
if (date && date > new Date().toISOString().slice(0, 10)) throw new Error('Future lastmod dates are not allowed');
const filename = 'site-src/data/sitemap-content-history.json';
let history = { version: 1, pages: {} };
try { history = JSON.parse(await readFile(filename, 'utf8')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
if (seed && Object.keys(history.pages).length) throw new Error('History already exists; seed cannot overwrite it');
const sitemap = await readFile('site-dist/ai-sitemap.xml', 'utf8');
let changed = 0;
for (const [, entry] of sitemap.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
  const canonical = entry.match(/<loc>(.*?)<\/loc>/)?.[1];
  const url = new URL(canonical);
  if (url.origin !== 'https://zqremovalsadelaide.com.au') throw new Error('Unexpected canonical host');
  const html = await readFile(path.join('site-dist', url.pathname, 'index.html'), 'utf8');
  const hash = meaningfulContentHash(html);
  if (history.pages[canonical]?.hash === hash) continue;
  const lastmod = seed ? validateLastmod(entry.match(/<lastmod>(.*?)<\/lastmod>/)?.[1]) : date;
  history.pages[canonical] = { hash, ...(lastmod ? { lastmod } : {}) };
  changed++;
}
history.pages = Object.fromEntries(Object.entries(history.pages).sort(([a], [b]) => a.localeCompare(b)));
await writeFile(filename, `${JSON.stringify(history, null, 2)}\n`);
console.log(`Recorded ${changed} changed pages. Review and commit ${filename}; rebuild to emit dates.`);
