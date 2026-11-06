import { expect, test } from '@playwright/test';

test('homepage renders without uncaught page errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const response = await page.goto('/', { waitUntil: 'load' });
  expect(response, 'Missing navigation response').not.toBeNull();
  expect(response!.status()).toBeLessThan(400);
  await expect(page.locator('body')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
  expect(errors, 'Browser page errors').toEqual([]);
});

test('homepage has no broken loaded images', async ({ page }) => {
  await page.goto('/', { waitUntil: 'load' });
  const broken = await page.locator('img').evaluateAll((images) =>
    images
      .filter((image) => image.complete && image.naturalWidth === 0)
      .map((image) => image.currentSrc || image.src || '[missing-src]'),
  );
  expect(broken, 'Broken image URLs').toEqual([]);
});

test('homepage has no horizontal overflow at key breakpoints', async ({ page }, testInfo) => {
  // One browser project handles the full matrix, avoiding triple work.
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Run breakpoint matrix once');
  for (const width of [360, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const overflow = await page.evaluate(() =>
      Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
    );
    expect(overflow, `Horizontal overflow at ${width}px`).toBeLessThanOrEqual(1);
  }
});
