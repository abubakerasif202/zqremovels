import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { google } from 'googleapis';

const root = process.cwd();
const secretsDir = path.join(root, 'secrets');
const clientPath = path.join(secretsDir, 'gsc-oauth-client.json');
const tokenPath = path.join(root, '.gsc-token.json');
const defaultScopes = ['https://www.googleapis.com/auth/webmasters.readonly'];
const writeScope = 'https://www.googleapis.com/auth/webmasters';
const scopes = resolveScopes(process.argv.slice(2));

const client = JSON.parse(await readFile(clientPath, 'utf8'));
const config = client.installed || client.web || client;
const redirectUri = 'http://127.0.0.1:8085/oauth2callback';
const oauth2Client = new google.auth.OAuth2(config.client_id, config.client_secret, redirectUri);

const state = crypto.randomBytes(16).toString('hex');
const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: scopes,
  state,
});

console.log('Opening this authorization URL:');
console.log(authUrl);
console.log('');
console.log('Waiting for the OAuth callback on http://127.0.0.1:8085 ...');

const code = await new Promise((resolve, reject) => {
  const server = createServer((req, res) => {
    const url = new URL(req.url || '/', 'http://127.0.0.1:8085');

    if (url.pathname !== '/oauth2callback') {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }

    if (url.searchParams.get('state') !== state) {
      res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Invalid OAuth state');
      cleanup(server, reject, new Error('OAuth state mismatch'));
      return;
    }

    const authCode = url.searchParams.get('code');
    const error = url.searchParams.get('error');

    if (error) {
      res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(`OAuth error: ${error}`);
      cleanup(server, reject, new Error(`OAuth error: ${error}`));
      return;
    }

    if (!authCode) {
      res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Missing authorization code');
      cleanup(server, reject, new Error('Missing authorization code'));
      return;
    }

    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Authorization received. You can close this window.');
    cleanup(server, resolve, authCode);
  });

  server.listen(8085, '127.0.0.1', () => {
    openAuthUrl(authUrl).catch((error) => {
      console.warn(`Unable to open browser automatically: ${error.message}`);
    });
  });

  server.on('error', reject);
});

const { tokens } = await oauth2Client.getToken(code);
await mkdir(path.dirname(tokenPath), { recursive: true });
await writeFile(tokenPath, JSON.stringify(tokens, null, 2) + '\n', 'utf8');

console.log(`Saved OAuth token to ${tokenPath}`);
console.log(`Configured scopes: ${scopes.join(', ')}`);
if (!tokens.refresh_token) {
  console.warn('No refresh token was returned. Re-run with prompt=consent if you need long-lived access.');
}

function resolveScopes(argv) {
  const wantsWrite = argv.includes('--write-scope') || process.env.GSC_WRITE_SCOPE === '1';
  return wantsWrite ? [writeScope] : defaultScopes;
}

function cleanup(server, settle, value) {
  server.close(() => settle(value));
}

async function openAuthUrl(url) {
  const { spawn } = await import('node:child_process');
  const platform = process.platform;
  if (platform === 'win32') {
    spawn('cmd', ['/c', 'start', '', url], { stdio: 'ignore', detached: true });
    return;
  }
  if (platform === 'darwin') {
    spawn('open', [url], { stdio: 'ignore', detached: true });
    return;
  }
  spawn('xdg-open', [url], { stdio: 'ignore', detached: true });
}
