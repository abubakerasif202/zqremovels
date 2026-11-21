// Fingerprint prefix. Bump it if the normalisation or the fingerprint below ever changes, so old
// records never match by accident.
const FINGERPRINT_VERSION = 'c1';

// Change detection only: this is not a security hash and nothing secret is protected by it. It is
// a 53-bit non-cryptographic fingerprint (cyrb53) combined with the content length.
function fingerprint(text) {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < text.length; i += 1) {
    const code = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ code, 2654435761);
    h2 = Math.imul(h2 ^ code, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const value = 4294967296 * (2097151 & h2) + (h1 >>> 0);
  return `${FINGERPRINT_VERSION}:${value.toString(16).padStart(14, '0')}-${text.length.toString(16)}`;
}

// Remove every open..close block with plain string scanning. This avoids the regex pitfall where
// removing one match can splice the surrounding text into a new, unremoved match (for example
// "<!<!---->--"). An unterminated block is dropped to the end of the text, as HTML parsers do.
function stripDelimited(text, open, close, ignoreCase = false) {
  const haystack = ignoreCase ? text.replace(/[A-Z]/g, (char) => char.toLowerCase()) : text;
  let output = '';
  let position = 0;
  for (;;) {
    const start = haystack.indexOf(open, position);
    if (start === -1) return output + text.slice(position);
    output += text.slice(position, start);
    const end = haystack.indexOf(close, start + open.length);
    if (end === -1) return output;
    position = end + close.length;
  }
}

// Track rendered page content, metadata and schema, not build IDs, CSS or scripts.
export function meaningfulContentHash(html) {
  const source = String(html);
  const main = source.match(/<main\b[^>]*>[\s\S]*?<\/main>/i)?.[0];
  if (!main) throw new Error('Cannot track a page without main content');
  const metadata = source.match(/<title\b[^>]*>[\s\S]*?<\/title>|<meta\b[^>]*name=["']description["'][^>]*>|<link\b[^>]*rel=["']canonical["'][^>]*>/gi) || [];
  const schema = [...source.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
    .map(([, json]) => JSON.stringify(JSON.parse(json)));
  const withoutBlocks = stripDelimited(stripDelimited(stripDelimited(main, '<!--', '-->'), '<script', '</script>', true), '<style', '</style>', true);
  const content = withoutBlocks
    .replace(/\s(?:class|style|data-[\w-]+)=(?:"[^"]*"|'[^']*')/gi, '')
    .replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim();
  return fingerprint(JSON.stringify([metadata, content, schema]));
}

export function resolveContentLastmod(history, canonical, html) {
  const record = history?.pages?.[canonical];
  return record?.hash === meaningfulContentHash(html) ? record.lastmod : undefined;
}
