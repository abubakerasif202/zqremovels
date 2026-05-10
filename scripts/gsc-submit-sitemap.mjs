import { readFile } from 'node:fs/promises';
import { google } from 'googleapis';

const root = process.cwd();
const tokenPath = `${root}/.gsc-token.json`;
const defaultSite = 'sc-domain:zqremovals.au';
const fallbackSite = 'https://zqremovals.au/';
const sitemapUrl = process.env.GSC_SITEMAP_URL || 'https://zqremovals.au/sitemap.xml';
const site = process.env.GSC_SITE || defaultSite;

if (process.env.GSC_WRITE_SCOPE !== '1') {
  throw new Error('Write scope is not configured. Set GSC_WRITE_SCOPE=1 before submitting a sitemap.');
}

const tokens = JSON.parse(await readFile(tokenPath, 'utf8'));
const client = JSON.parse(await readFile(`${root}/secrets/gsc-oauth-client.json`, 'utf8'));
const config = client.installed || client.web || client;
const oauth2Client = new google.auth.OAuth2(config.client_id, config.client_secret, config.redirect_uris?.[0] || 'http://127.0.0.1:8085/oauth2callback');
oauth2Client.setCredentials(tokens);

const webmasters = google.webmasters({ version: 'v3', auth: oauth2Client });
const property = site || fallbackSite;

await webmasters.sitemaps.submit({
  siteUrl: property,
  feedpath: sitemapUrl,
});

console.log(`Submitted sitemap ${sitemapUrl} for ${property}`);
