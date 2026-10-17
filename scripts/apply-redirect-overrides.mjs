/**
 * Applies data/migration/redirect-overrides.json to vercel.json and
 * site-src/data/zq-redirects-verified.json. Idempotent.
 * Run: node scripts/apply-redirect-overrides.mjs
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HOST = 'https://zqremovalsadelaide.com.au';
const overrides = JSON.parse(await readFile(path.join(root, 'data/migration/redirect-overrides.json'), 'utf8'));

const vercelPath = path.join(root, 'vercel.json');
const verifiedPath = path.join(root, 'site-src/data/zq-redirects-verified.json');
const vercel = JSON.parse(await readFile(vercelPath, 'utf8'));
const verified = JSON.parse(await readFile(verifiedPath, 'utf8'));

let changed = 0;
for (const { source, destination } of overrides) {
  const rule = vercel.redirects.find((r) => r.source === source);
  const entry = verified.find((r) => r.source === source);
  if (!rule || !entry) throw new Error(`Override source has no redirect rule: ${source}`);
  if (vercel.redirects.some((r) => r.source === destination)) throw new Error(`Override would chain: ${source} -> ${destination}`);
  if (rule.destination !== HOST + destination || entry.destination !== destination) changed++;
  rule.destination = HOST + destination;
  entry.destination = destination;
}
await writeFile(vercelPath, `${JSON.stringify(vercel, null, 2)}\n`);
await writeFile(verifiedPath, `${JSON.stringify(verified, null, 2)}\n`);
console.log(`overrides: ${overrides.length}, changed: ${changed}`);
