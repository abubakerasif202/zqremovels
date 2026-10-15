const { readFileSync } = require('node:fs');
const path = require('node:path');

const legacyPaths = readFileSync(path.join(__dirname, '../data/migration/legacy-paths.txt'), 'utf8')
  .trim().split(/\r?\n/);
const escapeXml = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${legacyPaths.map(value => `  <url><loc>${escapeXml(`https://zqremovals.au${value}`)}</loc></url>`).join('\n')}\n</urlset>\n`;

module.exports = function legacySitemap(req, res) {
  const host = (req.headers.host || '').toLowerCase().split(':')[0];
  res.setHeader('X-Robots-Tag', 'noindex');
  if (!['zqremovals.au', 'www.zqremovals.au'].includes(host)) {
    res.statusCode = 404;
    return res.end('Not found');
  }
  if (!['GET', 'HEAD'].includes(req.method)) {
    res.statusCode = 405;
    res.setHeader('Allow', 'GET, HEAD');
    return res.end('Method not allowed');
  }
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=3600');
  return res.end(req.method === 'HEAD' ? '' : sitemap);
};
