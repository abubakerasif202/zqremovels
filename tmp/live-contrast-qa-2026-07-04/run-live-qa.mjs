import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const base = 'https://zqremovals.au';
const out = 'tmp/live-contrast-qa-2026-07-04';
const paths = [
  '/', '/removalists-marion/', '/removalists-hyde-park/', '/removalists-malvern/',
  '/removalists-unley/', '/removalists-unley-park/', '/removalists-medindie/',
  '/adelaide-to-brisbane-removals/', '/adelaide-to-sydney-removalists/',
  '/adelaide-to-melbourne-removalists/', '/contact/'
];
const screenshotPaths = new Set([
  '/', '/removalists-marion/', '/removalists-hyde-park/', '/removalists-malvern/',
  '/adelaide-to-brisbane-removals/', '/contact/'
]);
const viewports = { desktop: { width: 1440, height: 1000 }, mobile: { width: 390, height: 844 } };

await mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
const results = [];

for (const [viewportName, viewport] of Object.entries(viewports)) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  for (const path of paths) {
    const page = await context.newPage();
    const errors = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    page.on('pageerror', error => errors.push(error.message));
    const response = await page.goto(`${base}${path}`, { waitUntil: 'networkidle' });
    if (viewportName === 'mobile') {
      const menu = page.locator('.mobile-menu-trigger').first();
      if (await menu.isVisible().catch(() => false)) await menu.click();
    }
    const checks = await page.evaluate(() => {
      const visible = el => {
        const r = el.getBoundingClientRect();
        const s = getComputedStyle(el);
        return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && Number(s.opacity) > 0;
      };
      const info = selector => [...document.querySelectorAll(selector)].filter(visible).slice(0, 8).map(el => ({
        text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 160),
        color: getComputedStyle(el).color,
        background: getComputedStyle(el).backgroundColor
      }));
      return {
        h1: info('main h1'),
        heroBody: info('.hero-shell p, .home-redesign-hero p'),
        breadcrumbs: info('.breadcrumb, .breadcrumb a'),
        heroPoints: info('.hero-points li, .trust-chips li, .route-meta li, .home-redesign-badges li'),
        helperText: info('.form-helper, .helper-text, .quote-form-premium small, .quote-form-premium .microcopy'),
        secondaryButtons: info('.button-secondary'),
        links: info('main a:not(.button)'),
        faq: info('details summary, details p, .faq-item p'),
        footerLinks: info('footer a'),
        mobileMenu: info('.mobile-nav-panel a, .mobile-nav-panel summary')
      };
    });
    const slug = path === '/' ? 'home' : path.replace(/^\//, '').replace(/\/$/, '');
    let screenshot = null;
    if (screenshotPaths.has(path)) {
      screenshot = `${out}/${slug}-${viewportName}.png`;
      await page.screenshot({ path: screenshot, fullPage: true });
    }
    results.push({ path, viewport: viewportName, status: response?.status(), url: page.url(), title: await page.title(), checks, errors, screenshot });
    await page.close();
  }
  await context.close();
}

await browser.close();
await writeFile(`${out}/live-qa-results.json`, JSON.stringify(results, null, 2));
console.log(JSON.stringify(results.map(({ path, viewport, status, url, errors, screenshot, checks }) => ({
  path, viewport, status, url, errors: errors.length, screenshot,
  present: Object.fromEntries(Object.entries(checks).map(([key, value]) => [key, value.length]))
})), null, 2));
