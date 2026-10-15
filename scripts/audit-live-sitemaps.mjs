import { writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const run = promisify(execFile);
const origin = 'https://zqremovalsadelaide.com.au';
async function get(url) {
  const { stdout } = await run(process.platform === 'win32' ? 'curl.exe' : 'curl', [
    '-sS', '--max-time', '25', '--retry', '1', '--max-filesize', '5242880',
    '--write-out', '\nZQ_AUDIT_STATUS:%{http_code}\nZQ_AUDIT_REDIRECT:%{redirect_url}', url,
  ], { maxBuffer: 6 * 1024 * 1024 });
  const marker = stdout.lastIndexOf('\nZQ_AUDIT_STATUS:');
  const [status, location] = stdout.slice(marker).trim().split('\n');
  return { url, status: Number(status.split(':')[1]), location: location.slice('ZQ_AUDIT_REDIRECT:'.length), body: stdout.slice(0, marker) };
}
const old = await get('https://zqremovals.au/sitemap.xml');
const current = await get(`${origin}/sitemap.xml`);
const locations = body => [...body.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/g)].map(match => match[1]);
const children = await Promise.all(locations(current.body).map(async url => {
  const result = await get(url);
  return { url, status: result.status, pageLocations: locations(result.body), oldHostReferences: /https?:\/\/(?:www\.)?zqremovals\.au\//.test(result.body) };
}));
const pageUrls = [...new Set(children.flatMap(child => child.pageLocations))];
const pages = new Array(pageUrls.length);
let cursor = 0;
await Promise.all(Array.from({ length: 5 }, async () => {
  while (cursor < pageUrls.length) {
    const index = cursor++;
    const response = await get(pageUrls[index]);
    const canonical = response.body.match(/<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"/i)?.[1];
    const ogUrl = response.body.match(/<meta\b[^>]*property="og:url"[^>]*content="([^"]+)"/i)?.[1];
    const noindex = /<meta[^>]+name="robots"[^>]+content="[^"]*noindex/i.test(response.body);
    pages[index] = { url: response.url, status: response.status, canonical, ogUrl, noindex,
      oldHostReferences: /https?:\/\/(?:www\.)?zqremovals\.au(?:\/|["'])/.test(response.body) };
  }
}));
const report = { checkedAt: new Date().toISOString(), oldSitemap: { status: old.status, location: old.location },
  newSitemap: { status: current.status, children: children.map(child => ({ ...child, pageLocations: child.pageLocations.length })) },
  uniquePageUrls: pageUrls.length, pages,
  failures: pages.filter(page => page.status !== 200 || page.canonical !== page.url || page.ogUrl !== page.url || page.noindex || page.oldHostReferences) };
await writeFile('docs/live-sitemap-hygiene-audit.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ oldSitemap: report.oldSitemap, childSitemaps: children.length, uniquePageUrls: pageUrls.length, failures: report.failures.length }));
