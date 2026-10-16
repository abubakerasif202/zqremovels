import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const run = promisify(execFile);

const oldOrigin = 'https://zqremovals.au';
const newOrigin = 'https://zqremovalsadelaide.com.au';
const paths = (await readFile('data/migration/legacy-paths.txt', 'utf8')).trim().split(/\r?\n/);
const extra = ['http://zqremovals.au/', 'http://www.zqremovals.au/', 'https://www.zqremovals.au/', `${oldOrigin}/legacy-sitemap.xml`];
const urls = [...paths.map(path => oldOrigin + path), ...extra];
const finalPages = new Map();
const decisions = new Map(JSON.parse(await readFile('data/migration/redirect-decisions.json', 'utf8')).map(item => [item.source, item]));
await mkdir('tmp/migration-live', { recursive: true });

async function request(url) {
  const { stdout } = await run(process.platform === 'win32' ? 'curl.exe' : 'curl', [
    '-sS', '--max-time', '25', '--retry', '1', '--max-filesize', '5242880',
    '-A', 'ZQMigrationRecoveryAudit/1.0', '--write-out',
    '\nZQ_AUDIT_STATUS:%{http_code}\nZQ_AUDIT_REDIRECT:%{redirect_url}', url,
  ], { maxBuffer: 6 * 1024 * 1024 });
  const marker = stdout.lastIndexOf('\nZQ_AUDIT_STATUS:');
  const [status, location] = stdout.slice(marker).trim().split('\n');
  return { status: Number(status.split(':')[1]), location: location.slice('ZQ_AUDIT_REDIRECT:'.length), body: stdout.slice(0, marker) };
}
const text = value => value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
function meta(html, kind, key, value) {
  for (const tag of html.match(/<(?:link|meta)\b[^>]*>/gi) || []) {
    const attributes = Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*["']([^"']*)["']/g)].map(match => [match[1].toLowerCase(), match[2]]));
    if (attributes[kind] === key) return attributes[value] || '';
  }
  return '';
}
const quote = value => `"${String(value ?? '').replaceAll('"', '""')}"`;
const records = new Array(urls.length);
let cursor = 0;
await Promise.all(Array.from({ length: 6 }, async () => {
  while (cursor < urls.length) {
    const index = cursor++;
    const source = urls[index];
    const record = { source, chain: [], finalUrl: source, hops: 0, checkedAt: new Date().toISOString() };
    try {
      const visited = new Set();
      for (let i = 0; i < 9; i++) {
        if (visited.has(record.finalUrl)) throw new Error('redirect loop');
        visited.add(record.finalUrl);
        // Final HTML is cached in memory, including aliases sharing a destination.
        const response = finalPages.has(record.finalUrl) ? finalPages.get(record.finalUrl) : await request(record.finalUrl);
        record.chain.push({ url: record.finalUrl, status: response.status, location: response.location });
        if ([301, 302, 303, 307, 308].includes(response.status) && response.location) {
          record.finalUrl = new URL(response.location, record.finalUrl).href;
          record.hops++;
          continue;
        }
        finalPages.set(record.finalUrl, response);
        record.finalStatus = response.status;
        record.title = text(response.body.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '');
        record.h1 = text(response.body.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || '');
        record.canonical = meta(response.body, 'rel', 'canonical', 'href');
        record.ogUrl = meta(response.body, 'property', 'og:url', 'content');
        record.robots = meta(response.body, 'name', 'robots', 'content');
        break;
      }
    } catch (error) { record.error = error.message; }
    const sourcePath = new URL(source).pathname;
    record.equivalence = record.finalStatus !== 200 ? 'FAIL: destination not 200' :
      new URL(record.finalUrl).pathname === sourcePath && record.canonical === record.finalUrl ? 'equivalent: same route and self-canonical' : 'REVIEW: changed route; semantic assessment required';
    records[index] = record;
  }
}));
await writeFile('docs/legacy-redirect-live-audit.json', JSON.stringify({ auditedAt: new Date().toISOString(), suppliedUrlCount: paths.length, records }, null, 2) + '\n');
for (const [url, response] of finalPages) {
  if (response.status === 200) await writeFile(`tmp/migration-live/${encodeURIComponent(new URL(url).pathname)}.html`, response.body);
}
const columns = ['source', 'initial_status', 'hops', 'final_url', 'final_status', 'equivalent', 'assessment', 'planned_target', 'planned_action', 'title', 'canonical', 'og_url', 'robots', 'checked_at', 'chain'];
const rows = records.map(record => {
  const decision = decisions.get(new URL(record.source).pathname);
  const legacyEndpoint = new URL(record.source).pathname === '/legacy-sitemap.xml';
  const plannedTarget = legacyEndpoint ? record.source : decision?.plannedTarget || record.finalUrl;
  const fixedEquivalent = decision?.plannedAction === 'fix missing equivalent mapping' && record.finalUrl === plannedTarget;
  const equivalent = record.finalStatus === 200 && record.finalUrl === plannedTarget && (decision?.equivalent || fixedEquivalent);
  return [record.source, record.chain[0]?.status, record.hops, record.finalUrl, record.finalStatus,
    equivalent ? 'yes' : 'no', decision?.assessment || 'Supplementary host/endpoint check; unchanged production observation', plannedTarget,
    legacyEndpoint ? 'implement old-host-only sitemap' : decision?.plannedAction || 'see implementation report', record.title, record.canonical, record.ogUrl, record.robots, record.checkedAt, JSON.stringify(record.chain)];
});
await writeFile('redirect-audit.csv', [columns, ...rows].map(row => row.map(quote).join(',')).join('\n') + '\n');
console.log(JSON.stringify({ supplied: paths.length, audited: records.length, final200: records.filter(x => x.finalStatus === 200).length,
  chains: records.filter(x => x.hops > 1).map(x => x.source), failures: records.filter(x => x.finalStatus !== 200).map(x => ({ source: x.source, final: x.finalUrl, status: x.finalStatus, error: x.error })) }, null, 2));
