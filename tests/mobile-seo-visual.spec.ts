import { test, expect } from '@playwright/test';

const routes = [
  '/',
  '/moving-from-adelaide-cbd-to-salisbury/',
  '/adelaide-to-sydney-removalists/'
];

for (const route of routes) {
  test(`visual check for route: ${route}`, async ({ page }, testInfo) => {
    // Navigate to the route
    await page.goto(route);

    // Wait for network to be idle to ensure fonts/images are loaded
    await page.waitForLoadState('networkidle');

    // Hide sticky mobile CTA to avoid screenshot overlap
    await page.addStyleTag({ content: '.sticky-mobile-cta { display: none !important; }' });

    // Take a full page screenshot
    // Sanitise route for filename
    const sanitizedRoute = route === '/' ? 'home' : route.replace(/\//g, '-').replace(/^-|-$/g, '');
    const screenshotPath = `test-results/screenshots/${testInfo.project.name}-${sanitizedRoute}.png`;

    await page.screenshot({ path: screenshotPath, fullPage: true });

    // Ensure the page has an H1
    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible();
  });
}
