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
const redirectUri = resolveRedirectUri(config.redirect_uris);
const oauth2Client = new google.auth.OAuth2(config.client_id, config.client_secret, redirectUri);

const state = crypto.randomBytes(16).toString('hex');
const authUrl = oauth2Client.generateAuthUrl({
  response_type: 'code',
  access_type: 'offline',
  prompt: 'consent',
  include_granted_scopes: true,
  scope: scopes,
  state,
});

assertAuthUrl(authUrl, {
  clientId: config.client_id,
  redirectUri,
  scopes,
});

console.log('Opening this authorization URL:');
console.log(authUrl);
console.log('');
if (process.env.GSC_AUTH_PRINT_ONLY === '1' || process.argv.includes('--print-url-only')) {
  process.exit(0);
}
const code = await getAuthorizationCode(redirectUri, state, authUrl);

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

function resolveRedirectUri(redirectUris = []) {
  const preferred = redirectUris.find((uri) => /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/.*)?$/i.test(uri));
  if (preferred) {
    return normalizeRedirectUri(preferred);
  }
  const fallback = redirectUris[0];
  if (fallback) {
    return normalizeRedirectUri(fallback);
  }
  return 'http://localhost:8085/oauth2callback';
}

function normalizeRedirectUri(uri) {
  const parsed = new URL(uri);
  return `${parsed.protocol}//${parsed.host}${parsed.pathname === '/' ? '' : parsed.pathname.replace(/\/$/, '')}`;
}

function assertAuthUrl(url, { clientId, redirectUri: expectedRedirectUri, scopes: expectedScopes }) {
  const parsed = new URL(url);
  const required = [
    ['client_id', parsed.searchParams.get('client_id') === clientId],
    ['redirect_uri', parsed.searchParams.get('redirect_uri') === expectedRedirectUri],
    ['scope', expectedScopes.every((scope) => parsed.searchParams.get('scope')?.includes(scope))],
    ['response_type=code', parsed.searchParams.get('response_type') === 'code'],
  ];

  const missing = required.filter(([, ok]) => !ok).map(([key]) => key);
  if (missing.length > 0) {
    throw new Error(`Generated OAuth URL is missing required parameters: ${missing.join(', ')}`);
  }
}

async function getAuthorizationCode(redirectUriValue, stateValue, authUrlValue) {
  const parsed = new URL(redirectUriValue);
  if (parsed.port && parsed.port !== '80' && parsed.port !== '443') {
    return new Promise((resolve, reject) => {
      const server = createServer((req, res) => {
        const url = new URL(req.url || '/', `${parsed.protocol}//${parsed.host}`);

        if (url.searchParams.get('state') !== stateValue) {
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

      server.listen(Number(parsed.port), parsed.hostname || '127.0.0.1', () => {
        openAuthUrl(authUrlValue).catch((error) => {
          console.warn(`Unable to open browser automatically: ${error.message}`);
        });
      });

      server.on('error', reject);
    });
  }

  console.log('No callback port is available for automatic capture.');
  console.log('After approving access in the browser, paste the `code` parameter from the redirected URL here.');
  return await promptForCode();
}

function promptForCode() {
  return new Promise((resolve) => {
    process.stdout.write('Authorization code: ');
    process.stdin.setEncoding('utf8');
    process.stdin.once('data', (data) => {
      resolve(String(data).trim());
    });
  });
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
