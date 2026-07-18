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

    const viewport = page.viewportSize();
    const overflow = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);

    if (route === '/') {
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('[data-service-card]')).toHaveCount(9);
      await expect(page.locator('.zq-v2-faq-list details')).toHaveCount(8);

      const menuTrigger = page.locator('.mobile-menu-trigger');
      await expect(menuTrigger).toBeVisible();
      await menuTrigger.click();
      await expect(menuTrigger).toHaveAttribute('aria-expanded', 'true');
      const menuPanel = page.locator('#mobile-nav-panel');
      await expect(menuPanel.getByRole('link', { name: 'About', exact: true })).toBeVisible();
      await expect(menuPanel.getByRole('link', { name: 'Reviews', exact: true })).toBeVisible();
      await expect(menuPanel.getByRole('link', { name: 'Contact', exact: true })).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(menuTrigger).toHaveAttribute('aria-expanded', 'false');

      if (viewport?.width === 390) {
        await expect(page.locator('.sticky-mobile-cta a[href="tel:+61433819989"]')).toBeVisible();
        await expect(page.locator('.sticky-mobile-cta a[href="/contact-us/#quote-form"]')).toBeVisible();
      }
    }

    const stickyCta = page.locator('.sticky-mobile-cta');
    await page.evaluate(() => window.scrollTo(0, 700));
    await expect(stickyCta).toHaveClass(/is-visible/);
    await page.waitForTimeout(500);
    await expect(stickyCta).toBeVisible();
    const stickyBox = await stickyCta.boundingBox();
    expect(stickyBox).not.toBeNull();
    const stickyBottom = await stickyCta.evaluate((node) => node.getBoundingClientRect().bottom);
    expect(stickyBottom).toBeLessThanOrEqual(await page.evaluate(() => window.innerHeight));

    // Exercise the complete responsive page and load below-fold lazy images before capture.
    await page.evaluate(async () => {
      for (let y = 0; y < document.documentElement.scrollHeight; y += window.innerHeight * 0.75) {
        window.scrollTo(0, y);
        await new Promise((resolve) => window.setTimeout(resolve, 40));
      }
      window.scrollTo(0, 0);
    });

    // Keep long-page screenshots focused on page content after validating the persistent CTA.
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
