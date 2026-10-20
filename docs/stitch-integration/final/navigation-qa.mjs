import { chromium, expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

const base = process.env.QA_BASE_URL || 'http://127.0.0.1:4180';
const browser = await chromium.launch();
const results = [];
try {
  for (const path of ['/about/', '/contact-us/']) {
    for (const width of [768, 1024]) {
      const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
      await page.route('**/*', route => new URL(route.request().url()).origin === new URL(base).origin
        ? route.continue() : route.abort());
      await page.goto(base + path);
      const trigger = page.locator('.mobile-menu-trigger');
      await trigger.focus();
      await page.keyboard.press('Enter');
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      await expect(page.locator('.mobile-nav-panel')).toBeVisible();
      await page.keyboard.press('Tab');
      await page.keyboard.press('Escape');
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await expect(trigger).toBeFocused();
      results.push({ path, width, keyboardOpen: true, escapeClose: true, focusRestored: true });
      await page.close();
    }
  }
} finally {
  await browser.close();
}
await writeFile('docs/stitch-integration/final/navigation-results.json', JSON.stringify(results, null, 2));
console.log(results);
