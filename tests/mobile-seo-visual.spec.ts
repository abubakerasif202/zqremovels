import { test, expect } from '@playwright/test';

test('mobile chat sends a mocked message and keeps its composer visible in a reduced viewport', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'Mobile Chrome (390px)', 'Run the simulated keyboard viewport once.');
  let submissions = 0;
  await page.route('**/api/ai-chat/**', async route => {
    if (route.request().method() === 'POST') {
      submissions += 1;
      expect(route.request().postDataJSON()).toEqual({ message: 'Can you help with packing?' });
      await route.fulfill({ json: { reply: 'We can discuss packing when preparing your moving quote. '.repeat(20) } });
    } else await route.fulfill({ json: { messages: [] } });
  });
  await page.goto('/');
  await page.locator('#zq-chat-launcher').click();
  const input = page.getByRole('textbox', { name: 'Your message', exact: true });
  await input.fill('Can you help with packing?');
  // This checks a reduced visual area; physical iOS/Android keyboard behavior remains a device check.
  await page.setViewportSize({ width: 390, height: 430 });
  await page.locator('.zq-chat-send').click();
  await expect(page.locator('.zq-chat-bubble[data-role="assistant"]').last()).toContainText('We can discuss packing');
  expect(submissions).toBe(1);
  await expect(input).toBeFocused();
  const box = await input.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.y + box!.height).toBeLessThanOrEqual(430);
  const send = await page.locator('.zq-chat-send').boundingBox();
  expect(send!.y + send!.height).toBeLessThanOrEqual(430);
  expect(send!.height).toBeLessThanOrEqual(56);
  await expect(page.locator('.zq-chat-send')).toHaveCSS('border-radius', '12px');
  expect(await page.locator('.zq-chat-send').evaluate(node => getComputedStyle(node, '::after').content)).toBe('none');
  const scroll = await page.locator('.zq-chat-messages').evaluate(node => ({ top: node.scrollTop, height: node.scrollHeight, client: node.clientHeight }));
  expect(scroll.height - scroll.client - scroll.top).toBeLessThanOrEqual(2);
});

test('chat keeps keyboard focus and enquiry controls inside the visible panel', async ({ page }) => {
  await page.route('**/api/ai-chat/**', route => route.fulfill({ json: { messages: [] } }));
  await page.goto('/');
  const launcher = page.locator('#zq-chat-launcher');
  await launcher.click();
  const panel = page.locator('#zq-chat-window');
  await expect(panel).toBeVisible();
  await panel.getByRole('link', { name: 'Call us', exact: true }).focus();
  await page.keyboard.press('Tab');
  await expect(panel.getByRole('button', { name: 'Start a new conversation' })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(panel.getByRole('link', { name: 'Call us', exact: true })).toBeFocused();
  await panel.getByRole('button', { name: 'Send enquiry', exact: true }).click();
  await expect(panel.getByLabel('Full name', { exact: true })).toBeFocused();
  await expect(panel.locator('.zq-chat-foot')).toHaveAttribute('inert', '');
  await panel.getByRole('button', { name: 'Back to chat', exact: true }).last().click();
  await expect(panel.locator('.zq-chat-foot')).not.toHaveAttribute('inert', '');
  await page.keyboard.press('Escape');
  await expect(panel).toBeHidden();
  await expect(launcher).toBeFocused();
});

const routes = [
  '/',
  '/removalists-adelaide/',
  // The historical CBD-to-Salisbury URL is a Vercel redirect, not a rendered page.
  '/removalists-southern-adelaide/',
  '/adelaide-to-sydney-removalists/',
  '/house-removals-adelaide/',
  '/adelaide-moving-guides/',
  '/about/',
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

    if (route === '/adelaide-moving-guides/') {
      await expect(page.locator('.hero-section .step-card')).toHaveCount(0);
      const headingBox = await page.locator('h1').boundingBox();
      expect(headingBox).not.toBeNull();
      expect(headingBox!.y).toBeLessThan(viewport!.height);
    }
    if (viewport && viewport.width > 1023) {
      for (const link of await page.locator('.desktop-nav > .nav-link').all()) {
        await expect(link).toHaveCSS('color', 'rgb(32, 55, 75)');
      }
    }

    if (route === '/') {
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('[data-service-card]')).toHaveCount(9);
      await expect(page.locator('.zq-v2-faq-list details')).toHaveCount(8);
      for (const packageText of await page.locator('form[data-quote-form="quote"] .quote-package-group :is(legend,.field-note)').all()) {
        await expect(packageText).toHaveCSS('color', 'rgb(32, 55, 75)');
      }

      if (viewport && viewport.width <= 768) {
        const menuTrigger = page.locator('.mobile-menu-trigger');
        await expect(menuTrigger).toBeVisible();
        await menuTrigger.click();
        await expect(menuTrigger).toHaveAttribute('aria-expanded', 'true');
        const menuPanel = page.locator('#mobile-nav-panel');
        for (const heading of await menuPanel.locator('.mobile-nav-heading').all()) {
          await expect(heading).toHaveCSS('color', 'rgb(16, 43, 67)');
        }
        await expect(menuPanel.getByRole('link', { name: 'About', exact: true })).toBeVisible();
        await expect(menuPanel.getByRole('link', { name: 'Reviews', exact: true })).toBeVisible();
        await expect(menuPanel.getByRole('link', { name: 'Contact', exact: true })).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(menuTrigger).toHaveAttribute('aria-expanded', 'false');
      }

      if (viewport?.width === 390) {
        await expect(page.locator('.sticky-mobile-cta a[href="tel:+61433819989"]')).toBeVisible();
        await expect(page.locator('.sticky-mobile-cta a[href="/contact-us/#quote-form"]')).toBeVisible();
      }
    }

    for (const link of await page.locator('main > :is(.section-dark,.section-dark-plan,.section-reassurance-pull) a:not(.button,.btn,.zq-v2-button)').all()) {
      await expect(link).toHaveCSS('color', 'rgb(255, 173, 115)');
    }

    if (viewport && viewport.width <= 768) {
      const stickyCta = page.locator('.sticky-mobile-cta');
      await page.evaluate(() => window.scrollTo(0, 700));
      await expect(stickyCta).toHaveClass(/is-visible/);
      await page.waitForTimeout(500);
      await expect(stickyCta).toBeVisible();
      const stickyBox = await stickyCta.boundingBox();
      expect(stickyBox).not.toBeNull();
      const stickyBottom = await stickyCta.evaluate((node) => node.getBoundingClientRect().bottom);
      expect(stickyBottom).toBeLessThanOrEqual(await page.evaluate(() => window.innerHeight));
    }

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

for (const route of ['/', '/contact-us/', '/house-removals-adelaide/', '/removalists-southern-adelaide/', '/adelaide-moving-guides/', '/privacy-policy/']) {
  test(`small phone layout stays usable: ${route}`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'Mobile Chrome (375px)', 'Run the additional 320px boundary once per route.');
    await page.setViewportSize({ width: 320, height: 740 });
    const response = await page.goto(route);
    expect(response?.ok()).toBe(true);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toBeVisible();
    const widths = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, document: document.documentElement.scrollWidth }));
    expect(widths.document).toBeLessThanOrEqual(widths.viewport);
    const menu = page.locator('.mobile-menu-trigger');
    await expect(menu).toBeVisible();
    await menu.click();
    await expect(menu).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#mobile-nav-panel').getByRole('link', { name: 'Contact', exact: true })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(menu).toHaveAttribute('aria-expanded', 'false');
    for (const form of await page.locator('form[data-quote-form="quote"]').all()) {
      await expect(form.locator('button[type="submit"]')).toBeVisible();
      const box = await form.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(320);
    }
  });
}

test('entrances remain visible, run once, and stop for reduced motion', async ({ page }) => {
  await page.goto('/');
  const card = page.locator('.zq-v2-service-card').first();
  await expect(card).toHaveCSS('opacity', '1');
  await card.evaluate(node => {
    (window as any).__entranceCount = 0;
    node.addEventListener('animationstart', () => { (window as any).__entranceCount += 1; });
  });
  await card.scrollIntoViewIfNeeded();
  await expect.poll(() => page.evaluate(() => (window as any).__entranceCount)).toBe(1);
  await expect(card).not.toHaveClass(/animate__animated/);
  await page.evaluate(() => window.scrollTo(0, 0));
  await card.scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => (window as any).__entranceCount)).toBe(1);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();
  await card.scrollIntoViewIfNeeded();
  await expect(card).toHaveCSS('opacity', '1');
  await expect(page.locator('.zq-entrance')).toHaveCount(0);
});

test('homepage content stays visible without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 375, height: 812 } });
  const page = await context.newPage();
  await page.goto(baseURL + '/');
  await expect(page.locator('h1')).toBeVisible();
  const card = page.locator('.zq-v2-service-card').first();
  await card.scrollIntoViewIfNeeded();
  await expect(card).toHaveCSS('opacity', '1');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await context.close();
});
