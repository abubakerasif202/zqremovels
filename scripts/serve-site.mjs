import { createReadStream } from 'node:fs';
import { access, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../site-dist/', import.meta.url)));
const port = Number(process.env.PORT || 3000);
const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml; charset=utf-8',
};

function safePath(requestUrl) {
  const pathname = decodeURIComponent(new URL(requestUrl, 'http://127.0.0.1').pathname);
  const candidate = resolve(root, `.${pathname}`);
  return relative(root, candidate).startsWith('..') ? null : candidate;
}

async function resolveFile(requestUrl) {
  const candidate = safePath(requestUrl);
  if (!candidate) return null;

  const candidateStats = await stat(candidate).catch(() => null);
  if (candidateStats?.isFile()) return candidate;
  if (candidateStats?.isDirectory()) {
    const indexFile = join(candidate, 'index.html');
    if ((await stat(indexFile).catch(() => null))?.isFile()) return indexFile;
  }

  const extensionlessFile = `${normalize(candidate)}.html`;
  if ((await stat(extensionlessFile).catch(() => null))?.isFile()) return extensionlessFile;
  return null;
}

const server = createServer(async (request, response) => {
  try {
    const file = await resolveFile(request.url || '/');
    if (!file) {
      response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      response.end('Not found');
      return;
    }

    const fileType = contentTypes[extname(file).toLowerCase()] || 'application/octet-stream';
    response.writeHead(200, { 'cache-control': 'no-store', 'content-type': fileType });
    createReadStream(file).pipe(response);
  } catch {
    response.writeHead(400, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('Bad request');
  }
});

await access(root);
server.listen(port, '127.0.0.1', () => {
  process.stdout.write(`Serving ${root} at http://127.0.0.1:${port}/\n`);
});
