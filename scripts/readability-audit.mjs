import { chromium } from '@playwright/test';
import { createRequire } from 'node:module';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

// Run after building and starting scripts/serve-site.mjs. External services are
// blocked so this local audit cannot send leads, analytics or conversion events.
const require = createRequire(import.meta.url);
const origin = process.env.AUDIT_BASE_URL || 'http://127.0.0.1:3000';
const dist = process.env.AUDIT_DIST_DIR || 'site-dist';
const output = process.env.AUDIT_OUTPUT || 'tmp/readability/final';
const fastSolid = process.env.AUDIT_FAST_SOLID === '1';
const routeFilter = process.env.AUDIT_ROUTES ? new Set(process.env.AUDIT_ROUTES.split(',')) : null;
const widths = [320, 390, 768, 1024, 1440, 1920];
const workers = Math.max(1, Math.min(3, Number(process.env.AUDIT_WORKERS) || 3));
const screenshotRoutes = new Set([
  '/', '/about/', '/404.html', '/contact-us/', '/house-removals-adelaide/',
  '/office-removals-adelaide/', '/packing-services-adelaide/',
  '/furniture-removalists-adelaide/', '/interstate-removals-adelaide/',
  '/removalists-glenelg/', '/removalists-adelaide/', '/adelaide-moving-guides/',
  '/adelaide-moving-guides/office-relocation-checklist-adelaide/',
  '/adelaide-removalists-facebook-offer/', '/thank-you/', '/privacy-policy/',
]);

async function htmlFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await htmlFiles(file));
    else if (entry.name.endsWith('.html')) files.push(file);
  }
  return files;
}

await mkdir(output, { recursive: true });
const routes = [];
const redirects = [];
const templates = new Set();
for (const file of await htmlFiles(dist)) {
  const html = await readFile(file, 'utf8');
  const route = `/${path.relative(dist, file).replaceAll('\\', '/').replace(/index\.html$/, '')}`;
  if (/<meta\b[^>]*http-equiv=["']refresh["']/i.test(html)) {
    redirects.push({ route, destination: html.match(/url=([^"'>]+)/i)?.[1] });
    continue;
  }
  if (routeFilter && !routeFilter.has(route)) continue;
  const template = html.match(/<body[^>]*class="([^"]*)/)?.[1] || 'bare';
  if (!templates.has(template) || route.startsWith('/premium-moving-concepts/')) screenshotRoutes.add(route);
  templates.add(template);
  routes.push({ route, template, file });
}
const browser = await chromium.launch({
  headless: true,
  ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}),
});
const axe = fastSolid ? null : await readFile(require.resolve('axe-core/axe.min.js'), 'utf8');
const results = [];
let next = 0;
try {
  await Promise.all(Array.from({ length: workers }, async () => {
    const page = await browser.newPage({ reducedMotion: 'reduce' });
    await page.route('**/*', route => route.request().url().startsWith(origin)
      ? route.continue() : route.abort());
    if (!fastSolid) await page.addInitScript({ content: axe });
    let errors = [];
    page.on('console', message => {
      if (message.type() === 'error' && message.location().url?.startsWith(origin)) errors.push(message.text());
    });
    page.on('pageerror', error => errors.push(error.message));
    for (;;) {
      const index = next++;
      if (index >= routes.length) break;
      const item = routes[index];
      errors = [];
      const viewports = [];
      const accessibility = [];
      const responses = [];
      for (const width of widths) {
        await page.setViewportSize({ width, height: 900 });
        if (!fastSolid || width === widths[0]) {
          const response = await page.goto(`${origin}${item.route}`, { waitUntil: fastSolid ? 'load' : 'networkidle' });
          if (!response?.ok()) throw new Error(`${item.route}: HTTP ${response?.status()}`);
          responses.push(response.status());
        } else {
          // The quick pass checks live responsive reflow without six reloads.
          await page.evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)));
        }
        await page.evaluate(async fast => {
          document.querySelectorAll('.reveal-on-scroll').forEach(e => e.classList.add('is-visible'));
          if (!fast) document.querySelectorAll('img[loading="lazy"]').forEach(e => { e.loading = 'eager'; });
          await document.fonts.ready;
        }, fastSolid);
        viewports.push(await page.evaluate(() => {
          // Axe can mark image-backed sections incomplete, including an opaque
          // button whose foreground and background accidentally match.
          const luminance = rgb => rgb.slice(0, 3).map(v => {
            const n = v / 255;
            return n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
          }).reduce((n, v, i) => n + v * [0.2126, 0.7152, 0.0722][i], 0);
          const solidButtonContrast = [];
          for (const element of document.querySelectorAll('.button, .btn, .zq-v2-button')) {
            const style = getComputedStyle(element);
            if (!element.getBoundingClientRect().width || style.visibility === 'hidden') continue;
            if (!/^rgba?\(/.test(style.color) || !/^rgba?\(/.test(style.backgroundColor)) continue;
            const fg = style.color.match(/[\d.]+/g)?.map(Number);
            const bg = style.backgroundColor.match(/[\d.]+/g)?.map(Number);
            if (!fg || !bg || (fg[3] ?? 1) < 1 || (bg[3] ?? 1) < 1 || style.backgroundImage !== 'none') continue;
            const values = [luminance(fg), luminance(bg)].sort((a, b) => a - b);
            const ratio = (values[1] + 0.05) / (values[0] + 0.05);
            const large = parseFloat(style.fontSize) >= 24 || (parseFloat(style.fontSize) >= 18.66 && parseFloat(style.fontWeight) >= 700);
            const minimum = large ? 3 : 4.5;
            if (ratio < minimum) solidButtonContrast.push({ text: element.textContent.trim(), class: element.className, foreground: style.color, background: style.backgroundColor, ratio, minimum });
          }
          return {
            width: innerWidth,
            solidButtonContrast,
            scrollWidth: document.documentElement.scrollWidth,
            overflow: [...document.querySelectorAll('body *')].filter(e => {
            const rect = e.getBoundingClientRect();
            const style = getComputedStyle(e);
            return rect.width && style.position !== 'fixed' && style.visibility !== 'hidden'
              && (rect.right > innerWidth + 1 || rect.left < -1);
          }).slice(0, 15).map(e => ({ tag: e.tagName, class: e.className, text: e.textContent.trim().slice(0, 80), important: e.matches('summary.mobile-menu-trigger,.button,.btn,.zq-v2-button,input,select,textarea') })),
          };
        }));
        if (!fastSolid && (width === 390 || width === 1440)) {
          accessibility.push({ width, ...await page.evaluate(async () => {
            const result = await window.axe.run(document, {
              runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] },
            });
            return {
              violations: result.violations.map(v => ({
                id: v.id, impact: v.impact,
                nodes: v.nodes.map(n => ({ target: n.target, html: n.html, summary: n.failureSummary })),
              })),
              manualContrast: result.incomplete.filter(v => v.id === 'color-contrast')
                .flatMap(v => v.nodes.map(n => ({ target: n.target, html: n.html }))),
            };
          }) });
          if (screenshotRoutes.has(item.route)) {
            await page.screenshot({
              path: path.join(output, `${item.route.replaceAll('/', '_') || 'home'}-${width}.png`),
              fullPage: true, animations: 'disabled',
            });
          }
        }
      }
      results.push({ ...item, viewports, accessibility, errors: [...new Set(errors)], responses });
      const axeFindings = accessibility.reduce((n, a) => n + a.violations.reduce((n, v) => n + v.nodes.length, 0), 0);
      const solidFindings = viewports.reduce((n, v) => n + v.solidButtonContrast.length, 0);
      console.log(`${index + 1}/${routes.length} ${item.route}: ${fastSolid ? 'axe skipped; ' : `${axeFindings} axe findings; `}${solidFindings} solid button contrast failures`);
    }
    await page.close();
  }));
} finally {
  await browser.close();
  results.sort((a, b) => a.route.localeCompare(b.route));
  // Persist partial results on failure as well as complete successful runs.
  await writeFile(path.join(output, 'results.json'), JSON.stringify({ mode: fastSolid ? 'solid-buttons' : 'full', widths, templates: [...templates], redirects, results }, null, 2));
}
const violations = results.flatMap(p => p.accessibility.flatMap(a => a.violations));
const solidFailures = results.flatMap(p => p.viewports.flatMap(v => v.solidButtonContrast));
const clippedControls = results.filter(p => p.viewports.some(v => v.overflow.some(e => e.important)));
const overflow = results.filter(p => p.viewports.some(v => v.scrollWidth > v.width));
console.log(`${results.length} pages, ${redirects.length} redirects, ${fastSolid ? "axe skipped" : `${violations.length} axe rule failures`}, ${overflow.length} overflowing pages, ${solidFailures.length} solid button contrast failures, ${clippedControls.length} pages with clipped controls.`);
if (violations.length || overflow.length || solidFailures.length || clippedControls.length || results.some(p => p.errors.length)) process.exitCode = 1;
