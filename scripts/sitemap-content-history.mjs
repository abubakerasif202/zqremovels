import { createHash } from 'node:crypto';

// Track rendered page content, metadata and schema, not build IDs, CSS or scripts.
export function meaningfulContentHash(html) {
  const source = String(html);
  const main = source.match(/<main\b[^>]*>[\s\S]*?<\/main>/i)?.[0];
  if (!main) throw new Error('Cannot track a page without main content');
  const metadata = source.match(/<title\b[^>]*>[\s\S]*?<\/title>|<meta\b[^>]*name=["']description["'][^>]*>|<link\b[^>]*rel=["']canonical["'][^>]*>/gi) || [];
  const schema = [...source.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
    .map(([, json]) => JSON.stringify(JSON.parse(json)));
  const content = main.replace(/<!--[^]*?-->/g, '')
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/\s(?:class|style|data-[\w-]+)=(?:"[^"]*"|'[^']*')/gi, '')
    .replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim();
  return createHash('sha256').update(JSON.stringify([metadata, content, schema])).digest('hex');
}

export function resolveContentLastmod(history, canonical, html) {
  const record = history?.pages?.[canonical];
  return record?.hash === meaningfulContentHash(html) ? record.lastmod : undefined;
}
