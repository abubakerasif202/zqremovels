import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const base = 'http://127.0.0.1:4173';
const out = 'tmp/full-site-contrast-qa-2026-07-04';
const routes = [
  '/', '/removalists-adelaide/', '/removalists-marion/', '/removalists-hyde-park/',
  '/removalists-malvern/', '/removalists-unley/', '/removalists-unley-park/',
  '/removalists-medindie/', '/removalists-elizabeth/', '/adelaide-to-sydney-removalists/',
  '/adelaide-to-brisbane-removals/', '/adelaide-to-melbourne-removalists/',
  '/office-removalists-adelaide/', '/furniture-removalists-adelaide/',
  '/packing-services-adelaide/', '/prices/', '/about/', '/blog/', '/contact-us/'
];
const screenshotRoutes = new Set([
  '/', '/removalists-marion/', '/removalists-hyde-park/', '/removalists-malvern/',
  '/adelaide-to-brisbane-removals/', '/contact-us/'
]);
const viewports = [{ name: 'desktop', width: 1440, height: 1000 }, { name: 'mobile', width: 390, height: 844 }];

await mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
const results = [];
for (const viewport of viewports) {
  const context = await browser.newContext({ viewport });
  for (const route of routes) {
    const page = await context.newPage();
    const response = await page.goto(`${base}${route}`, { waitUntil: 'networkidle' });
    await page.addStyleTag({ content: '.reveal-on-scroll { opacity: 1 !important; transform: none !important; transition: none !important; }' });
    let mobileMenuReadable = null;
    if (viewport.name === 'mobile') {
      const trigger = page.locator('.mobile-menu-trigger').first();
      if (await trigger.isVisible().catch(() => false)) {
        await trigger.click();
        mobileMenuReadable = await page.locator('.mobile-nav-panel a, .mobile-nav-panel summary').evaluateAll((elements) => elements.filter((element) => {
          const style = getComputedStyle(element);
          return element.getBoundingClientRect().height > 0 && style.color !== style.backgroundColor;
        }).length);
        await trigger.click();
      }
    }
    const checks = await page.evaluate(() => {
      const visibleCount = (selector) => [...document.querySelectorAll(selector)].filter((element) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
      }).length;
      return {
        h1: visibleCount('main h1'), h2: visibleCount('main h2'), body: visibleCount('main p'),
        breadcrumbs: visibleCount('.breadcrumb'), eyebrows: visibleCount('.eyebrow, .proof-label'),
        ctas: visibleCount('.quote-strip, .conversion-cta-block, .lead-machine-cta'),
        cards: visibleCount('.card, .service-card, .value-card, .route-card, .guide-card, .proof-card'),
        faqs: visibleCount('.faq-item, details'), links: visibleCount('main a'), buttons: visibleCount('.button'),
        fields: visibleCount('input, select, textarea'), footerLinks: visibleCount('footer a')
      };
    });
    let screenshot = null;
    if (screenshotRoutes.has(route)) {
      const slug = route === '/' ? 'home' : route.replace(/^\//, '').replace(/\/$/, '');
      screenshot = `${out}/${slug}-${viewport.name}.png`;
      await page.screenshot({ path: screenshot, fullPage: true });
    }
    results.push({ route, viewport: viewport.name, status: response?.status(), finalUrl: page.url(), mobileMenuReadable, checks, screenshot });
    await page.close();
  }
  await context.close();
}
await browser.close();
await writeFile(`${out}/visual-qa-results.json`, JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
