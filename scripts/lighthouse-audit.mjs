import { spawn, spawnSync } from 'node:child_process';
import { mkdir, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(fileURLToPath(new URL('../', import.meta.url)));
const require = createRequire(import.meta.url);
const config = require(path.join(projectRoot, '.lighthouserc.cjs'));
const port = Number(process.env.LIGHTHOUSE_PORT || 4173);
const baseUrl = `http://127.0.0.1:${port}`;
const reportDir = path.join(projectRoot, 'tmp', 'lighthouse-reports');
const routes = config?.ci?.collect?.url || ['/'];
const assertions = config?.ci?.assert?.assertions || {};
const lighthouseCli = path.join(projectRoot, 'node_modules', 'lighthouse', 'cli', 'index.js');

function slugFor(route) {
  const slug = route.replace(/^\/+|\/+$/g, '').replace(/\//g, '-');
  return slug || 'home';
}

function getRule(name) {
  const rule = assertions[name];
  if (!Array.isArray(rule) || rule.length < 2) return null;
  return { level: rule[0], options: rule[1] || {} };
}

function reportThreshold(name, actual, comparator, expected, level) {
  const passes = comparator === 'min' ? actual >= expected : actual <= expected;
  if (passes) return false;
  const message = `${name}: ${actual} failed ${comparator} threshold ${expected}`;
  if (level === 'error') {
    console.error(message);
    return true;
  }
  console.warn(message);
  return false;
}

async function waitForServer() {
  let lastError;
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/`, { redirect: 'manual' });
      if (response.ok) return;
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Static server did not become ready: ${lastError?.message || 'unknown error'}`);
}

function evaluateReport(file, lhr) {
  let failed = false;
  const categoryMap = {
    'categories:performance': lhr.categories?.performance?.score,
    'categories:accessibility': lhr.categories?.accessibility?.score,
    'categories:seo': lhr.categories?.seo?.score,
  };

  for (const [name, actual] of Object.entries(categoryMap)) {
    const rule = getRule(name);
    if (!rule || typeof actual !== 'number' || typeof rule.options.minScore !== 'number') continue;
    failed = reportThreshold(name, actual, 'min', rule.options.minScore, rule.level) || failed;
  }

  const auditMap = {
    'cumulative-layout-shift': lhr.audits?.['cumulative-layout-shift']?.numericValue,
    'largest-contentful-paint': lhr.audits?.['largest-contentful-paint']?.numericValue,
    'server-response-time': lhr.audits?.['server-response-time']?.numericValue,
    'total-blocking-time': lhr.audits?.['total-blocking-time']?.numericValue,
  };

  for (const [name, actual] of Object.entries(auditMap)) {
    const rule = getRule(name);
    if (!rule || typeof actual !== 'number' || typeof rule.options.maxNumericValue !== 'number') continue;
    failed = reportThreshold(name, actual, 'max', rule.options.maxNumericValue, rule.level) || failed;
  }

  console.log(`${file}: performance=${lhr.categories?.performance?.score} accessibility=${lhr.categories?.accessibility?.score} seo=${lhr.categories?.seo?.score}`);
  return failed;
}

await rm(reportDir, { recursive: true, force: true });
await mkdir(reportDir, { recursive: true });

const server = spawn(process.execPath, ['scripts/serve-site.mjs'], {
  cwd: projectRoot,
  env: { ...process.env, PORT: String(port) },
  stdio: ['ignore', 'pipe', 'pipe'],
});

let serverError = '';
server.stderr.on('data', (chunk) => {
  serverError += chunk.toString();
});

let failed = false;
try {
  await waitForServer();

  for (const route of routes) {
    const reportPath = path.join(reportDir, `${slugFor(route)}.json`);
    const result = spawnSync(
      process.execPath,
      [
        lighthouseCli,
        `${baseUrl}${route}`,
        '--chrome-flags=--headless --no-sandbox',
        '--only-categories=performance,accessibility,seo',
        '--output=json',
        `--output-path=${reportPath}`,
        '--quiet',
      ],
      { cwd: projectRoot, stdio: 'inherit', env: process.env },
    );

    if (result.status !== 0) {
      throw new Error(`Lighthouse failed for ${route} with exit code ${result.status}`);
    }

    const lhr = JSON.parse(await readFile(reportPath, 'utf8'));
    failed = evaluateReport(path.basename(reportPath), lhr) || failed;
  }
} finally {
  server.kill();
}

if (serverError.trim()) {
  console.error(serverError.trim());
}

if (failed) {
  process.exitCode = 1;
}
