import { createServer } from 'node:http';
import { readFile, writeFile, mkdir, chmod } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';
import crypto from 'node:crypto';
import { google } from 'googleapis';

const root = process.cwd();
// Absolute, out-of-repo credentials location; override with GSC_OAUTH_CLIENT_PATH.
const clientPath = process.env.GSC_OAUTH_CLIENT_PATH || 'C:\\Users\\abuba\\gsc-private\\credentials.json';
const tokenPath = path.join(root, '.gsc-token.json');
const defaultScopes = ['https://www.googleapis.com/auth/webmasters.readonly'];
const writeScope = 'https://www.googleapis.com/auth/webmasters';
const scopes = resolveScopes(process.argv.slice(2));
const AUTH_TIMEOUT_MS = 5 * 60 * 1000;

const client = JSON.parse(await readFile(clientPath, 'utf8'));
const clientType = client.installed ? 'installed' : client.web ? 'web' : null;
if (!clientType) {
  throw new Error('Unsupported OAuth client file: expected an "installed" (Desktop) or "web" client.');
}
const config = client[clientType];
console.log(`OAuth client type: ${clientType} (project ${config.project_id || 'unknown'})`);

if (clientType === 'web') {
  throw new Error(
    'This is a Web OAuth client. Its redirect URIs must be pre-registered; create a Desktop client or register a loopback URI.'
  );
}

// Desktop clients accept any loopback port. Listen first so the callback is live before Google opens.
const state = crypto.randomBytes(16).toString('hex');
const codeVerifier = crypto.randomBytes(48).toString('base64url');
const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');

const { server, port, codePromise } = await startLoopbackListener(state);
const redirectUri = `http://127.0.0.1:${port}/oauth2callback`;
const oauth2Client = new google.auth.OAuth2(config.client_id, config.client_secret, redirectUri);

const authUrl = oauth2Client.generateAuthUrl({
  response_type: 'code',
  access_type: 'offline',
  prompt: 'consent',
  scope: scopes,
  state,
  code_challenge: codeChallenge,
  code_challenge_method: 'S256',
});

assertAuthUrl(authUrl, { clientId: config.client_id, redirectUri, scopes });

if (process.env.GSC_AUTH_PRINT_ONLY === '1' || process.argv.includes('--print-url-only')) {
  console.log(authUrl);
  server.close();
  process.exit(0);
}

console.log(`Listening on ${redirectUri}`);
console.log('Opening Google authentication in Chrome for approval...');
await openInChrome(authUrl);
console.log('If the browser did not open, visit:');
console.log(authUrl);

const timer = setTimeout(() => {
  console.error('Timed out waiting for authorization.');
  server.close();
  process.exit(1);
}, AUTH_TIMEOUT_MS);

const code = await codePromise;
clearTimeout(timer);

const { tokens } = await oauth2Client.getToken({ code, codeVerifier, redirect_uri: redirectUri });
await mkdir(path.dirname(tokenPath), { recursive: true });
await writeFile(tokenPath, JSON.stringify(tokens, null, 2) + '\n', { encoding: 'utf8', mode: 0o600 });
await chmod(tokenPath, 0o600).catch(() => {});

console.log(`Saved OAuth token to ${tokenPath} (gitignored)`);
console.log(`Configured scopes: ${scopes.join(', ')}`);
if (!tokens.refresh_token) {
  console.warn('No refresh token was returned. Re-run with prompt=consent if you need long-lived access.');
}

function resolveScopes(argv) {
  const wantsWrite = argv.includes('--write-scope') || process.env.GSC_WRITE_SCOPE === '1';
  return wantsWrite ? [writeScope] : defaultScopes;
}

function assertAuthUrl(url, { clientId, redirectUri: expectedRedirectUri, scopes: expectedScopes }) {
  const parsed = new URL(url);
  const required = [
    ['client_id', parsed.searchParams.get('client_id') === clientId],
    ['redirect_uri', parsed.searchParams.get('redirect_uri') === expectedRedirectUri],
    ['scope', expectedScopes.every((scope) => parsed.searchParams.get('scope')?.includes(scope))],
    ['response_type=code', parsed.searchParams.get('response_type') === 'code'],
    ['code_challenge', Boolean(parsed.searchParams.get('code_challenge'))],
  ];

  const missing = required.filter(([, ok]) => !ok).map(([key]) => key);
  if (missing.length > 0) {
    throw new Error(`Generated OAuth URL is missing required parameters: ${missing.join(', ')}`);
  }
}

function startLoopbackListener(expectedState) {
  return new Promise((resolveStart, rejectStart) => {
    let settle;
    let fail;
    const codePromise = new Promise((resolve, reject) => {
      settle = resolve;
      fail = reject;
    });
    // Avoid unhandled-rejection crashes if the failure lands before anyone awaits.
    codePromise.catch(() => {});

    const server = createServer((req, res) => {
      const url = new URL(req.url || '/', 'http://127.0.0.1');
      if (url.pathname !== '/oauth2callback') {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Not found');
        return;
      }

      const reply = (status, message) => {
        res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end(message);
      };
      const received = Buffer.from(url.searchParams.get('state') || '');
      const expected = Buffer.from(expectedState);
      if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) {
        reply(400, 'Invalid OAuth state');
        return; // Ignore stray requests; keep waiting for the real callback.
      }
      const error = url.searchParams.get('error');
      if (error) {
        reply(400, `OAuth error: ${error}`);
        server.close(() => fail(new Error(`OAuth error: ${error}`)));
        return;
      }
      const authCode = url.searchParams.get('code');
      if (!authCode) {
        reply(400, 'Missing authorization code');
        return;
      }
      reply(200, 'Authorization received. You can close this window and return to the terminal.');
      server.close(() => settle(authCode));
    });

    server.on('error', rejectStart);
    server.listen(0, '127.0.0.1', () => {
      resolveStart({ server, port: server.address().port, codePromise });
    });
  });
}

async function openInChrome(url) {
  const candidates = [];
  if (process.platform === 'win32') {
    for (const base of [process.env.PROGRAMFILES, process.env['PROGRAMFILES(X86)'], process.env.LOCALAPPDATA]) {
      if (base) candidates.push(path.join(base, 'Google', 'Chrome', 'Application', 'chrome.exe'));
    }
  } else if (process.platform === 'darwin') {
    candidates.push('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome');
  } else {
    candidates.push('google-chrome', 'chromium');
  }

  const chrome = candidates.find((candidate) => path.isAbsolute(candidate) ? existsSync(candidate) : true);
  const [command, args] = chrome
    ? [chrome, [url]]
    : process.platform === 'win32'
      ? ['rundll32', ['url.dll,FileProtocolHandler', url]]
      : ['xdg-open', [url]];

  // No shell: the URL contains "&", which cmd.exe would otherwise treat as a command separator.
  const child = spawn(command, args, { stdio: 'ignore', detached: true });
  child.on('error', (error) => console.warn(`Unable to open browser automatically: ${error.message}`));
  child.unref();
}
