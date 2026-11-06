import { expect, test } from '@playwright/test';

// Set PW_VISUAL_ROUTES='/,/services,/contact' for project-specific pages.
// Keep the default safe for sites with only a homepage.
const routes = (process.env.PW_VISUAL_ROUTES ?? '/')
  .split(',')
  .map((route) => route.trim())
  .filter(Boolean);

for (const route of routes) {
  const slug = route === '/' ? 'home' : route.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '');

  test(`${route}: approved full-page visual baseline`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
    expect(response, `No navigation response received for ${route}`).not.toBeNull();
    expect(response!.status(), `Route ${route} returned an error`).toBeLessThan(400);

    await page.evaluate(async () => {
      await document.fonts.ready;
      // Trigger lazy-loaded elements at reproducible scroll positions.
      const step = Math.max(400, window.innerHeight);
      const height = document.documentElement.scrollHeight;
      for (let y = 0; y < height; y += step) {
        window.scrollTo(0, y);
        await new Promise<void>((resolve) => window.setTimeout(resolve, 70));
      }
      window.scrollTo(0, 0);
    });

    // Keep remote content and JS canvas animations deterministic within your project.
    await expect(page).toHaveScreenshot(`${slug}-full.png`, {
      fullPage: true,
    });
  });
}
