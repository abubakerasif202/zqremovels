#!/usr/bin/env node
// Reports internal links in site-dist that point at URLs which vercel.json redirects away.
// Usage: node scripts/audit-internal-redirect-links.mjs [--json]
// Exit code 1 when any internal link targets a redirect source.
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(root, 'site-dist');
const origin = 'https://zqremovalsadelaide.com.au';

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (entry.name.endsWith('.html')) yield full;
  }
}

const vercel = JSON.parse(await readFile(path.join(root, 'vercel.json'), 'utf8'));
const redirects = new Map();
for (const rule of vercel.redirects || []) {
  if (typeof rule.source === 'string' && !/[:*()]/.test(rule.source)) {
    redirects.set(rule.source, rule.destination);
  }
}

export function normaliseInternalHref(href) {
  if (!href || href.startsWith('#') || /^(mailto|tel|sms|javascript):/i.test(href)) return null;
  let url;
  try {
    url = new URL(href, `${origin}/`);
  } catch {
    return null;
  }
  if (url.origin !== origin) return null;
  return url.pathname;
}

const findings = [];
for await (const file of walk(distDir)) {
  const rel = path.relative(distDir, file).replace(/\\/g, '/');
  const page = `/${rel.replace(/index\.html$/, '')}`;
  const html = await readFile(file, 'utf8');
  // Skip canonical/alternate/og metadata: only anchors are user-facing internal links.
  for (const match of html.matchAll(/<a\s[^>]*href="([^"]+)"/gi)) {
    const target = normaliseInternalHref(match[1]);
    if (target && redirects.has(target)) {
      findings.push({ page, target, destination: redirects.get(target) });
    }
  }
}

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(findings, null, 2));
} else {
  const byTarget = new Map();
  for (const f of findings) {
    byTarget.set(f.target, [...(byTarget.get(f.target) || []), f.page]);
  }
  for (const [target, pages] of byTarget) {
    console.log(`${target} -> ${redirects.get(target)}  (${pages.length} pages, e.g. ${pages.slice(0, 3).join(', ')})`);
  }
  console.log(`\n${findings.length} internal links to redirected URLs across ${byTarget.size} targets.`);
}
process.exitCode = findings.length ? 1 : 0;
