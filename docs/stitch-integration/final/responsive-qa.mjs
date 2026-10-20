import { chromium } from '@playwright/test';
import { writeFile, mkdir, readFile } from 'node:fs/promises';

const base = process.env.QA_BASE_URL || 'http://127.0.0.1:4180';
const output = 'docs/stitch-integration/final';
const routes = [
  ['home', '/'], ['glenelg', '/removalists-glenelg/'],
  ['norwood', '/removalists-norwood/'], ['adelaide', '/removalists-adelaide/'],
  ['interstate', '/interstate-removals-adelaide/'], ['sydney', '/adelaide-to-sydney-removals/'],
  ['perth', '/adelaide-to-perth-removals/'], ['brisbane', '/adelaide-to-brisbane-removals/'],
];
const widths = [320, 360, 375, 390, 430, 768, 1024, 1280, 1440, 1920];
const results = [];
const accessibility = [];
const axeSource = await readFile('node_modules/axe-core/axe.min.js', 'utf8');
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
try {
  for (const [name, path] of routes) {
    for (const width of widths) {
      const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
      // Never load GTM/Ads or send an external lead during visual inspection.
      await page.route('**/*', route => new URL(route.request().url()).origin === new URL(base).origin
        ? route.continue() : route.abort());
      const response = await page.goto(base + path);
      if (response.status() !== 200) throw new Error(`Route unavailable: ${path}`);
      await page.waitForFunction(() => getComputedStyle(document.body).fontFamily.includes('Inter'));
      await page.waitForSelector('#zq-chat-launcher');
      await page.evaluate(async () => {
        await document.fonts.ready;
        await Promise.all([...document.images].map(async image => {
          image.loading = 'eager';
          try { await image.decode(); } catch { /* Broken sources are asserted below. */ }
        }));
      });
      await page.evaluate(() => scrollTo({ top: 600, behavior: 'instant' }));
      await page.waitForTimeout(400);
      const metrics = await page.evaluate(() => {
        const rect = selector => {
          const element = document.querySelector(selector);
          if (!element || getComputedStyle(element).display === 'none') return null;
          const box = element.getBoundingClientRect();
          return { x: box.x, y: box.y, width: box.width, height: box.height, bottom: box.bottom, right: box.right };
        };
        const sticky = rect('.sticky-mobile-cta');
        const chat = rect('.zq-chat-launcher');
        return {
          height: document.documentElement.scrollHeight,
          overflow: document.documentElement.scrollWidth > innerWidth,
          sticky, chat,
          collision: !!(sticky && chat && sticky.x < chat.right && sticky.right > chat.x
            && sticky.y < chat.bottom && sticky.bottom > chat.y),
          brokenImages: [...document.images].filter(image => !image.complete || !image.naturalWidth).map(image => image.getAttribute('src')),
          nav: {
            desktop: getComputedStyle(document.querySelector('.desktop-nav')).display,
            mobile: getComputedStyle(document.querySelector('.mobile-nav')).display,
          },
        };
      });
      if ([390, 768, 1440].includes(width)) {
        await page.addScriptTag({ content: axeSource });
        const audit = await page.evaluate(() => axe.run(document, {
          runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
        }));
        accessibility.push({ name, width, passes: audit.passes.length, violations: audit.violations.map(violation => ({
          id: violation.id, impact: violation.impact, description: violation.description,
          nodes: violation.nodes.map(node => ({ target: node.target, summary: node.failureSummary })),
        })) });
      }
      await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
      await page.waitForTimeout(600);
      await page.screenshot({ path: `${output}/${name}-${width}.jpg`, fullPage: true, quality: 85 });
      if (name === 'home' && [390, 1440].includes(width)) {
        await page.screenshot({ path: `${output}/${name}-${width}.png`, fullPage: true });
      }
      results.push({ name, path, width, ...metrics });
      await page.close();
    }
    console.log(`Captured ${name} at ${widths.length} widths.`);
  }
} finally {
  await browser.close();
}
await writeFile(`${output}/responsive-results.json`, JSON.stringify(results, null, 2));
await writeFile(`${output}/accessibility-results.json`, JSON.stringify(accessibility, null, 2));
const failures = results.filter(result => result.overflow || result.collision || result.brokenImages.length
  || (result.width <= 1120 && (result.nav.desktop !== 'none' || result.nav.mobile === 'none')));
const accessibilityFailures = accessibility.filter(result => result.violations.length);
console.log(JSON.stringify({ failures, accessibilityFailures }, null, 2));
if (failures.length || accessibilityFailures.length) process.exitCode = 1;
